import { useEffect, useRef, useState } from 'react';
import { Station } from '../../types';

interface AutocompleteInputProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  stations: string[]; // Add the stations prop
}

export const AutocompleteInput = ({ 
  label, 
  placeholder, 
  value, 
  onChange, 
  stations // Destructure the stations prop
}: AutocompleteInputProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<Station[]>([]);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedValue = useDebounce(value, 200);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        setLoading(true);
        setError(null);
        if (!debouncedValue || debouncedValue.trim().length < 1) {
          setOptions([]);
          setLoading(false);
          return;
        }
        const q = debouncedValue.toLowerCase();
        const matched = stations
          .filter((s) => s.toLowerCase().includes(q))
          .slice(0, 10)
          .map((station_name) => ({ station_name }));
        setOptions(matched as Station[]);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to search stations';
        setError(errorMessage);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchStations();
  }, [debouncedValue, stations]);

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-medium text-white mb-2">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      />
      {open && (loading || error || options.length > 0) && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-64 overflow-auto">
          {loading && (
            <div className="px-4 py-3 text-sm text-gray-500">Searching…</div>
          )}
          {error && !loading && (
            <div className="px-4 py-3 text-sm text-red-600">{error}</div>
          )}
          {!loading && !error && options.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500">No results</div>
          )}
          {!loading && !error && options.map((s) => (
            <button
              key={s.station_name}
              type="button"
              onClick={() => {
                onChange(s.station_name);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
            >
              <span className="font-medium text-gray-800">{s.station_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

function useDebounce<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}