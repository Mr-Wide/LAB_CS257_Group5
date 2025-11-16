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
// Helper functions
function formatTime(timeValue) {
  if (!timeValue) return 'Unknown';
  if (timeValue instanceof Date) {
    return timeValue.toTimeString().slice(0, 5);
  } else if (typeof timeValue === 'string') {
    return timeValue.slice(0, 5);
  }
  return 'Unknown';
}

function calcDuration(startTime, endTime) {
  if (!startTime || !endTime) return 'Unknown';
  
  const start = typeof startTime === 'string' ? 
    new Date(`1970-01-01T${startTime}`) : startTime;
  const end = typeof endTime === 'string' ? 
    new Date(`1970-01-01T${endTime}`) : endTime;

  let diffMs = end - start;
  if (diffMs < 0) {
    diffMs += 24 * 60 * 60 * 1000;
  }
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

function calculateBaseFare(distance) {
  return distance ? Math.round(distance * 2) : 1200;
}

function hasACClass(coaches) {
  return coaches.some(coach => 
    coach.Coach_class && (coach.Coach_class.includes('AC') || coach.Coach_class.includes('ac'))
  );
}

function calculateACFare(distance) {
  return distance ? Math.round(distance * 4) : 2400;
}

function generatePNR() {
  return 'PNR' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

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

// Get user's waiting list entries
app.get('/api/waiting-list', async (req, res) => {
  try {
    const { username } = req.query;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const waitingList = await prisma.waiting_list.findMany({
      where: { 
        Username: username 
      },
      include: {
        ticket: {
          include: {
            train: true
          }
        }
      },
      orderBy: {
        Waiting_List_ID: 'asc'
      }
    });

    // Convert to frontend format
    const formattedWaitingList = waitingList.map(entry => ({
      id: entry.Waiting_List_ID.toString(),
      userId: entry.Username,
      trainId: entry.Train_no.toString(),
      travelDate: entry.Travel_Date ? entry.Travel_Date.toISOString().split('T')[0] : '',
      passengerName: entry.ticket?.user ? `${entry.ticket.user.First_name} ${entry.ticket.user.Last_name}` : 'Unknown',
      numSeats: entry.Seat_count,
      isAc: entry.Coach_class?.toLowerCase().includes('ac') || false,
      coachType: entry.Coach_class || 'general',
      position: entry.Waiting_List_ID,
      status: 'waiting',
      createdAt: entry.created_at ? entry.created_at.toISOString() : new Date().toISOString(),
      fromStation: entry.ticket?.From_Station || 'Unknown',
      toStation: entry.ticket?.To_Station || 'Unknown',
      totalFare: entry.ticket?.Fare || 0
    }));

    res.json(formattedWaitingList);
  } catch (error) {
    console.error('Error fetching waiting list:', error);
    res.status(500).json({ error: 'Failed to fetch waiting list' });
  }
});

// Cancel waiting list entry
app.delete('/api/waiting-list/:waitlistId', async (req, res) => {
  try {
    const { waitlistId } = req.params;

    await prisma.waiting_list.delete({
      where: { 
        Waiting_List_ID: parseInt(waitlistId) 
      }
    });

    res.json({ 
      success: true, 
      message: 'Waiting list entry cancelled successfully' 
    });
  } catch (error) {
    console.error('Error cancelling waiting list:', error);
    res.status(500).json({ error: 'Failed to cancel waiting list entry' });
  }
});

// Get user bookings (updated to include waiting list info)
app.get('/api/bookings', async (req, res) => {
  try {
    const { username } = req.query;
    console.log('Fetching bookings for:', username);

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

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
        user: true,
        ticket_seat: true,
        waiting_list: true
      }
    });

    console.log(`Found ${tickets.length} tickets for ${username}`);

    const bookings = tickets.map(ticket => {
      const isWaitlisted = ticket.waiting_list && ticket.waiting_list.length > 0;
      
      return {
        id: ticket.PNR_No,
        pnrNumber: ticket.PNR_No,
        trainId: ticket.Train_no.toString(),
        passengerName: `${ticket.user?.First_name} ${ticket.user?.Last_name}`,
        numSeats: ticket.No_of_seats_booked,
        totalFare: ticket.Fare,
        travelDate: new Date().toISOString().split('T')[0],
        bookingStatus: isWaitlisted ? 'waitlisted' : 'confirmed',
        paymentStatus: 'paid',
        isAc: ticket.ticket_seat.some(ts => ts.Coach_class === 'ac'),
        coachType: ticket.ticket_seat[0]?.Coach_class || 'general',
        fromStation: ticket.From_Station || 'Unknown',
        toStation: ticket.To_Station || 'Unknown',
        bookedSeats: ticket.ticket_seat.map(ts => ({
          coachNo: ts.Coach_no,
          seatNo: ts.Seat_no,
          coachClass: ts.Coach_class
        })),
        waitingListPosition: isWaitlisted ? ticket.waiting_list[0].Waiting_List_ID : null
      };
    });

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Create booking with waiting list support

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

    if (!trainId || !username || !numSeats || !travelDate || !fromStation || !toStation) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const seatsRequested = Number(numSeats);
    console.log('Creating booking:', { trainId, username, seatsRequested, totalFare, coachType, travelDate });

    const user = await prisma.user.findUnique({ where: { Username: username }});
    if (!user) return res.status(404).json({ error: 'User not found' });

    const schedule = await prisma.schedule.findFirst({
      where: { Train_no: parseInt(trainId), Date: new Date(travelDate) }
    });
    if (!schedule) return res.status(400).json({ error: 'Train not available on selected date' });

    const result = await prisma.$transaction(async (tx) => {
      const { fromOrder, toOrder } = await getStopOrders(parseInt(trainId), fromStation, toStation);
      console.log(`Journey: ${fromStation}(${fromOrder}) → ${toStation}(${toOrder})`);

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

      const availableSeats = [];
      for (const seat of allSeats) {
        let isAvailable = true;
        for (const ts of seat.ticket_seat) {
          if (ts.ticket?.From_Station && ts.ticket?.To_Station) {
            const existingFrom = await getStopOrder(parseInt(trainId), ts.ticket.From_Station);
            const existingTo = await getStopOrder(parseInt(trainId), ts.ticket.To_Station);
            if (existingFrom !== null && existingTo !== null) {
              if (hasStopOrderOverlap(fromOrder, toOrder, existingFrom, existingTo)) {
                isAvailable = false;
                break;
              }
            }
          }
        }
        if (isAvailable && seat.Available_seats === 1) {
          availableSeats.push(seat);
          if (availableSeats.length >= seatsRequested) break;
        }
      }

      console.log(`Found ${availableSeats.length} available seats`);

      const seatsToConfirm = availableSeats.slice(0, Math.min(availableSeats.length, seatsRequested));
      const waitingCount = seatsRequested - seatsToConfirm.length;
      const pnr = generatePNR();

      // Create ticket
      const ticket = await tx.ticket.create({
        data: {
          PNR_No: pnr,
          Fare: Math.round((Number(totalFare) || 0) * (seatsToConfirm.length / Math.max(seatsRequested, 1))),
          No_of_seats_booked: seatsToConfirm.length,
          Username: username,
          Train_no: parseInt(trainId),
          From_Station: fromStation,
          To_Station: toStation
        }
      });

      // Claim available seats
      for (const seat of seatsToConfirm) {
        const upd = await tx.seat.updateMany({
          where: {
            Train_no: seat.Train_no,
            Coach_no: seat.Coach_no,
            Coach_class: seat.Coach_class,
            Seat_no: seat.Seat_no,
            Available_seats: 1
          },
          data: { Available_seats: 0 }
        });

        if (upd.count === 0) {
          throw new Error(`Seat ${seat.Seat_no} was taken concurrently, please retry booking.`);
        }

        await tx.ticket_seat.create({
          data: {
            PNR_No: pnr,
            Train_no: seat.Train_no,
            Coach_no: seat.Coach_no,
            Coach_class: seat.Coach_class,
            Seat_no: seat.Seat_no
          }
        });
      }

      // Create waiting list entry if needed
      let waitingEntry = null;
      if (waitingCount > 0) {
        const existingWaitlist = await tx.waiting_list.findFirst({
          where: {
            ticket: {
              Username: username
            },
            Train_no: parseInt(trainId),
            Coach_class: coachType,
            Travel_Date: new Date(travelDate)
          }
        });

        if (existingWaitlist) {
          throw new Error('You already have a waiting list entry for this train and date. Please cancel the existing one first.');
        }
        // Get the next Waiting_List_ID for this train and coach class
        const maxWaitlist = await tx.waiting_list.aggregate({
          _max: {
            Waiting_List_ID: true
          },
          where: {
            Train_no: parseInt(trainId),
            Coach_class: coachType
          }
        });
        
        const nextWaitlistId = (maxWaitlist._max.Waiting_List_ID || 0) + 1;

        waitingEntry = await tx.waiting_list.create({
          data: {
            Waiting_List_ID: nextWaitlistId, // Manually assign the ID
            PNR_No: pnr,
            Username: username,
            Train_no: parseInt(trainId),
            Coach_class: coachType,
            Seat_count: waitingCount,
            Travel_Date: new Date(travelDate)
          }
        });
      }

      return {
        status: 'OK',
        ticket,
        bookedSeats: seatsToConfirm,
        waitingSeats: waitingCount,
        waitingEntry: waitingEntry,
        isWaitlisted: waitingCount > 0
      };
    }); // <-- CORRECTLY PLACED - closes the transaction

    console.log('Booking created successfully:', result.ticket.PNR_No);

    const response = {
      success: true,
      isWaitlisted: result.isWaitlisted,
      waitingListPosition: result.waitingEntry ? result.waitingEntry.Waiting_List_ID : null,
      message: result.isWaitlisted 
        ? `Added to waiting list! Position: ${result.waitingEntry.Waiting_List_ID}` 
        : 'Booking confirmed!',
      pnrNumber: result.ticket.PNR_No,
      booking: {
        id: result.ticket.PNR_No,
        pnrNumber: result.ticket.PNR_No,
        trainId: result.ticket.Train_no.toString(),
        passengerName: passengerName || `${user.First_name} ${user.Last_name}`,
        numSeats: result.ticket.No_of_seats_booked,
        totalFare: result.ticket.Fare,
        travelDate: travelDate,
        bookingStatus: result.isWaitlisted ? 'waitlisted' : 'confirmed',
        paymentStatus: 'paid',
        fromStation: fromStation,
        toStation: toStation,
        isAc: coachType === 'ac',
        waitingListPosition: result.waitingEntry ? result.waitingEntry.Waiting_List_ID : null
      }
    };

    return res.json(response);

  } catch (error) {
    console.error('Error creating booking:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to create booking: ' + (error.message || error) 
    });
  }
});

