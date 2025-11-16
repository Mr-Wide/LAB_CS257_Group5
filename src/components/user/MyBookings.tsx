import { useMemo, useState, useEffect } from 'react';
import { Ticket, Calendar, User, MapPin, Clock, IndianRupee, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { Booking, WaitingListEntry, Train } from '../../types';
import { useBookings } from '../../context/BookingsContext';

export const MyBookings = () => {
  const [activeTab, setActiveTab] = useState<'current' | 'previous' | 'waitlist'>('current');
  const { bookings, waitingList, cancelBooking, cancelWaitingList, loading, refreshData } = useBookings();
  const [allTrains, setAllTrains] = useState<Train[]>([]);
  const [trainsLoading, setTrainsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  // Current bookings: confirmed and future travel date
  const currentBookings = useMemo(() => 
    bookings.filter((booking) => 
      new Date(booking.travelDate) >= today && 
      booking.bookingStatus === 'confirmed'
    ), [bookings]);

  // Previous bookings: past travel date or cancelled
  const previousBookings = useMemo(() => 
    bookings.filter((booking) => 
      new Date(booking.travelDate) < today || 
      booking.bookingStatus === 'cancelled'
    ), [bookings]);

  // Waitlisted bookings (from main bookings with waitlist status)
  const waitlistedBookings = useMemo(() => 
    bookings.filter((booking) => booking.bookingStatus === 'waitlisted'), 
    [bookings]
  );

  const getTrainDetails = (trainId: string) => {
    return allTrains.find((train) => train.id === trainId);
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      try {
        await cancelBooking(bookingId);
      } catch (error) {
        alert('Failed to cancel booking. Please try again.');
      }
    }
  };

  const handleCancelWaitlist = async (waitlistId: string) => {
    if (confirm('Are you sure you want to cancel this waiting list request? This action cannot be undone.')) {
      try {
        await cancelWaitingList(waitlistId);
      } catch (error) {
        alert('Failed to cancel waiting list request. Please try again.');
      }
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } finally {
      setRefreshing(false);
    }
  };

  const getWaitlistChance = (position: number) => {
    if (position <= 3) return 'High';
    if (position <= 8) return 'Medium';
    return 'Low';
  };

  const getWaitlistChanceColor = (position: number) => {
    if (position <= 3) return 'text-green-600 bg-green-100';
    if (position <= 8) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const renderBookingCard = (booking: Booking) => {
    const train = getTrainDetails(booking.trainId);
    if (!train) {
      console.log('Train not found for booking:', booking.trainId);
      return null;
    }

    const isWaitlisted = booking.bookingStatus === 'waitlisted';
    const isCancelled = booking.bookingStatus === 'cancelled';
    const isPast = new Date(booking.travelDate) < today;

    return (
      <div key={booking.id} className={`bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition ${
        isWaitlisted ? 'border-orange-200' : 
        isCancelled ? 'border-red-200' : 
        'border-gray-200'
      }`}>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${
              isWaitlisted ? 'bg-orange-100' : 
              isCancelled ? 'bg-red-100' : 
              'bg-blue-100'
            }`}>
              {isWaitlisted ? (
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              ) : (
                <Ticket className={`w-6 h-6 ${
                  isCancelled ? 'text-red-600' : 'text-blue-600'
                }`} />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">{train.trainName}</h3>
              <p className="text-sm text-gray-500">PNR: {booking.pnrNumber}</p>
              {isWaitlisted && booking.waitingListPosition && (
                <p className="text-sm text-orange-600 font-semibold">
                  Waiting List Position: #{booking.waitingListPosition}
                </p>
              )}
            </div>
          </div>
          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full ${
              isWaitlisted
                ? 'bg-orange-100 text-orange-700'
                : isCancelled
                ? 'bg-red-100 text-red-700'
                : isPast
                ? 'bg-gray-100 text-gray-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {isWaitlisted ? 'WAITLISTED' : 
             isCancelled ? 'CANCELLED' : 
             isPast ? 'COMPLETED' : 'CONFIRMED'}
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
              {booking.fromStation} → {booking.toStation}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">Departure:</span>
            <span className="font-semibold text-gray-800">{train.departureTime}</span>
          </div>
        </div>

        {isWaitlisted && (
          <div className="bg-orange-50 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-orange-700">
                Your tickets will be confirmed automatically when seats become available
              </span>
              {booking.waitingListPosition && (
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getWaitlistChanceColor(booking.waitingListPosition)}`}>
                  {getWaitlistChance(booking.waitingListPosition)} Chance
                </span>
              )}
            </div>
          </div>
        )}

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

          {!isCancelled && !isPast && (
            <button
              onClick={() => isWaitlisted ? handleCancelWaitlist(booking.id) : handleCancelBooking(booking.id)}
              className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              {isWaitlisted ? 'Cancel Request' : 'Cancel Booking'}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderWaitlistCard = (entry: WaitingListEntry) => {
    const train = getTrainDetails(entry.trainId);
    if (!train) {
      console.log('Train not found for waitlist entry:', entry.trainId);
      return null;
    }

    const chance = getWaitlistChance(entry.position);
    const chanceColor = getWaitlistChanceColor(entry.position);

    return (
      <div key={entry.id} className="bg-white rounded-xl shadow-sm border border-orange-200 p-6 hover:shadow-md transition">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">{train.trainName}</h3>
              <p className="text-sm text-gray-500">Train #{train.trainNumber}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-700 mb-2">
              WAITING LIST
            </span>
            <div className="space-y-1">
              <p className="text-xl font-bold text-orange-600">#{entry.position}</p>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${chanceColor}`}>
                {chance} Chance
              </span>
            </div>
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
              {entry.fromStation} → {entry.toStation}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">Departure:</span>
            <span className="font-semibold text-gray-800">{train.departureTime}</span>
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-orange-700">
              Your tickets will be confirmed automatically if seats become available
            </span>
            <div className="flex items-center gap-1">
              <IndianRupee className="w-4 h-4 text-orange-600" />
              <span className="font-semibold text-orange-800">₹{entry.totalFare}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <span className="text-sm text-gray-600">
            {entry.numSeats} {entry.numSeats > 1 ? 'seats' : 'seat'} • {entry.isAc ? 'AC' : 'Non-AC'} • Joined on {new Date(entry.createdAt).toLocaleDateString()}
          </span>
          <button
            onClick={() => handleCancelWaitlist(entry.id)}
            className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2"
          >
            <XCircle className="w-4 h-4" />
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Bookings</h1>
          <p className="text-gray-600">View and manage your train reservations and waiting list</p>
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Ticket className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Current Bookings</p>
              <p className="text-2xl font-bold text-gray-800">{currentBookings.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Previous Bookings</p>
              <p className="text-2xl font-bold text-gray-800">{previousBookings.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Waiting List</p>
              <p className="text-2xl font-bold text-gray-800">{waitlistedBookings.length + waitingList.length}</p>
            </div>
          </div>
        </div>
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
            Current Bookings ({currentBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('previous')}
            className={`flex-1 px-6 py-4 font-semibold transition ${
              activeTab === 'previous'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Previous Bookings ({previousBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('waitlist')}
            className={`flex-1 px-6 py-4 font-semibold transition ${
              activeTab === 'waitlist'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Waiting List ({waitlistedBookings.length + waitingList.length})
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
            {(waitlistedBookings.length + waitingList.length) === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No waiting list entries</h3>
                <p className="text-gray-600">You don't have any trains on the waiting list</p>
              </div>
            ) : (
              <>
                {/* Show waitlisted bookings from main bookings array */}
                {waitlistedBookings.map(renderBookingCard)}
                {/* Show separate waiting list entries */}
                {waitingList.map(renderWaitlistCard)}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};