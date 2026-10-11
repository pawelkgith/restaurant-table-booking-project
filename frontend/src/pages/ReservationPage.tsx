import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface Table {
  id: number;
  tableNumber: number;
  seats: number;
}

interface Reservation {
  id: number;
  tableId: number;
  reservationTime: string;
  guestsCount: number;
  specialRequests: string;
}

export const ReservationPage = () => {
  const { client, token, logout } = useAuth();
  const navigate = useNavigate();

  const [tables, setTables] = useState<Table[]>([]);
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const [tableId, setTableId] = useState<number>(1);
  const [reservationTime, setReservationTime] = useState<string>('');
  const [guestsCount, setGuestsCount] = useState<number>(2);
  const [specialRequests, setSpecialRequests] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isError, setIsError] = useState<boolean>(false);

  const fetchData = async () => {
    if (!client || !token) return;
    try {
      const tablesRes = await fetch('http://localhost:5128/api/reservations/tables');
      const tablesData = await tablesRes.json();
      setTables(tablesData);
      if (tablesData.length > 0) setTableId(tablesData[0].id);

      const resRes = await fetch(`http://localhost:5128/api/reservations/client/${client.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const resData = await resRes.json();
      setMyReservations(resData);
    } catch (err) {
      console.error('Error fetching data', err);
    }
  };

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    fetchData();
  }, [client, token]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!reservationTime) {
      setIsError(true);
      setMessage('Please select a date and time.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5128/api/reservations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client?.id,
          tableId,
          reservationTime,
          guestsCount: Number(guestsCount),
          specialRequests
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setIsError(true);
        setMessage(data.message || 'Reservation failed.');
      } else {
        setIsError(false);
        setMessage('Reservation successful!');
        fetchData();
      }
    } catch (error) {
      setIsError(true);
      setMessage(`Cannot connect to server: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center">
      <div className="max-w-4xl w-full flex justify-between items-center bg-white p-4 rounded-xl shadow mb-6">
        <h1 className="text-xl font-bold">Welcome, {client?.fullName}!</h1>
        <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 transition">
          Logout
        </button>
      </div>

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-lg font-bold mb-4">New Reservation</h2>
          {message && <div className={`p-3 mb-3 rounded text-sm ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{message}</div>}
          
          <form onSubmit={handleReservation} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Table:</label>
              <select value={tableId} onChange={(e) => setTableId(Number(e.target.value))} className="w-full border p-2 rounded-lg">
                {tables.map(t => <option key={t.id} value={t.id}>Table #{t.tableNumber} (Seats: {t.seats})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date & Time:</label>
              <input type="datetime-local" value={reservationTime} onChange={(e) => setReservationTime(e.target.value)} required className="w-full border p-2 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Guests Count:</label>
              <input type="number" min="1" value={guestsCount} onChange={(e) => setGuestsCount(Number(e.target.value))} required className="w-full border p-2 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Special Requests:</label>
              <textarea value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} className="w-full border p-2 rounded-lg" />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition">Reserve</button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-lg font-bold mb-4">Your Active Reservations</h2>
          {myReservations.length === 0 ? (
            <p className="text-gray-500 text-sm">No active reservations found.</p>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-96">
              {myReservations.map(res => (
                <div key={res.id} className="border p-3 rounded-lg bg-gray-50 text-sm">
                  <p><strong>Table ID:</strong> {res.tableId}</p>
                  <p><strong>Time:</strong> {new Date(res.reservationTime).toLocaleString()}</p>
                  <p><strong>Guests:</strong> {res.guestsCount}</p>
                  {res.specialRequests && <p><strong>Requests:</strong> {res.specialRequests}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};