// src/components/user/SearchTrains.tsx
import React, { useState } from 'react';

type ResultRow = {
  trainNo: string;
  trainName: string;
  travelTime: string;
  distance: number | null;
  fare: number | null;
  acAvailable: boolean;
  nextSchedules: string[];
};

export default function SearchTrains() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [coachClass, setCoachClass] = useState('');
  const [minFare, setMinFare] = useState<number | ''>('');
  const [maxFare, setMaxFare] = useState<number | ''>('');
  const [sortBy, setSortBy] = useState<'shortest_time'|'shortest_distance'|'least_fare'|'date_proximity'|''>('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError(null);
    if (!from || !to) {
      setError('Please enter both From and To stations.');
      return;
    }
    setLoading(true);
    try {
      const payload: any = {
        from, to
      };
      if (startDate) payload.startDate = startDate;
      if (endDate) payload.endDate = endDate;
      if (coachClass) payload.coachClass = coachClass;
      if (minFare !== '') payload.minFare = Number(minFare);
      if (maxFare !== '') payload.maxFare = Number(maxFare);
      if (sortBy) payload.sortBy = sortBy;

      const resp = await fetch('/api/trains/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        const j = await resp.json().catch(()=>null);
        throw new Error(j?.error || 'Search failed');
      }

      const data = await resp.json();
      setResults(data || []);
    } catch (err: any) {
      console.error('Search error', err);
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 12 }}>
      <h3>Search Trains</h3>
      <form onSubmit={handleSearch} style={{ display: 'grid', gap: 8, maxWidth: 800 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="From" value={from} onChange={e=>setFrom(e.target.value)} />
          <input placeholder="To" value={to} onChange={e=>setTo(e.target.value)} />
          <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} />
          <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <select value={coachClass} onChange={e=>setCoachClass(e.target.value)}>
            <option value="">Any class</option>
            <option value="AC">AC</option>
            <option value="Non-AC">Non-AC</option>
            <option value="Sleeper">Sleeper</option>
          </select>

          <input placeholder="Min fare" type="number" value={minFare as any} onChange={e=>setMinFare(e.target.value === '' ? '' : Number(e.target.value))} />
          <input placeholder="Max fare" type="number" value={maxFare as any} onChange={e=>setMaxFare(e.target.value === '' ? '' : Number(e.target.value))} />

          <select value={sortBy} onChange={e=>setSortBy(e.target.value as any)}>
            <option value="">Default sort</option>
            <option value="shortest_time">Shortest time</option>
            <option value="shortest_distance">Shortest distance</option>
            <option value="least_fare">Least fare</option>
            <option value="date_proximity">Closest date</option>
          </select>

          <button type="submit" disabled={loading}>{loading ? 'Searching...' : 'Search'}</button>
        </div>
      </form>

      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}

      <div style={{ marginTop: 16 }}>
        <h4>Results ({results.length})</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ borderBottom: '1px solid #ddd', padding: 8 }}>Train</th>
              <th style={{ borderBottom: '1px solid #ddd', padding: 8 }}>Time</th>
              <th style={{ borderBottom: '1px solid #ddd', padding: 8 }}>Distance (km)</th>
              <th style={{ borderBottom: '1px solid #ddd', padding: 8 }}>Fare (₹)</th>
              <th style={{ borderBottom: '1px solid #ddd', padding: 8 }}>AC</th>
              <th style={{ borderBottom: '1px solid #ddd', padding: 8 }}>Next Dates</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={r.trainNo + i}>
                <td style={{ padding: 8 }}>{r.trainName} ({r.trainNo})</td>
                <td style={{ padding: 8 }}>{r.travelTime}</td>
                <td style={{ padding: 8 }}>{r.distance ?? 'N/A'}</td>
                <td style={{ padding: 8 }}>{r.fare ?? 'N/A'}</td>
                <td style={{ padding: 8 }}>{r.acAvailable ? 'Yes' : 'No'}</td>
                <td style={{ padding: 8 }}>{(r.nextSchedules || []).slice(0,3).join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
