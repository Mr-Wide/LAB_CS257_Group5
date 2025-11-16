export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  isAdmin: boolean;
}

export interface Train {
  id: string;
  trainNumber: string;
  trainName: string;
  sourceStation: string;
  destinationStation: string;
  departureTime: string;
  arrivalTime: string;
  travelDuration: string;
  totalSeats: number;
  availableSeats: number;
  acSeatsAvailable: number;
  generalSeatsAvailable: number;
  baseFare: number;
  acAvailable: boolean;
  acFare: number;
  daysOfOperation: string[];
  status: 'active' | 'cancelled';
}

export interface Booking {
  id: string;
  userId: string;
  trainId: string;
  train?: Train;
  bookingDate: string;
  travelDate: string;
  passengerName: string;
  passengerAge: number;
  passengerGender: 'Male' | 'Female' | 'Other';
  numSeats: number;
  isAc: boolean;
  coachType: 'ac' | 'general'; // Add this for consistency
  totalFare: number;
  bookingStatus: 'confirmed' | 'waitlisted' | 'cancelled' | 'completed';
  pnrNumber: string;
  paymentStatus: 'paid' | 'pending' | 'refunded';
  fromStation: string;
  toStation: string;
  waitingListPosition?: number; // Add this for waitlisted bookings
}

export interface WaitingListEntry {
  id: string;
  userId: string;
  trainId: string;
  train?: Train;
  travelDate: string;
  passengerName: string;
  passengerAge: number;
  passengerGender: 'Male' | 'Female' | 'Other';
  numSeats: number;
  isAc: boolean;
  coachType: 'ac' | 'general'; // Add this
  position: number;
  status: 'waiting' | 'confirmed' | 'cancelled';
  createdAt: string;
  fromStation: string; // Add these for route-specific waiting list
  toStation: string;
  totalFare: number; // Add this for payment handling
}

export interface SearchFilters {
  sourceStation: string;
  destinationStation: string;
  travelDate: string;
  minFare?: number;
  maxFare?: number;
  minTime?: string;
  maxTime?: string;
  acOnly?: boolean;
  nonAcOnly?: boolean;
  shortestTime?: boolean;
}

export interface BookingCreateInput {
  trainId: string;
  username: string;
  passengerName: string;
  passengerAge: number;
  passengerGender: 'Male' | 'Female' | 'Other';
  numSeats: number;
  coachType: 'ac' | 'general'; // Make this required
  travelDate: string;
  totalFare: number;
  fromStation: string;
  toStation: string;
  status?: 'confirmed' | 'waiting'; // Add status for waiting list support
  isAc: boolean;
}

export interface Station {
  station_name: string;
}

// Add these new interfaces for waiting list functionality
export interface AvailabilityData {
  availableSeats: number;
  waitingListCount: number;
  maxSeatsPerBooking: number;
  coachType: 'ac' | 'general';
  fromStation: string;
  toStation: string;
  travelDate: string;
}

// Update your types to match the new response format
export interface BookingResponse {
  success: boolean;
  isWaitlisted: boolean;
  waitingListPosition?: number;
  booking?: Booking;
  message: string;
  pnrNumber: string;
}

export interface WaitingListPromotion {
  waitingListEntryId: string;
  bookingId: string;
  promotedAt: string;
}

export interface CoachAvailability {
  coachType: 'ac' | 'general';
  availableSeats: number;
  totalSeats: number;
  waitingList: WaitingListEntry[];
}

export interface TrainAvailability {
  trainId: string;
  travelDate: string;
  coaches: CoachAvailability[];
  totalWaitingListCount: number;
}