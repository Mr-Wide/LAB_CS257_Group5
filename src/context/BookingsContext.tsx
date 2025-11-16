import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { Booking, WaitingListEntry, BookingCreateInput } from '../types';
import { useAuth } from './AuthContext';

interface BookingResponse {
  success: boolean;
  isWaitlisted: boolean;
  waitingListPosition?: number;
  message: string;
  pnrNumber: string;
  booking?: Booking;
}

interface BookingsContextType {
  bookings: Booking[];
  waitingList: WaitingListEntry[];
  addBooking: (booking: BookingCreateInput) => Promise<BookingResponse>;
  cancelBooking: (bookingId: string) => Promise<void>;
  cancelWaitingList: (waitlistId: string) => Promise<void>;
  loading: boolean;
  refreshData: () => Promise<void>;
}

const BookingsContext = createContext<BookingsContextType | undefined>(undefined);

export const useBookings = () => {
  const ctx = useContext(BookingsContext);
  if (!ctx) throw new Error('useBookings must be used within BookingsProvider');
  return ctx;
};

export const BookingsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [waitingList, setWaitingList] = useState<WaitingListEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch bookings from backend API
  const fetchBookings = async () => {
    if (!user) {
      setBookings([]);
      return;
    }

    try {
      console.log('Fetching bookings from API...');
      const response = await fetch(`/api/bookings?username=${user.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
        console.log(`Loaded ${data.length} bookings`);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  // Fetch waiting list from backend API
  const fetchWaitingList = async () => {
    if (!user) {
      setWaitingList([]);
      return;
    }

    try {
      console.log('Fetching waiting list from API...');
      const response = await fetch(`/api/waiting-list?username=${user.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setWaitingList(data);
        console.log(`Loaded ${data.length} waiting list entries`);
      }
    } catch (error) {
      console.error('Error fetching waiting list:', error);
    }
  };

  // Fetch both bookings and waiting list
  const fetchUserData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchBookings(), fetchWaitingList()]);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [user]);

  const addBooking = async (bookingData: BookingCreateInput): Promise<BookingResponse> => {
    try {
      console.log('Creating booking via API...', bookingData);
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      console.log('Booking API response status:', response.status);

      if (response.ok) {
        const result: BookingResponse = await response.json();
        console.log('Booking API response:', result);

        if (result.success) {
          if (result.isWaitlisted) {
            // Refresh waiting list data
            await fetchWaitingList();
          } else {
            // Refresh bookings data
            await fetchBookings();
          }
        }
        
        return result;
      } else {
        const errorData = await response.json();
        console.error('Booking API error:', errorData);
        const errorMessage = errorData.error || 'Unknown error';
        
        // Return error response in the same format
        return {
          success: false,
          isWaitlisted: false,
          message: errorMessage,
          pnrNumber: ''
        };
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      return {
        success: false,
        isWaitlisted: false,
        message: 'Network error: Please try again',
        pnrNumber: ''
      };
    }
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      console.log('Cancelling booking via API...');
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from local state immediately for better UX
        setBookings(prev => prev.filter(b => b.id !== bookingId));
        console.log('Booking cancelled:', bookingId);
        
        // Refresh data to get any waiting list promotions
        await fetchUserData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  };

  const cancelWaitingList = async (waitlistId: string) => {
    try {
      console.log('Cancelling waiting list entry via API...');
      const response = await fetch(`/api/waiting-list/${waitlistId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from local state immediately for better UX
        setWaitingList(prev => prev.filter(w => w.id !== waitlistId));
        console.log('Waiting list entry cancelled:', waitlistId);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel waiting list request');
      }
    } catch (error) {
      console.error('Error cancelling waiting list:', error);
      throw error;
    }
  };

  const refreshData = async () => {
    await fetchUserData();
  };

  const value: BookingsContextType = useMemo(() => ({ 
    bookings, 
    waitingList,
    addBooking, 
    cancelBooking,
    cancelWaitingList,
    loading,
    refreshData
  }), [bookings, waitingList, loading]);

  return <BookingsContext.Provider value={value}>{children}</BookingsContext.Provider>;
};