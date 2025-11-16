import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { Navbar } from './components/layout/Navbar';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { SearchTrains } from './components/user/SearchTrains';
import { MyBookings } from './components/user/MyBookings';
import { Profile } from './components/user/Profile';
import { BookingModal } from './components/user/BookingModal';
import { Train, BookingCreateInput } from './types'; // Remove Booking import
import { BookingsProvider, useBookings } from './context/BookingsContext';
import { useHashRouter } from './hooks/useHashRouter';

function AppContent() {
  const { user } = useAuth();
  const { addBooking } = useBookings();
  const [showLogin, setShowLogin] = useState(true);
  const { route, navigate } = useHashRouter();
  const [selectedTrain, setSelectedTrain] = useState<Train | null>(null);
  const [selectedFromStation, setSelectedFromStation] = useState<string>(''); // ADD THIS
  const [selectedToStation, setSelectedToStation] = useState<string>('');     // ADD THIS
  const handleBookTrain = (train: Train, fromStation: string, toStation: string) => {
    setSelectedTrain(train);
    setSelectedFromStation(fromStation); // SET THE STATIONS
    setSelectedToStation(toStation);     // SET THE STATIONS
  };

  const handleConfirmBooking = async (bookingDetails: BookingCreateInput) => {
    if (selectedTrain && user) {
      try {
        // Send the booking data directly to backend via addBooking
        await addBooking({
          trainId: selectedTrain.id,
          username: user.id,
          numSeats: bookingDetails.numSeats,
          totalFare: bookingDetails.totalFare,
          passengerName: bookingDetails.passengerName,
          coachType: bookingDetails.isAc ? 'ac' : 'non-ac',
          travelDate: bookingDetails.travelDate,
          passengerAge: bookingDetails.passengerAge,
          passengerGender: bookingDetails.passengerGender,
          fromStation: selectedFromStation,    // USE THE STATIONS
          toStation: selectedToStation         // USE THE STATIONS
        });
        // Success alert is now handled in BookingsContext
      } catch (error) {
        console.error('Booking failed:', error);
        // Error alert is handled in BookingsContext
      }
    }
    setSelectedTrain(null);
    setSelectedFromStation(''); // RESET STATIONS
    setSelectedToStation('');   // RESET STATIONS
    navigate('bookings');
  };

  if (!user) {
    return showLogin ? (
      <Login onToggleForm={() => setShowLogin(false)} />
    ) : (
      <Register onToggleForm={() => setShowLogin(true)} />
    );
  }
  console.log('Current user object:', user);
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onNavigate={navigate as (page: string) => void} currentPage={route} />

      {user.isAdmin ? (
        <AdminDashboard />
      ) : (
        <>
          {route === 'dashboard' && <SearchTrains onBookTrain={handleBookTrain} />} 
          {route === 'bookings' && <MyBookings />} 
          {route === 'profile' && <Profile />}
        </>
      )}

      {selectedTrain && (
        <BookingModal
          train={selectedTrain}
          fromStation={selectedFromStation}
          toStation={selectedToStation}
          onClose={() => {
            setSelectedTrain(null);
            setSelectedFromStation('');
            setSelectedToStation('');
          }
          
          }
          onConfirm={handleConfirmBooking}
          currentUser={user}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BookingsProvider>
        <AppContent />
      </BookingsProvider>
    </AuthProvider>
  );
}

export default App;