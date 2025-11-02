// Replace direct JS arrays with parsed data from mockData.txt
import raw from './mockData.txt?raw';
const parsed = JSON.parse(raw) as {
  mockTrains: any[];
  mockBookings: any[];
  mockWaitingList: any[];
};

export const mockTrains = parsed.mockTrains;
export const mockBookings = parsed.mockBookings;
export const mockWaitingList = parsed.mockWaitingList;
