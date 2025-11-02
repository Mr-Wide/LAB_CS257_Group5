import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';


BigInt.prototype.toJSON = function() {
  return this.toString();
};

const app = express();
app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();

//added extra
app.get('/', (req, res) => {
  res.json({ message: 'Railway Management System API' });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

//register endpoint
// Register endpoint - UPDATED FOR FULL NAME
// Register endpoint - FIXED TO EXPECT firstName/lastName
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body; // Expect firstName/lastName
    console.log('Registration attempt:', { email, firstName, lastName });

    // Check if email already exists
    const existingEmail = await prisma.useremail.findFirst({
      where: { Email: email }
    });

    if (existingEmail) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Generate unique username
    const baseUsername = (firstName.toLowerCase() + lastName.toLowerCase()).replace(/\s+/g, '');
    let username = baseUsername || 'user';
    let counter = 1;

    console.log('Checking username availability:', username);

    // Ensure username is unique
    let userExists = await prisma.user.findUnique({ 
      where: { Username: username } 
    });
    
    while (userExists) {
      username = `${baseUsername}${counter}`;
      counter++;
      userExists = await prisma.user.findUnique({ 
        where: { Username: username } 
      });
    }

    console.log('Username available:', username);

    // Calculate age from DOB (using a default DOB for now)
    const dob = new Date('1990-01-01');
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();

    // Create user in database
    const user = await prisma.user.create({
      data: {
        Username: username,
        First_name: firstName,
        Last_name: lastName,
        DOB: dob,
        Age: age,
        Passkey: password,
      },
    });

    // Add email
    await prisma.useremail.create({
      data: {
        Username: username,
        Email: email,
      },
    });

    // Add phone if provided
    if (phone) {
      await prisma.userphone.create({
        data: {
          Username: username,
          Mobile_no: BigInt(phone.replace(/\D/g, '')),
        },
      });
    }

    // Get the complete user data
    const completeUser = await prisma.user.findUnique({
      where: { Username: username },
      include: {
        useremail: true,
        userphone: true,
      },
    });

    console.log('User registered successfully:', username);
    res.json({
      message: 'Registration successful',
      user: completeUser,
    });

  } catch (error) {
    console.error('REGISTRATION ERROR:', error);
    res.status(500).json({ error: 'Registration failed: ' + error.message });
  }
});

// LOGIN ENDPOINT - MOVED AFTER app AND prisma ARE DEFINED 
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body; // Change to email
    console.log('Login attempt for email:', email);

    // Find user by email (from useremail table)
    const userEmail = await prisma.useremail.findFirst({
      where: { Email: email },
      include: {
        user: {
          include: {
            useremail: true,
            userphone: true
          }
        }
      }
    });

    console.log('User found by email:', userEmail ? 'Yes' : 'No');

    if (!userEmail || !userEmail.user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = userEmail.user;

    console.log('Checking password...');
    console.log('Database password:', user.Passkey);
    console.log('Provided password:', password);

    if (user.Passkey !== password) {
      console.log('Password mismatch');
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Convert BigInt to String for JSON response
    const userResponse = {
      Username: user.Username,
      First_name: user.First_name,
      Last_name: user.Last_name,
      DOB: user.DOB,
      Age: user.Age,
      useremail: user.useremail,
      userphone: user.userphone.map(phone => ({
        ...phone,
        Mobile_no: phone.Mobile_no.toString()
      }))
    };

    console.log('Login successful for:', user.Username);
    res.json({
      message: 'Login successful',
      user: userResponse
    });

  } catch (error) {
    console.error('LOGIN ERROR:', error);
    res.status(500).json({ error: 'Login failed: ' + error.message });
  }
});

