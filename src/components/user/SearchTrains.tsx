import { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Filter, X, LucideTrainFront as TrainIcon, Clock, IndianRupee, Armchair, Users } from 'lucide-react';
import { Train, SearchFilters } from '../../types';
import { AutocompleteInput } from '../common/AutocompleteInput';

interface SearchTrainsProps {
  onBookTrain: (train: Train, fromStation: string, toStation:string) => void;
}

export const SearchTrains = ({ onBookTrain }: SearchTrainsProps) => {
  const [filters, setFilters] = useState<SearchFilters>({
    sourceStation: '',
    destinationStation: '',
    travelDate: '',
    minFare: undefined,
    maxFare: undefined,
    minTime: undefined,
    maxTime: undefined,
    acOnly: false,
    nonAcOnly: false,
    shortestTime: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchResults, setSearchResults] = useState<Train[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false); 
  const [stations, setStations] = useState<string[]>([]);

  // Fetch stations from API when component loads
  useEffect(() => {
    const fetchStations = async () => {
      try {
        console.log('Fetching stations from API...');
        const response = await fetch('/api/stations');
        
        if (!response.ok) {
          throw new Error('Failed to fetch stations');
        }
        
        const data = await response.json();
        console.log('Stations data received:', data);
        setStations(data);
      } catch (error) {
        console.error('Error fetching stations:', error);
      }
    };

    fetchStations();
  }, []);

  // Helper function to convert time string "HH:MM" to minutes
  const timeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':').map(Number);
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  };

  const handleSearch = async () => {
    if (!filters.sourceStation || !filters.destinationStation) {
      alert('Please select both source and destination stations');
      return;
    }

    try {
      setLoading(true);
      console.log('Searching trains with:', filters);
      
      const params = new URLSearchParams({
        from: filters.sourceStation,
        to: filters.destinationStation,
        date: filters.travelDate || new Date().toISOString().split('T')[0]
      });
      
      // Add optional filters to query params if set
      if (filters.minFare !== undefined) params.set('minFare', String(filters.minFare));
      if (filters.maxFare !== undefined) params.set('maxFare', String(filters.maxFare));
      if (filters.minTime) params.set('minTime', filters.minTime);
      if (filters.maxTime) params.set('maxTime', filters.maxTime);
      if (filters.acOnly) params.set('acOnly', '1');
      if (filters.nonAcOnly) params.set('nonAcOnly', '1');
      
      const response = await fetch(`/api/trains/search?${params}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const trains = await response.json();
      console.log('Search results:', trains);

      // Client-side fallback filtering in case backend doesn't support all params
      let filtered = trains.filter((t: Train) => {
        if (filters.minFare !== undefined && t.baseFare < filters.minFare) return false;
        if (filters.maxFare !== undefined && t.baseFare > filters.maxFare) return false;
        if (filters.acOnly && !t.acAvailable) return false;
        if (filters.nonAcOnly && t.acAvailable) return false;
        if (filters.minTime && t.departureTime < filters.minTime) return false;
        if (filters.maxTime && t.departureTime > filters.maxTime) return false;
        return true;
      });

      // Sort by travel duration if shortestTime filter is enabled
      if (filters.shortestTime) {
        filtered = filtered.sort((a: Train, b: Train) => {
          const durationA = timeToMinutes(a.travelDuration);
          const durationB = timeToMinutes(b.travelDuration);
          return durationA - durationB;
        });
      }

      setSearchResults(filtered);
      setHasSearched(true);
    } catch (error) {
      console.error('Error searching trains:', error);
      alert('Search failed. Please try again.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      sourceStation: '',
      destinationStation: '',
      travelDate: '',
      minFare: undefined,
      maxFare: undefined,
      minTime: undefined,
      maxTime: undefined,
      acOnly: false,
      nonAcOnly: false,
      shortestTime: false,
    });
    setSearchResults([]);
    setHasSearched(false);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading trains...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-xl p-8 mb-8">
        <h1 className="text-3xl font-bold text-white mb-6">Search Trains</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <div className="relative">
              <MapPin className="absolute left-3 top-9 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <AutocompleteInput
                label="From Station"
                placeholder="Search station"
                value={filters.sourceStation}
                onChange={(v) => setFilters({ ...filters, sourceStation: v })}
                stations={stations}
              />
            </div>
          </div>

          <div>
            <div className="relative">
              <MapPin className="absolute left-3 top-9 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <AutocompleteInput
                label="To Station"
                placeholder="Search station"
                value={filters.destinationStation}
                onChange={(v) => setFilters({ ...filters, destinationStation: v })}
                stations={stations}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Travel Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={filters.travelDate}
                onChange={(e) => setFilters({ ...filters, travelDate: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSearch}
            className="flex-1 bg-white text-blue-600 py-3 px-6 rounded-lg font-semibold hover:bg-blue-50 transition flex items-center justify-center gap-2"
          >
            <Search className="w-5 h-5" />
            Search Trains
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-blue-800 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-900 transition flex items-center gap-2"
          >
            <Filter className="w-5 h-5" />
            Filters
          </button>
          {hasSearched && (
            <button
              onClick={resetFilters}
              className="bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition flex items-center gap-2"
            >
              <X className="w-5 h-5" />
              Reset
            </button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="bg-white rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Min Fare</label>
              <input
                type="number"
                value={filters.minFare ?? ''}
                onChange={(e) => setFilters({ ...filters, minFare: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full mt-1 p-2 border rounded"
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Max Fare</label>
              <input
                type="number"
                value={filters.maxFare ?? ''}
                onChange={(e) => setFilters({ ...filters, maxFare: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full mt-1 p-2 border rounded"
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Earliest Departure</label>
              <input
                type="time"
                value={filters.minTime ?? ''}
                onChange={(e) => setFilters({ ...filters, minTime: e.target.value || undefined })}
                className="w-full mt-1 p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Latest Departure</label>
              <input
                type="time"
                value={filters.maxTime ?? ''}
                onChange={(e) => setFilters({ ...filters, maxTime: e.target.value || undefined })}
                className="w-full mt-1 p-2 border rounded"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 mt-4 flex-wrap">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.acOnly || false}
                onChange={(e) => setFilters({ ...filters, acOnly: e.target.checked, nonAcOnly: false })}
              />
              <span className="text-sm">AC Only</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.nonAcOnly || false}
                onChange={(e) => setFilters({ ...filters, nonAcOnly: e.target.checked, acOnly: false })}
              />
              <span className="text-sm">Non-AC Only</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.shortestTime || false}
                onChange={(e) => setFilters({ ...filters, shortestTime: e.target.checked })}
              />
              <span className="text-sm">Shortest Travel Time</span>
            </label>
          </div>
        </div>
      )}

      {hasSearched && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Available Trains ({searchResults.length})
            </h2>
          </div>

          {searchResults.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <TrainIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No trains found</h3>
              <p className="text-gray-600">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="space-y-4">
              {searchResults.map((train) => (
                <div
                  key={train.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition border border-gray-200 p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{train.trainName}</h3>
                      <p className="text-sm text-gray-500">Train #{train.trainNumber}</p>
                    </div>
                    <div className="text-right">
                      {train.availableSeats > 0 ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                          {train.availableSeats} total seats available
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                          Fully Booked
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">From</p>
                        <p className="font-semibold text-gray-800">{train.sourceStation}</p>
                        <p className="text-sm text-gray-600">{train.departureTime}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-gray-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Duration</p>
                        <p className="font-semibold text-gray-800">{train.travelDuration}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">To</p>
                        <p className="font-semibold text-gray-800">{train.destinationStation}</p>
                        <p className="text-sm text-gray-600">{train.arrivalTime}</p>
                      </div>
                    </div>
                  </div>

                  {/* Seat Availability Breakdown */}
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-4 h-4 text-gray-600" />
                      <span className="font-semibold text-gray-800">Seat Availability</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">General Seats:</span>
                        <span className={`font-semibold ${
                          (train.generalSeatsAvailable || 0) > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {train.generalSeatsAvailable || 0} available
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">AC Seats:</span>
                        <span className={`font-semibold ${
                          (train.acSeatsAvailable || 0) > 0 ? 'text-blue-600' : 'text-red-600'
                        }`}>
                          {train.acSeatsAvailable || 0} available
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <IndianRupee className="w-4 h-4 text-gray-600" />
                        <span className="text-lg font-bold text-gray-800">₹{train.baseFare}</span>
                        <span className="text-sm text-gray-500">General</span>
                      </div>
                      {train.acAvailable && (
                        <div className="flex items-center gap-2">
                          <Armchair className="w-4 h-4 text-blue-600" />
                          <span className="text-lg font-bold text-blue-600">₹{train.acFare}</span>
                          <span className="text-sm text-gray-500">AC</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => onBookTrain(train, filters.sourceStation,filters.destinationStation)}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {train.availableSeats > 0 ? 'Book Now' : 'Join Waitlist'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};