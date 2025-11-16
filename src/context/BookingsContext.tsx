import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { Booking } from '../types';
import { useAuth } from './AuthContext';

interface BookingsContextType {
  bookings: Booking[];
  addBooking: (booking: any) => void;
  cancelBooking: (bookingId: string) => void;
  loading: boolean;
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
  const [loading, setLoading] = useState(true);

  // Fetch bookings from backend API
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) {
        setBookings([]);
        setLoading(false);
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
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  const addBooking = async (bookingData: any) => {
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
      const newBooking = await response.json();
      console.log('Booking created successfully:', newBooking);
      setBookings(prev => [newBooking, ...prev]);
      alert('Booking confirmed! PNR: ' + newBooking.pnrNumber);
      return newBooking;
    } else {
      const errorData = await response.json();
      console.error('Booking API error:', errorData);
      const errorMessage = errorData.error || 'Unknown error';
      alert('Booking failed: ' + errorMessage);
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('Error creating booking:', error);
    alert('Booking failed: Please try again');
    throw error;
  }
};

  const cancelBooking = async (bookingId: string) => {
    try {
      console.log('Cancelling booking via API...');
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setBookings(prev => prev.filter(b => b.id !== bookingId));
        console.log('Booking cancelled:', bookingId);
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  };

  const value: BookingsContextType = useMemo(() => ({ 
    bookings, 
    addBooking, 
    cancelBooking,
    loading 
  }), [bookings, loading]);

  return <BookingsContext.Provider value={value}>{children}</BookingsContext.Provider>;
};