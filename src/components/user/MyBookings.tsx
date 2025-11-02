import { useMemo, useState, useEffect } from 'react';
import { Ticket, Calendar, User, MapPin, Clock, IndianRupee, XCircle } from 'lucide-react';
import { Booking, WaitingListEntry, Train } from '../../types';
import { useBookings } from '../../context/BookingsContext';

export const MyBookings = () => {
  const [activeTab, setActiveTab] = useState<'current' | 'previous' | 'waitlist'>('current');
  const { bookings, cancelBooking, loading } = useBookings();
  const [allTrains, setAllTrains] = useState<Train[]>([]);
  const [trainsLoading, setTrainsLoading] = useState(true);

  // Fetch trains from API
  useEffect(() => {
    const fetchTrains = async () => {
      try {
        console.log('🔄 Fetching trains for bookings...');
        const response = await fetch('/api/trains');
        
        if (!response.ok) {
          throw new Error('Failed to fetch trains');
        }
        
        const data = await response.json();
        console.log('Trains data received for bookings:', data);
        setAllTrains(data);
      } catch (error) {
        console.error('Error fetching trains for bookings:', error);
      } finally {
        setTrainsLoading(false);
      }
    };

    fetchTrains();
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentBookings = useMemo(() => bookings.filter(
    (booking) => new Date(booking.travelDate) >= today && booking.bookingStatus === 'confirmed'
  ), [bookings]);

  const previousBookings = useMemo(() => bookings.filter(
    (booking) => new Date(booking.travelDate) < today || booking.bookingStatus === 'completed' || booking.bookingStatus === 'cancelled'
  ), [bookings]);

  // TODO: Replace with real waiting list data from API
  const waitingList: WaitingListEntry[] = [];

  const getTrainDetails = (trainId: string) => {
    return allTrains.find((train) => train.id === trainId);
  };

  const handleCancelBooking = (bookingId: string) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      cancelBooking(bookingId);
    }
  };

  const renderBookingCard = (booking: Booking) => {
    const train = getTrainDetails(booking.trainId);
    if (!train) return null;

    return (
      <div key={booking.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Ticket className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">{train.trainName}</h3>
              <p className="text-sm text-gray-500">PNR: {booking.pnrNumber}</p>
            </div>
          </div>
          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full ${
              booking.bookingStatus === 'confirmed'
                ? 'bg-green-100 text-green-700'
                : booking.bookingStatus === 'completed'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {booking.bookingStatus.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">Travel Date:</span>
            <span className="font-semibold text-gray-800">
              {new Date(booking.travelDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">Passenger:</span>
            <span className="font-semibold text-gray-800">{booking.passengerName}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">Route:</span>
            <span className="font-semibold text-gray-800">
              {train.sourceStation} → {train.destinationStation}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">Departure:</span>
            <span className="font-semibold text-gray-800">{train.departureTime}</span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <IndianRupee className="w-4 h-4 text-gray-600" />
              <span className="text-lg font-bold text-gray-800">₹{booking.totalFare}</span>
            </div>
            <span className="text-sm text-gray-600">
              {booking.numSeats} {booking.numSeats > 1 ? 'seats' : 'seat'} • {booking.isAc ? 'AC' : 'Non-AC'}
            </span>
          </div>

          {booking.bookingStatus === 'confirmed' && (
            <button
              onClick={() => handleCancelBooking(booking.id)}
              className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Cancel Booking
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderWaitlistCard = (entry: WaitingListEntry) => {
    const train = getTrainDetails(entry.trainId);
    if (!train) return null;

    return (
      <div key={entry.id} className="bg-white rounded-xl shadow-sm border border-orange-200 p-6 hover:shadow-md transition">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">{train.trainName}</h3>
              <p className="text-sm text-gray-500">Train #{train.trainNumber}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-700">
              WAITING
            </span>
            <p className="text-xl font-bold text-orange-600 mt-1">Position: {entry.position}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">Travel Date:</span>
            <span className="font-semibold text-gray-800">
              {new Date(entry.travelDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">Passenger:</span>
            <span className="font-semibold text-gray-800">{entry.passengerName}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">Route:</span>
            <span className="font-semibold text-gray-800">
              {train.sourceStation} → {train.destinationStation}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">Departure:</span>
            <span className="font-semibold text-gray-800">{train.departureTime}</span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <span className="text-sm text-gray-600">
            {entry.numSeats} {entry.numSeats > 1 ? 'seats' : 'seat'} • {entry.isAc ? 'AC' : 'Non-AC'}
          </span>
          <button
            onClick={() => alert('Cancelled waitlist entry')}
            className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg font-semibold transition"
          >
            Cancel Request
          </button>
        </div>
      </div>
    );
  };

  // Show loading state
  if (loading || trainsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">My Bookings</h1>
        <p className="text-gray-600">View and manage your train reservations</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('current')}
            className={`flex-1 px-6 py-4 font-semibold transition ${
              activeTab === 'current'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Currently Booked ({currentBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('previous')}
            className={`flex-1 px-6 py-4 font-semibold transition ${
              activeTab === 'previous'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Previously Booked ({previousBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('waitlist')}
            className={`flex-1 px-6 py-4 font-semibold transition ${
              activeTab === 'waitlist'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Waiting List ({waitingList.length})
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {activeTab === 'current' && (
          <>
            {currentBookings.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No current bookings</h3>
                <p className="text-gray-600">You don't have any upcoming train reservations</p>
              </div>
            ) : (
              currentBookings.map(renderBookingCard)
            )}
          </>
        )}

        {activeTab === 'previous' && (
          <>
            {previousBookings.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No previous bookings</h3>
                <p className="text-gray-600">Your booking history will appear here</p>
              </div>
            ) : (
              previousBookings.map(renderBookingCard)
            )}
          </>
        )}

        {activeTab === 'waitlist' && (
          <>
            {waitingList.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No waiting list entries</h3>
                <p className="text-gray-600">You don't have any trains on the waiting list</p>
              </div>
            ) : (
              waitingList.map(renderWaitlistCard)
            )}
          </>
        )}
      </div>
    </div>
  );
};