// Cancel booking and promote waiting list entries
app.delete('/api/bookings/:pnr', async (req, res) => {
  try {
    const { pnr } = req.params;

    const result = await prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.findUnique({
        where: { PNR_No: pnr },
        include: { 
          ticket_seat: true,
          waiting_list: true
        }
      });

      if (!ticket) throw new Error('Ticket not found');

      const trainNo = ticket.Train_no;
      const coachClass = ticket.ticket_seat[0]?.Coach_class || 'general';
      const seatsFreed = ticket.No_of_seats_booked;

      // Delete ticket_seat entries
      await tx.ticket_seat.deleteMany({ where: { PNR_No: pnr } });

      // Free up seats
      for (const ts of ticket.ticket_seat) {
        const otherCount = await tx.ticket_seat.count({
          where: {
            Train_no: ts.Train_no,
            Coach_no: ts.Coach_no,
            Coach_class: ts.Coach_class,
            Seat_no: ts.Seat_no,
            PNR_No: { not: pnr }
          }
        });

        if (otherCount === 0) {
          await tx.seat.updateMany({
            where: {
              Train_no: ts.Train_no,
              Coach_no: ts.Coach_no,
              Coach_class: ts.Coach_class,
              Seat_no: ts.Seat_no
            },
            data: { Available_seats: 1 }
          });
        }
      }

      // Delete waiting list entry if this ticket had one
      if (ticket.waiting_list && ticket.waiting_list.length > 0) {
        await tx.waiting_list.deleteMany({ where: { PNR_No: pnr } });
      }

      // Delete the ticket
      await tx.ticket.delete({ where: { PNR_No: pnr } });

      // MANUALLY PROMOTE FROM WAITING LIST
      let promotedCount = 0;
      if (trainNo) {
        // Get available seats after cancellation
        const availableSeats = await tx.seat.findMany({
          where: { 
            Train_no: trainNo, 
            Coach_class: coachClass,
            Available_seats: 1 
          },
          orderBy: [{ Coach_no: 'asc' }, { Seat_no: 'asc' }]
        });

        if (availableSeats.length > 0) {
          // Get waiting list entries in order
          const waitingEntries = await tx.waiting_list.findMany({
            where: { 
              Train_no: trainNo,
              Coach_class: coachClass
            },
            include: {
              ticket: {
                include: {
                  user: true
                }
              }
            },
            orderBy: { Waiting_List_ID: 'asc' }
          });

          let seatsAssigned = 0;
          
          for (const waitEntry of waitingEntries) {
            if (seatsAssigned >= availableSeats.length) break;

            const seatsNeeded = waitEntry.Seat_count;
            const seatsAvailable = availableSeats.length - seatsAssigned;
            const seatsToAssign = Math.min(seatsNeeded, seatsAvailable);

            if (seatsToAssign > 0) {
              promotedCount++;
              
              // Update the existing ticket to confirmed status
              await tx.ticket.update({
                where: { PNR_No: waitEntry.PNR_No },
                data: { 
                  No_of_seats_booked: seatsToAssign,
                  Fare: Math.round((waitEntry.ticket?.Fare || 0) * (seatsToAssign / Math.max(seatsNeeded, 1)))
                }
              });

              // Assign specific seats
              for (let i = 0; i < seatsToAssign; i++) {
                const seat = availableSeats[seatsAssigned + i];
                
                // Mark seat as taken
                await tx.seat.updateMany({
                  where: {
                    Train_no: seat.Train_no,
                    Coach_no: seat.Coach_no,
                    Coach_class: seat.Coach_class,
                    Seat_no: seat.Seat_no
                  },
                  data: { Available_seats: 0 }
                });

                // Create ticket_seat entry
                await tx.ticket_seat.create({
                  data: {
                    PNR_No: waitEntry.PNR_No,
                    Train_no: seat.Train_no,
                    Coach_no: seat.Coach_no,
                    Coach_class: seat.Coach_class,
                    Seat_no: seat.Seat_no
                  }
                });
              }

              seatsAssigned += seatsToAssign;

              // Update or remove waiting list entry
              if (seatsToAssign >= seatsNeeded) {
                // All seats assigned, remove from waiting list
                await tx.waiting_list.delete({
                  where: { Waiting_List_ID: waitEntry.Waiting_List_ID }
                });
              } else {
                // Partial assignment, update remaining seats
                await tx.waiting_list.update({
                  where: { Waiting_List_ID: waitEntry.Waiting_List_ID },
                  data: { Seat_count: seatsNeeded - seatsToAssign }
                });
              }
            }
          }
        }
      }

      return { 
        message: 'Booking cancelled and waiting list processed',
        seatsFreed: seatsFreed,
        promotedCount: promotedCount
      };
    }); // <-- This closes the transaction

    res.json({ 
      success: true, 
      message: result.message,
      promotedCount: result.promotedCount
    });

  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to cancel booking: ' + error.message 
    });
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


// UPDATE PROFILE
app.put('/api/profile', async (req, res) => {
  try {
    const { userId, fullName, phone } = req.body;

    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    const updatedUser = await prisma.user.update({
      where: { Username: userId },
      data: {
        First_name: firstName,
        Last_name: lastName,
        userphone: phone
          ? {
              upsert: {
                where: { Username: userId },
                update: { Mobile_no: phone },
                create: { Mobile_no: phone, Username: userId }
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

    const ok = await bcrypt.compare(currentPassword, user.Passkey);
    if (!ok) return res.status(400).json({ error: 'Incorrect current password' });

    const newHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { Username: userId },
      data: { Passkey: newHash }
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
