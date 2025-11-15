export interface User {
  id: string;
  username:string,
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
  totalFare: number;
  bookingStatus: 'confirmed' | 'completed' | 'cancelled';
  pnrNumber: string;
  paymentStatus: 'paid' | 'pending' | 'refunded';
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
  position: number;
  status: 'waiting' | 'confirmed' | 'cancelled';
  createdAt: string;
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
}

export interface BookingCreateInput {
  trainId: string;           // Add this - required by backend
  username: string;          // Add this - required by backend  
  passengerName: string;
  passengerAge: number;
  passengerGender: 'Male' | 'Female' | 'Other';
  numSeats: number;
  isAc: boolean;
  travelDate: string;
  totalFare: number;
  coachType?: string;        // Add this for seat allocation
}

export interface Station {
  station_name: string;
}
