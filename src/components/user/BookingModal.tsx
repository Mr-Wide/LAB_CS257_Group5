import { useState, useEffect } from 'react';
import { X, User as LucideUser, Calendar, CreditCard, AlertTriangle } from 'lucide-react';
import { Train, BookingCreateInput, User as UserType } from '../../types';

interface BookingModalProps {
  train: Train;
  fromStation: string;
  toStation: string;
  onClose: () => void;
  onConfirm: (bookingDetails: BookingCreateInput) => Promise<any>;
  currentUser: UserType;
}

export const BookingModal = ({ train, fromStation, toStation, onClose, onConfirm, currentUser }: BookingModalProps) => {
  const [passengerName, setPassengerName] = useState('');
  const [passengerAge, setPassengerAge] = useState('');
  const [passengerGender, setPassengerGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [numSeats, setNumSeats] = useState(1);
  const [travelDate, setTravelDate] = useState('');
  const [availableDates, setAvailableDates] = useState<{date: string, day: string}[]>([]);
  const [coachType, setCoachType] = useState<'ac' | 'general'>('general');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const totalFare = (coachType === 'ac' ? train.acFare : train.baseFare) * numSeats;
  
  // Fetch available dates for this train
  useEffect(() => {
    const fetchAvailableDates = async () => {
      try {
        const response = await fetch(`/api/trains/${train.id}/available-dates`);
        if (response.ok) {
          const dates = await response.json();
          setAvailableDates(dates);
          if (dates.length > 0) {
            setTravelDate(dates[0].date);
          }
        }
      } catch (error) {
        console.error('Error fetching available dates:', error);
      }
    };
    fetchAvailableDates();
  }, [train.id]);

  const getBookingStatus = () => {
    // Since we don't have real-time availability API, we'll show based on train's general availability
    const availableSeats = train.availableSeats || 0;
    
    if (availableSeats >= numSeats) {
      return {
        type: 'confirmed' as const,
        message: `Seats available for booking`,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      };
    } else if (availableSeats > 0) {
      return {
        type: 'partial' as const,
        message: `Limited seats available. ${numSeats - availableSeats} may be on waiting list`,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      };
    } else {
      return {
        type: 'waiting' as const,
        message: `No seats available - will join waiting list`,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      };
    }
  };

  const getMaxSeats = () => {
    // Allow up to 6 seats for booking (including waiting list)
    return 6;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      alert('Please log in to book a ticket');
      return;
    }

    if (!passengerName.trim()) {
      alert('Please enter passenger name');
      return;
    }

    if (!passengerAge || parseInt(passengerAge) < 1 || parseInt(passengerAge) > 120) {
      alert('Please enter a valid age (1-120)');
      return;
    }

    if (!travelDate) {
      alert('Please select a travel date');
      return;
    }

    setSubmitting(true);

    try {
      console.log('BookingModal: Form submitted with data:', {
        passengerName,
        numSeats,
        totalFare,
        trainId: train.id,
        coachType,
        fromStation,
        toStation
      });

      const bookingDetails: BookingCreateInput = {
        trainId: train.id,
        username: currentUser.id,
        passengerName,
        passengerAge: parseInt(passengerAge),
        passengerGender,
        numSeats,
        coachType,
        travelDate,
        totalFare,
        isAc: coachType === 'ac',
        fromStation: fromStation,
        toStation: toStation
      };
      
      console.log('BookingModal: Calling onConfirm with:', bookingDetails);
      await onConfirm(bookingDetails);
      
      // Modal will close automatically via parent component after successful booking
      
    } catch (error) {
      console.error('Booking failed:', error);
      // Error is handled in BookingsContext, so we don't need to show another alert here
    } finally {
      setSubmitting(false);
    }
  };

  const bookingStatus = getBookingStatus();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Book Ticket</h2>
            <p className="text-sm text-gray-600">{train.trainName} - #{train.trainNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            disabled={submitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Availability Status Banner */}
          {bookingStatus && (
            <div className={`${bookingStatus.bgColor} ${bookingStatus.borderColor} border rounded-xl p-4`}>
              <div className="flex items-center gap-3">
                {bookingStatus.type === 'waiting' && (
                  <AlertTriangle className={`w-5 h-5 ${bookingStatus.color}`} />
                )}
                <div>
                  <p className={`font-semibold ${bookingStatus.color}`}>
                    {bookingStatus.message}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {bookingStatus.type === 'waiting' 
                      ? 'Your booking will be confirmed automatically when seats become available'
                      : 'Your seats will be confirmed immediately'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Route:</span>
              <span className="font-semibold text-gray-800">
                {fromStation} → {toStation}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Departure:</span>
              <span className="font-semibold text-gray-800">{train.departureTime}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Duration:</span>
              <span className="font-semibold text-gray-800">{train.travelDuration}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Available Seats:</span>
              <span className="font-semibold text-gray-800">{train.availableSeats || 0}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <LucideUser className="w-4 h-4 inline mr-1" />
                Passenger Name
              </label>
              <input
                type="text"
                value={passengerName}
                onChange={(e) => setPassengerName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Full name"
                required
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
              <input
                type="number"
                value={passengerAge}
                onChange={(e) => setPassengerAge(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Age"
                min="1"
                max="120"
                required
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
              <select
                value={passengerGender}
                onChange={(e) => setPassengerGender(e.target.value as 'Male' | 'Female' | 'Other')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={submitting}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Travel Date
              </label>
              <select
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={submitting || loading}
              >
                <option value="">Select a date</option>
                {availableDates.map(({date, day}) => (
                  <option key={date} value={date}>
                    {new Date(date).toLocaleDateString()} ({day})
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                This train only runs on specific scheduled dates
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Seats
                <span className="text-sm text-gray-500 ml-2">
                  (Max: {getMaxSeats()})
                </span>
              </label>
              <input
                type="number"
                value={numSeats}
                onChange={(e) => setNumSeats(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                max={getMaxSeats()}
                required
                disabled={submitting}
              />
              {bookingStatus?.type === 'waiting' && (
                <p className="text-sm text-orange-600 mt-1">
                  All {numSeats} seat(s) will be on waiting list
                </p>
              )}
              {bookingStatus?.type === 'partial' && (
                <p className="text-sm text-orange-600 mt-1">
                  Some seats may be on waiting list
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Coach Type</label>
              <select
                value={coachType}
                onChange={(e) => setCoachType(e.target.value as 'ac' | 'general')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={submitting}
              >
                <option value="general">General Class (₹{train.baseFare})</option>
                {train.acAvailable && (
                  <option value="ac">AC Class (₹{train.acFare})</option>
                )}
              </select>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Base Fare:</span>
              <span className="font-semibold text-gray-800">
                ₹{coachType === 'ac'? train.acFare : train.baseFare} × {numSeats}
              </span>
            </div>
            {bookingStatus?.type === 'waiting' && (
              <div className="flex justify-between items-center mb-2 text-sm">
                <span className="text-gray-600">Payment:</span>
                <span className="font-semibold text-orange-600">
                  Pay only when confirmed
                </span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-lg font-semibold text-gray-800">Total Amount:</span>
              <span className="text-2xl font-bold text-blue-600">₹{totalFare}</span>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !travelDate}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  {bookingStatus?.type === 'waiting' ? 'Join Waiting List' : 'Confirm Booking'}
                </>
              )}
            </button>
          </div>

          {bookingStatus?.type === 'waiting' && (
            <div className="text-center text-sm text-gray-600">
              <p>You'll only be charged when your booking is confirmed from the waiting list</p>
              <p className="mt-1">You'll receive a notification when your seats are confirmed</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};