//user booking api
// Get all bookings for a user
app.get('/api/bookings', async (req, res) => {
  try {
    const { username } = req.query;
    console.log('Fetching bookings for:', username);

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Get tickets from database using your exact schema
    const tickets = await prisma.ticket.findMany({
      where: { 
        Username: username 
      },
      include: {
        train: {
          include: {
            route: true
          }
        },
        user: true
      }
    });

    console.log(`Found ${tickets.length} tickets for ${username}`);

    // Convert to frontend format
    const bookings = tickets.map(ticket => ({
      id: ticket.PNR_No, // Use PNR as ID
      pnrNumber: ticket.PNR_No,
      trainId: ticket.Train_no.toString(),
      passengerName: `${ticket.user?.First_name} ${ticket.user?.Last_name}`,
      numSeats: ticket.No_of_seats_booked,
      totalFare: ticket.Fare,
      travelDate: new Date().toISOString().split('T')[0], // Default to today
      bookingStatus: 'confirmed',
      paymentStatus: 'paid'
    }));

    res.json(bookings);

  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Create a new booking. I have updated this to allow dynamic seat booking
// the booking endpoint
app.post('/api/bookings', async (req, res) => {
  try {
    const { 
      trainId, 
      username, 
      numSeats, 
      totalFare,
      passengerName,
      coachType = 'general'
    } = req.body;

    console.log('Creating booking:', { trainId, username, numSeats, totalFare, coachType });

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { Username: username }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // In your booking endpoint, add this validation:
    const schedule = await prisma.schedule.findFirst({
      where: {
        Train_no: parseInt(trainId),
        Date: new Date(bookingDetails.travelDate) // You'll need to pass travelDate from frontend
      }
    });

    if (!schedule) {
      return res.status(400).json({ error: 'Train not available on selected date' });
    }

    // Create transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Get available seats for the specific coach type
    const availableSeatsList = await tx.seat.findMany({
        where: {
          Train_no: parseInt(trainId),
          Available_seats: 1
        },
        take: numSeats
      });

      console.log(`Found ${availableSeatsList.length} available seats, need ${numSeats}`);

      if (availableSeatsList.length < numSeats) {
        throw new Error(`Not enough seats available. Found ${availableSeatsList.length}, needed ${numSeats}`);
      }

      // Mark each specific seat as unavailable
      for (const seat of availableSeatsList) {
        await tx.seat.update({
          where: {
            Train_no_Coach_no_Coach_class_Seat_no: {
              Train_no: seat.Train_no,
              Coach_no: seat.Coach_no,
              Coach_class: seat.Coach_class,
              Seat_no: seat.Seat_no
            }
          },
          data: {
            Available_seats: 0
          }
        });
        console.log(`Marked seat ${seat.Seat_no} in coach ${seat.Coach_no} as unavailable`);
      }

      // Create ticket
      const ticket = await tx.ticket.create({
        data: {
          PNR_No: generatePNR(),
          Fare: totalFare,
          No_of_seats_booked: numSeats,
          Username: username,
          Train_no: parseInt(trainId)
        },
        include: {
          train: {
            include: {
              route: true,
              schedule: true
            }
          },
          user: true
        }
      });

      return ticket;
    });

    console.log('Ticket created successfully:', result.PNR_No);

    // Return in frontend format
    const booking = {
      id: result.PNR_No,
      pnrNumber: result.PNR_No,
      trainId: result.Train_no.toString(),
      passengerName: passengerName || `${result.user?.First_name} ${result.user?.Last_name}`,
      numSeats: result.No_of_seats_booked,
      totalFare: result.Fare,
      travelDate: result.train.schedule[0]?.Date || new Date().toISOString().split('T')[0],
      bookingStatus: 'confirmed',
      paymentStatus: 'paid'
    };

    res.json(booking);

  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking: ' + error.message });
  }
});

// "Cancel" booking by deleting it (since no status field)
// Fix the cancel booking endpoint to restore seats
// Simplified cancel booking endpoint - no waiting list handling
app.delete('/api/bookings/:pnr', async (req, res) => {
  try {
    const { pnr } = req.params;
    console.log('Cancelling booking:', pnr);

    // First check if booking exists
    const ticket = await prisma.ticket.findUnique({
      where: { 
        PNR_No: pnr 
      },
      include: {
        train: true
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Use transaction
    await prisma.$transaction(async (tx) => {
      // Restore the seats
      await tx.seat.updateMany({
        where: {
          Train_no: ticket.Train_no,
          Available_seats: 0
        },
        data: {
          Available_seats: 1
        }
      });

      // Delete the ticket
      await tx.ticket.delete({
        where: { 
          PNR_No: pnr 
        }
      });
    });

    console.log('Booking cancelled and seats restored:', pnr);
    res.json({ message: 'Booking cancelled successfully' });

  } catch (error) {
    console.error('Error deleting booking:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Booking not found' });
    } else if (error.code === 'P2003') {
      return res.status(400).json({ error: 'Cannot cancel booking - it is referenced in waiting list' });
    }
    
    res.status(500).json({ error: 'Failed to cancel booking: ' + error.message });
  }
});

// schedule fix
app.get('/api/trains/:trainNo/available-dates', async (req, res) => {
  try {
    const trainNo = parseInt(req.params.trainNo);
    
    const schedules = await prisma.schedule.findMany({
      where: {
        Train_no: trainNo
      },
      select: {
        Date: true,
        WeekDay: true
      },
      orderBy: {
        Date: 'asc'
      }
    });

    const availableDates = schedules.map(s => ({
      date: s.Date.toISOString().split('T')[0],
      day: s.WeekDay
    }));

    res.json(availableDates);
  } catch (error) {
    console.error('Error fetching available dates:', error);
    res.status(500).json({ error: 'Failed to fetch available dates' });
  }
});



// Improved trains endpoint with real data
app.get('/api/trains', async (req, res) => {
  try {
    const { date } = req.query; // Optional: filter by specific date
    const travelDate = date ? new Date(date) : new Date();

    const trains = await prisma.train.findMany({
      include: {
        route: true,
        schedule: {
          where:date?{
            Date: {
              equals: travelDate
            }
          }: {} //if no date is specified, get all schedules
        },
        coach: {
          include: {
            seat: true
          }
        },
        goesto: {
          orderBy: {
            Departure_time: 'asc'
          }
        }
      },
    });

    const mappedTrains = trains.map(train => {
      // Use actual station data from goesto
      const stops = train.goesto || [];
      const sourceStation = stops[0]?.Station_name || 'Unknown';
      const destinationStation = stops[stops.length - 1]?.Station_name || 'Unknown';
      
      // Use actual times from schedule
      const schedule = train.schedule[0];
      const departureTime = schedule ? formatTime(schedule.Start_time) : 'Unknown';
      const arrivalTime = schedule ? formatTime(schedule.End_time) : 'Unknown';
      const travelDuration = schedule ? calcDuration(schedule.Start_time, schedule.End_time) : 'Unknown';
      const daysOfOperation=Array.from(new Set(train.schedule.map(s=>s.WeekDay)));

      // Calculate available seats dynamically
      let totalSeats = 0;
      let availableSeats = 0;
      
      train.coach.forEach(coach => {
        coach.seat.forEach(seat => {
          totalSeats++; //each row is one physical seat
          if(seat.Available_seats ===1){
            availableSeats++;
          }
        });
      });

      return {
        id: train.Train_no.toString(),
        trainNumber: train.Train_no.toString(),
        trainName: train.Train_name,
        sourceStation, 
        destinationStation, 
        departureTime, 
        arrivalTime, 
        travelDuration, 
        totalSeats,
        availableSeats,
        baseFare: calculateBaseFare(train.route?.Distance), // Dynamic fare
        acAvailable: hasACClass(train.coach),
        acFare: calculateACFare(train.route?.Distance),
        daysOfOperation: daysOfOperation.length>0? daysOfOperation: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
        scheduleDate: schedule?.Date || travelDate.toISOString().split('T')[0],
        status: availableSeats>0? 'active' : 'sold-out'
      };
    });

    res.json(mappedTrains);
  } catch (error) {
    console.error('Error fetching trains:', error);
    res.status(500).json({ error: 'Failed to fetch trains' });
  }
});

// Get available seats for a specific train
// Get available seats for a specific train with real-time availability
app.get('/api/trains/:trainNo/seats', async (req, res) => {
  try {
    const { date } = req.query;
    const trainNo = parseInt(req.params.trainNo);
    
    const seats = await prisma.seat.findMany({
      where: {
        Train_no: trainNo,
        Available_seats: { gt: 0 }
      },
      include: {
        coach: true
      }
    });

    // If date is provided, check if train operates on that date
    if (date) {
      const schedule = await prisma.schedule.findFirst({
        where: {
          Train_no: trainNo,
          Date: new Date(date)
        }
      });

      if (!schedule) {
        return res.status(404).json({ error: 'Train not available on selected date' });
      }
    }

    res.json(seats);
  } catch (error) {
    console.error('Error fetching seats:', error);
    res.status(500).json({ error: 'Failed to fetch seats' });
  }
});

// Book a ticket
app.post('/api/tickets', async (req, res) => {
  try {
    const { trainNo, username, seats, fare } = req.body;
    
    const ticket = await prisma.ticket.create({
      data: {
        PNR_No: generatePNR(),
        Fare: fare,
        No_of_seats_booked: seats.length,
        Username: username,
        Train_no: trainNo
      }
    });
    
    res.json(ticket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Failed to book ticket' });
  }
});

// Get trains for specific date
app.get('/api/trains/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const travelDate = new Date(date);
    
    const trains = await prisma.train.findMany({
      include: {
        route: true,
        schedule: {
          where: {
            Date: {equals:travelDate}
          }
        },
        coach: {
          include: {
            seat: true
          }
        },
        goesto: {
          orderBy: {
            Departure_time: 'asc'
          }
        }
      }
    });

    // Filter trains that operate on this date
    const availableTrains = trains.filter(train => train.schedule.length > 0);
    
    res.json(availableTrains.map(train => ({
      id: train.Train_no.toString(),
      trainNumber: train.Train_no.toString(),
      trainName: train.Train_name,
      sourceStation: train.goesto[0]?.Station_name || 'Unknown',
      destinationStation: train.goesto[train.goesto.length - 1]?.Station_name || 'Unknown',
      departureTime: formatTime(train.schedule[0].Start_time),
      arrivalTime: formatTime(train.schedule[0].End_time),
      travelDuration: calcDuration(train.schedule[0].Start_time, train.schedule[0].End_time),
      availableSeats: train.coach.reduce((sum, coach) => 
        sum + coach.seat.reduce((seatSum, seat) => seatSum + seat.Available_seats, 0), 0
      )
    })));
  } catch (error) {
    console.error('Error fetching trains by date:', error);
    res.status(500).json({ error: 'Failed to fetch trains' });
  }
});

// Helper functions
function formatTime(timeValue) {
  if (!timeValue) return 'Unknown';
  
  // Handle both Date objects and time strings
  if (timeValue instanceof Date) {
    return timeValue.toTimeString().slice(0, 5);
  } else if (typeof timeValue === 'string') {
    return timeValue.slice(0, 5); // Extract HH:MM from HH:MM:SS
  }
  return 'Unknown';
}


function calcDuration(startTime, endTime) {
  if (!startTime || !endTime) return 'Unknown';
  
  // Convert to Date objects if they're strings
  const start = typeof startTime === 'string' ? 
    new Date(`1970-01-01T${startTime}`) : startTime;
  const end = typeof endTime === 'string' ? 
    new Date(`1970-01-01T${endTime}`) : endTime;

  // Handle overnight journeys
  let diffMs = end - start;
  if (diffMs < 0) {
    diffMs += 24 * 60 * 60 * 1000; // Add 24 hours for next day
  }
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

function calculateBaseFare(distance) {
  return distance ? Math.round(distance * 2) : 1200; // ₹2 per km
}

function hasACClass(coaches) {
  return coaches.some(coach => 
    coach.Coach_class && (coach.Coach_class.includes('AC') || coach.Coach_class.includes('ac'))
  );
}

function calculateACFare(distance) {
  return distance ? Math.round(distance * 4) : 2400; // ₹4 per km for AC
}

function getDaysFromSchedule(schedules) {
  if (!schedules || schedules.length === 0) return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const days = schedules.map(s => s.WeekDay).filter(Boolean);
  return Array.from(new Set(days));
}

function generatePNR() {
  return 'PNR' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});