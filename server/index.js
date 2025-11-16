import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

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
    // Fix: Validate names and handle empty last names
    const baseUsername = (firstName.toLowerCase() + (lastName || '').toLowerCase()).replace(/\s+/g, '') || 'user';
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
            route: true,
            schedule: true //remove this if it creates error
          }
        },
        user: true,
        ticket_seat:true //this is to include the seat info
      }
    });

    console.log(`Found ${tickets.length} tickets for ${username}`);

    // Convert to frontend format
    const bookings = tickets.map(ticket => ({
      id: ticket.PNR_No,
      pnrNumber: ticket.PNR_No,
      trainId: ticket.Train_no.toString(),
      passengerName: `${ticket.user?.First_name} ${ticket.user?.Last_name}`,
      numSeats: ticket.No_of_seats_booked,
      totalFare: ticket.Fare,
      travelDate: new Date().toISOString().split('T')[0], // You might want to get this from schedule
      bookingStatus: 'confirmed',
      paymentStatus: 'paid',
      isAc: ticket.ticket_seat.some(ts => ts.Coach_class === 'AC'),
      bookedSeats: ticket.ticket_seat.map(ts => ({
        coachNo: ts.Coach_no,
        seatNo: ts.Seat_no,
        coachClass: ts.Coach_class
      }))
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
    console.log('📦 FULL REQUEST BODY:', req.body);
    const { 
      trainId, 
      username, 
      numSeats, 
      totalFare,
      passengerName,
      coachType = 'general',
      travelDate,
      fromStation,
      toStation
    } = req.body;

    console.log('Coach type received:', coachType);
    const normalizedCoachType = coachType === 'ac' ? 'AC' : 'General';
    console.log('Normalized coach type:', normalizedCoachType);

    console.log('Creating booking:', { trainId, username, numSeats, totalFare, coachType,travelDate });

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { Username: username }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // check if train operates on selected date
    const schedule = await prisma.schedule.findFirst({
      where: {
        Train_no: parseInt(trainId),
        Date: new Date(travelDate) // You'll need to pass travelDate from frontend
      }
    });

    if (!schedule) {
      return res.status(400).json({ error: 'Train not available on selected date' });
    }

    // Create transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Get stop orders for requested journey
      const { fromOrder, toOrder } = await getStopOrders(parseInt(trainId), fromStation, toStation);
      console.log(`Journey: ${fromStation}(${fromOrder}) → ${toStation}(${toOrder})`);

      // Find all seats of requested type
      const allSeats = await tx.seat.findMany({
        where: {
          Train_no: parseInt(trainId),
          Coach_class: coachType === 'ac' ? { contains: 'AC' } : { not: { contains: 'AC' } }
        },
        include: {
          ticket_seat: {
            include: {
              ticket: {
                select: { From_Station: true, To_Station: true }
              }
            }
          }
        }
      });

    // Filter seats without overlapping journeys
    const availableSeats = [];
    for (const seat of allSeats) {
      let isAvailable = true;
      
      // Check all existing bookings for this seat
      for (const ticketSeat of seat.ticket_seat) {

      // Only check if the ticket has station information
        if (ticketSeat.ticket.From_Station && ticketSeat.ticket.To_Station) {

        const existingFromOrder = await getStopOrder(parseInt(trainId), ticketSeat.ticket.From_Station);
        const existingToOrder = await getStopOrder(parseInt(trainId), ticketSeat.ticket.To_Station);
        
        if (existingFromOrder !== null && existingToOrder !== null) {

        if (hasStopOrderOverlap(fromOrder, toOrder, existingFromOrder, existingToOrder)) {
          isAvailable = false;
          break;
        }
      }
    }
  }
      
      if (isAvailable) {
        availableSeats.push(seat);
        if (availableSeats.length >= numSeats) break;
      }
    }

    console.log(`Found ${availableSeats.length} available seats without stop order conflicts`);

    if (availableSeats.length < numSeats) {
      const waitPNR = generatePNR();
      await tx.waiting_list.create({ data: { PNR_No: waitPNR } 
      });

      return res.json({
        message: 'Not enough seats available. Added to waiting list.',
        showWaitingList: true,
        PNR_No: waitPNR
      });
    }

    // Generate PNR and create ticket (your existing code)
    const pnrNumber = generatePNR();

    const ticket = await tx.ticket.create({
      data: {
        PNR_No: pnrNumber,
        Fare: totalFare,
        No_of_seats_booked: numSeats,
        Username: username,
        Train_no: parseInt(trainId),
        From_Station: fromStation,  // Store stations for future overlap checks
        To_Station: toStation
      }
    });

    // Mark seats and create ticket_seat records (your existing code)
    for (const seat of availableSeats.slice(0, numSeats)) {
      await tx.seat.update({
        where: {
          Train_no_Coach_no_Coach_class_Seat_no: {
            Train_no: seat.Train_no,
            Coach_no: seat.Coach_no,
            Coach_class: seat.Coach_class,
            Seat_no: seat.Seat_no
          }
        },
        data: { Available_seats: 0 }
      });

      await tx.ticket_seat.create({
        data: {
          PNR_No: pnrNumber,
          Train_no: seat.Train_no,
          Coach_no: seat.Coach_no,
          Coach_class: seat.Coach_class,
          Seat_no: seat.Seat_no
        }
      });
    }

    return { ticket, bookedSeats: availableSeats.slice(0, numSeats) };
  });

    console.log('Ticket created successfully:', result.ticket.PNR_No);

    

    // Return in frontend format
    const booking = {
      id: result.ticket.PNR_No,
      pnrNumber: result.ticket.PNR_No,
      trainId: result.ticket.Train_no.toString(),
      passengerName: passengerName || `${user.First_name} ${user.Last_name}`, // Use the user from earlier
      numSeats: result.ticket.No_of_seats_booked,
      totalFare: result.ticket.Fare,
      travelDate: travelDate, // Use the travelDate from request
      bookingStatus: 'confirmed',
      paymentStatus: 'paid',
      fromStation: fromStation,
      toStation: toStation,
      bookedSeats: result.bookedSeats.map(seat => ({ 
        coachNo: seat.Coach_no,
        seatNo: seat.Seat_no,
        coachClass: seat.Coach_class
      }))
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

    await prisma.$transaction(async (tx) => {
      // Get the ticket being cancelled
      const ticket = await tx.ticket.findUnique({
        where: { PNR_No: pnr },
        include: {
          ticket_seat: {
            include: {
              seat: true
            }
          }
        }
      });

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      // Delete from Ticket_Seat (this removes the seat association)
      await tx.ticket_seat.deleteMany({
        where: { PNR_No: pnr }
      });

      // For each seat that was used by this ticket, check if it's still occupied
      for (const ticketSeat of ticket.ticket_seat) {
        // Check if this seat has any other active bookings
        const otherBookingsForThisSeat = await tx.ticket_seat.count({
          where: {
            Train_no: ticketSeat.Train_no,
            Coach_no: ticketSeat.Coach_no, 
            Seat_no: ticketSeat.Seat_no,
            PNR_No: { not: pnr } // Exclude the cancelled booking
          }
        });

        // Only mark as available if NO other bookings use this seat
        if (otherBookingsForThisSeat === 0) {
          await tx.seat.update({
            where: {
              Train_no_Coach_no_Coach_class_Seat_no: {
                Train_no: ticketSeat.Train_no,
                Coach_no: ticketSeat.Coach_no,
                Coach_class: ticketSeat.seat.Coach_class,
                Seat_no: ticketSeat.Seat_no
              }
            },
            data: { Available_seats: 1 }
          });
          console.log(`✅ Seat ${ticketSeat.Seat_no} marked as available (no other bookings)`);
        } else {
          console.log(`🚫 Seat ${ticketSeat.Seat_no} remains occupied by ${otherBookingsForThisSeat} other booking(s)`);
        }
      }

      // Delete the ticket
      await tx.ticket.delete({
        where: { PNR_No: pnr }
      });
    });

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
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

//search logic like weighted graph
// Search trains between two stations
app.get('/api/trains/search', async (req, res) => {
  try {
    const { from, to, date } = req.query;
    
    if (!from || !to) {
      return res.status(400).json({ error: 'From and to stations are required' });
    }

    console.log(`Searching trains from ${from} to ${to} on ${date}`);

    // Find trains that go through both stations
    const trains = await prisma.train.findMany({
      where: {
        AND: [
          {
            goesto: {
              some: {
                Station_name: from
              }
            }
          },
          {
            goesto: {
              some: {
                Station_name: to
              }
            }
          }
        ]
      },
      include: {
        route: {
          include: {
            route_edge: true, // Get ALL route edges for this route
            route_station: {
              orderBy: {
                Stop_Order: 'asc'
              }
            }
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
        },
        schedule: date ? {
          where: {
            Date: new Date(date)
          }
        } : true
      }
    });

    console.log(`Found ${trains.length} trains passing through both stations`);

    // Filter and calculate costs for each train
    const mappedTrains = trains.map(train => {
      if (!train.route?.route_station || !train.route?.route_edge) return null;
      
      const routeStations = train.route.route_station;
      const routeEdges = train.route.route_edge;
      
      // Find station positions in the route
      const fromIndex = routeStations.findIndex(rs => rs.Station_name === from);
      const toIndex = routeStations.findIndex(rs => rs.Station_name === to);
      
      // Skip if stations not found or in wrong order
      if (fromIndex === -1 || toIndex === -1 || fromIndex >= toIndex) return null;
      
      // Calculate total distance and fare by summing intermediate segments
      let totalDistance = 0;
      let totalBaseFare = 0;
      let totalACFare = 0;
      
      for (let i = fromIndex; i < toIndex; i++) {
        const currentStation = routeStations[i].Station_name;
        const nextStation = routeStations[i + 1].Station_name;
        
        // Find the edge between current and next station
        const edge = routeEdges.find(re => 
          re.From_Station === currentStation && re.To_Station === nextStation
        );
        
        if (edge) {
          totalDistance += edge.Segment_Distance;
          totalBaseFare += Math.round(edge.Segment_Distance * 2); // ₹2 per km
          totalACFare += Math.round(edge.Segment_Distance * 4);   // ₹4 per km for AC
        }
      }
      
      // If no edges found, use fallback calculation
      if (totalDistance === 0) {
        const fallbackDistance = (toIndex - fromIndex) * 100; // Approximate 100km per segment
        totalBaseFare = Math.round(fallbackDistance * 2);
        totalACFare = Math.round(fallbackDistance * 4);
      }
      
      const fromStop = train.goesto.find(g => g.Station_name === from);
      const toStop = train.goesto.find(g => g.Station_name === to);
      
      const schedule = Array.isArray(train.schedule) ? train.schedule[0] : train.schedule;
      
      // Calculate available seats
      let totalSeats = 0;
      let availableSeats = 0;
      let acSeatsAvailable = 0;
      let generalSeatsAvailable = 0;
      let hasAC = false;
      
      train.coach.forEach(coach => {
        coach.seat.forEach(seat => {
          totalSeats++;
          if(seat.Available_seats === 1) {
            availableSeats++;
            
            // Count by coach type - FIXED LOGIC
            const coachClass = seat.Coach_class?.toLowerCase() || '';
            if (coachClass.includes('ac')) {
              acSeatsAvailable++;
              hasAC = true;
            } else {
              generalSeatsAvailable++;
            }
          }
        });
      });

      return {
        id: train.Train_no.toString(),
        trainNumber: train.Train_no.toString(),
        trainName: train.Train_name,
        sourceStation: from,
        destinationStation: to,
        departureTime: fromStop ? formatTime(fromStop.Departure_time) : 'Unknown',
        arrivalTime: toStop ? formatTime(toStop.Arrival_time) : 'Unknown',
        travelDuration: fromStop && toStop ? calcDuration(fromStop.Departure_time, toStop.Arrival_time) : 'Unknown',
        totalSeats,
        availableSeats,
        acSeatsAvailable,
        generalSeatsAvailable,
        baseFare: totalBaseFare,
        acAvailable: hasAC,
        acFare: totalACFare,
        scheduleDate: schedule?.Date ? schedule.Date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        status: availableSeats > 0 ? 'active' : 'sold-out',
        totalDistance: totalDistance,
        segmentCount: toIndex - fromIndex
      };
    }).filter(train => train !== null); // Remove null entries

    console.log(`Returning ${mappedTrains.length} trains with proper fare calculation`);
    res.json(mappedTrains);

  } catch (error) {
    console.error('Error searching trains:', error);
    res.status(500).json({ error: 'Failed to search trains: ' + error.message });
  }
});

// Add this to index.js to see all available stations
app.get('/api/stations', async (req, res) => {
  try {
    const stations = await prisma.goesto.groupBy({
      by: ['Station_name'],
      _count: {
        Station_name: true
      },
      orderBy: {
        Station_name: 'asc'
      }
    });
    
    res.json(stations.map(s => s.Station_name));
  } catch (error) {
    res.status(500).json({ error: error.message });
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

// Helper functions (add these at the top of your file)
async function getStopOrders(trainNo, fromStation, toStation) {
  const train = await prisma.train.findUnique({
    where: { Train_no: trainNo },
    select: { Route_ID: true }
  });
  
  if (!train) throw new Error('Train not found');
  
  const routeStations = await prisma.route_station.findMany({
    where: { Route_ID: train.Route_ID },
    orderBy: { Stop_Order: 'asc' },
    select: { Station_name: true, Stop_Order: true }
  });
  
  const fromStop = routeStations.find(rs => rs.Station_name === fromStation);
  const toStop = routeStations.find(rs => rs.Station_name === toStation);
  
  if (!fromStop || !toStop || fromStop.Stop_Order >= toStop.Stop_Order) {
    throw new Error('Invalid station sequence');
  }
  
  return { fromOrder: fromStop.Stop_Order, toOrder: toStop.Stop_Order };
}

async function getStopOrder(trainNo, station) {
  const train = await prisma.train.findUnique({
    where: { Train_no: trainNo },
    select: { Route_ID: true }
  });
  
  if (!train) return null;
  
  const routeStation = await prisma.route_station.findFirst({
    where: { 
      Route_ID: train.Route_ID,
      Station_name: station 
    },
    select: { Stop_Order: true }
  });
  
  return routeStation?.Stop_Order;
}

function hasStopOrderOverlap(from1, to1, from2, to2) {
  return !(to1 <= from2 || to2 <= from1);
}


const PORT = process.env.PORT || 3001;
// UPDATE PROFILE
// UPDATE PROFILE
app.put('/api/profile', async (req, res) => {
  try {
    const { userId, fullName, phone } = req.body;

    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    // 1. Delete all old phone numbers for this user (do this FIRST!)
    if (phone) {
      await prisma.userphone.deleteMany({
        where: { Username: userId }
      });
    }

    // 2. Now upsert (actually, now it's just a create, but this is safest and you can still use upsert)
    const updatedUser = await prisma.user.update({
      where: { Username: userId },
      data: {
        First_name: firstName,
        Last_name: lastName,
        userphone: phone
          ? {
              upsert: {
                where: {
                  Username_Mobile_no: {
                    Username: userId,
                    Mobile_no: BigInt(phone.replace(/\D/g, '')),
                  }
                },
                update: { Mobile_no: BigInt(phone.replace(/\D/g, '')) },
                create: {
                  Mobile_no: BigInt(phone.replace(/\D/g, ''))
                  // Username key will be automatically set by Prisma as this runs as nested create!
                }
              }
            }
          : undefined
      },
      include: {
        useremail: true,
        userphone: true
      }
    });

    res.json({ user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});










// CHANGE PASSWORD
app.post('/api/change-password', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({
      where: { Username: userId }
    });
    console.log("User found:", user);

    if (!user) return res.status(404).json({ error: 'User not found' });

    const ok = await bcrypt.compare(currentPassword, user.Passkey);
    console.log("Password matches?", ok);

    if (!ok) return res.status(400).json({ error: 'Incorrect current password' });

    const newHash = await bcrypt.hash(newPassword, 10);

    // Updated block: add PasswordLastChanged
    await prisma.user.update({
      where: { Username: userId },
      data: {
        Passkey: newHash,
        PasswordLastChanged: new Date()  // <-- this line updates last-changed!
      }
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Backend error:', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
});


app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
