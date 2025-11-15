import { useState, useEffect } from 'react';
import { X, User as LucideUser, Calendar, CreditCard } from 'lucide-react';
import { Train, BookingCreateInput, User as UserType} from '../../types';

interface BookingModalProps {
  train: Train;
  onClose: () => void;
  onConfirm: (bookingDetails: BookingCreateInput) => void;
  currentUser: UserType;
}

export const BookingModal = ({ train, onClose, onConfirm, currentUser }: BookingModalProps) => {
  const [passengerName, setPassengerName] = useState('');
  const [passengerAge, setPassengerAge] = useState('');
  const [passengerGender, setPassengerGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [numSeats, setNumSeats] = useState(1);
  const [travelDate, setTravelDate] = useState('');
  const [availableDates, setAvailableDates] = useState<{date: string, day: string}[]>([]);
  const [coachType, setCoachType] = useState<'ac' | 'general'>('general');
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
            setTravelDate(dates[0].date); // Set to first available date
          }
        }
      } catch (error) {
        console.error('Error fetching available dates:', error);
      }
    };
    fetchAvailableDates();
  }, [train.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Add safety check
    if(!currentUser) {
      console.error('No user logged in');
      alert('Please log in to book a ticket');
      return;
    }  
    
    console.log('BookingModal: Form submitted with data:', {
      passengerName,
      numSeats,
      totalFare,
      trainId: train.id,
      coachType
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
      isAc: coachType === 'ac' //for backward compatibility
    };
    console.log('BookingModal: Calling onConfirm with:', bookingDetails);
    onConfirm(bookingDetails);
  };

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
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-blue-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Route:</span>
              <span className="font-semibold text-gray-800">
                {train.sourceStation} → {train.destinationStation}
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
          </div>

          {/* FIXED: Removed extra closing div that broke the grid */}
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
              <input
                type="number"
                value={passengerAge}
                onChange={(e) => setPassengerAge(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Age"
                min="1"
                max="120"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
              <select
                value={passengerGender}
                onChange={(e) => setPassengerGender(e.target.value as 'Male' | 'Female' | 'Other')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Number of Seats</label>
              <input
                type="number"
                value={numSeats}
                onChange={(e) => setNumSeats(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
                max={
                  coachType === 'ac' 
                    ? Math.min(train.availableACSeats, 6)
                    : Math.min(train.availableGeneralSeats, 6)
                }
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Max {coachType === 'ac' ? train.availableACSeats : train.availableGeneralSeats} seats available in {coachType} class
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Coach Type</label>
              
              {/* Seat Availability Summary */}
              <div className="flex gap-4 mb-3 text-sm">
                <div className="flex items-center gap-1">
                  <span className="font-medium">General:</span>
                  <span className={train.availableGeneralSeats > 0 ? "text-green-600" : "text-red-600"}>
                    {train.availableGeneralSeats} seats
                  </span>
                </div>
                {train.acAvailable && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">AC:</span>
                    <span className={train.availableACSeats > 0 ? "text-green-600" : "text-red-600"}>
                      {train.availableACSeats} seats
                    </span>
                  </div>
                )}
              </div>

              <select
                value={coachType}
                onChange={(e) => setCoachType(e.target.value as 'ac' | 'general')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {/* General option - only show if seats available */}
                {train.availableGeneralSeats > 0 && (
                  <option value="general">
                    General Class (₹{train.baseFare}) - {train.availableGeneralSeats} seats left
                  </option>
                )}
                
                {/* AC option - only show if AC available AND seats available */}
                {train.acAvailable && train.availableACSeats > 0 && (
                  <option value="ac">
                    AC Class (₹{train.acFare}) - {train.availableACSeats} seats left
                  </option>
                )}
                
                {/* Fallback if no seats available */}
                {train.availableGeneralSeats === 0 && (!train.acAvailable || train.availableACSeats === 0) && (
                  <option value="" disabled>No seats available</option>
                )}
              </select>

              {/* Validation messages */}
              {coachType === 'general' && train.availableGeneralSeats === 0 && (
                <p className="text-sm text-red-500 mt-1">No General seats available</p>
              )}
              {coachType === 'ac' && train.availableACSeats === 0 && (
                <p className="text-sm text-red-500 mt-1">No AC seats available</p>
              )}
            </div>
          </div> {/* This closes the grid */}

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Base Fare:</span>
              <span className="font-semibold text-gray-800">
                ₹{coachType === 'ac'? train.acFare : train.baseFare} × {numSeats}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-lg font-semibold text-gray-800">Total Amount:</span>
              <span className="text-2xl font-bold text-blue-600">₹{totalFare}</span>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              Proceed to Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};