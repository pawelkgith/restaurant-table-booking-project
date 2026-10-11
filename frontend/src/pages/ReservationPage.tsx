import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { RotateCcw } from "lucide-react";

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
  durationHours: number;
}

interface TimeSlot {
  time: string;
  formattedTime: string;
  isAvailable: boolean;
}

export const ReservationPage = () => {
  const { client, token, logout } = useAuth();
  const navigate = useNavigate();

  const [tables, setTables] = useState<Table[]>([]);
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  const [tableId, setTableId] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [durationHours, setDurationHours] = useState<number>(2);
  const [reservationTime, setReservationTime] = useState<string>("");
  const [guestsCount, setGuestsCount] = useState<number>(2);
  const [specialRequests, setSpecialRequests] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isError, setIsError] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInitialData = async () => {
    if (!client || !token) return;
    try {
      const tablesRes = await fetch(
        "http://localhost:5128/api/reservations/tables",
      );
      const tablesData = await tablesRes.json();
      setTables(tablesData);
      if (tablesData.length > 0 && !tableId) setTableId(tablesData[0].id);

      const resRes = await fetch(
        `http://localhost:5128/api/reservations/client/${client.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const resData = await resRes.json();
      setMyReservations(resData);
    } catch (err) {
      console.error("Error fetching data", err);
    }
  };

  const fetchAvailability = async () => {
    if (!tableId || !selectedDate) return;
    try {
      const res = await fetch(
        `http://localhost:5128/api/reservations/availability?tableId=${tableId}&date=${selectedDate}&durationHours=${durationHours}`,
      );
      const data = await res.json();
      setTimeSlots(data);
    } catch (err) {
      console.error("Error fetching availaiblity", err);
    }
  };

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    fetchInitialData();
  }, [client, token]);

  useEffect(() => {
    fetchAvailability();
  }, [tableId, selectedDate, durationHours]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleReservation = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    if (!reservationTime) {
      setIsError(true);
      setMessage("Please select a date and time.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5128/api/reservations/create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: client?.id,
            tableId,
            reservationTime,
            guestsCount: Number(guestsCount),
            specialRequests,
            durationHours: Number(durationHours),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setIsError(true);
        setMessage(data.message || "Reservation failed.");
      } else {
        setIsError(false);
        setMessage("Reservation successful!");
        setReservationTime("");
        fetchInitialData();
        fetchAvailability();
      }
    } catch (error) {
      setIsError(true);
      setMessage(`Cannot connect to server: ${error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center">
      <div className="max-w-4xl w-full flex justify-between items-center bg-white p-4 rounded-xl shadow mb-6">
        <h1 className="text-xl font-bold">Welcome, {client?.fullName}!</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>

      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow md:col-span-1 space-y-4">
          <h2 className="text-lg font-bold">Check availability</h2>

          <div>
            <label className="block text-sm font-medium mb-1">
              Select table
            </label>
            <select
              value={tableId}
              onChange={(e) => setTableId(Number(e.target.value))}
              className="w-full border p-2 rounded-lg"
            >
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  Table #{t.tableNumber} ({t.seats} seats)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Select date
            </label>
            <input
              type="date"
              value={selectedDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border p-2 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Duration (hours)
            </label>
            <select
              value={durationHours}
              onChange={(e) => setDurationHours(Number(e.target.value))}
              className="w-full border p-2 rounded-lg"
            >
              <option value={1}>1 hour</option>
              <option value={2}>2 hours</option>
              <option value={3}>3 hours</option>
              <option value={4}>4 hours</option>
            </select>
          </div>

          <div className="pt-2">
            <h3 className="text-sm font-semibold mb-2">
              Time slots for this day
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {timeSlots.map((slot, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={!slot.isAvailable}
                  onClick={() => setReservationTime(slot.time)}
                  className={`w-full p-2 rounded-lg text-sm font-medium flex justify-between items-center transition ${
                    !slot.isAvailable
                      ? "bg-red-100 text-red-500 cursor-not-allowed line-through"
                      : reservationTime === slot.time
                        ? "bg-blue-600 text-white shadow"
                        : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                  }`}
                >
                  <span>{slot.formattedTime}</span>
                  <span>{slot.isAvailable ? "Available" : "Reserved"}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow md:col-span-1">
          <h2 className="text-lg font-bold mb-4">New reservation</h2>
          {message && (
            <div
              className={`p-3 mb-3 rounded text-sm ${isError ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleReservation} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Selected time slot
              </label>
              <input
                type="text"
                readOnly
                value={
                  reservationTime
                    ? new Date(reservationTime).toLocaleString()
                    : "Click a slot on the left"
                }
                className="w-full border bg-gray-50 p-2 rounded-lg text-sm text-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Guests count
              </label>
              <input
                type="number"
                min="1"
                value={guestsCount}
                onChange={(e) => setGuestsCount(Number(e.target.value))}
                required
                className="w-full border p-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Special requests
              </label>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                className="w-full border p-2 rounded-lg resize-none"
              />
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition shadow flex items-center justify-center"
              >
                {isSubmitting ? (
                  <RotateCcw
                    className="w-5 h-5 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  "Confirm reservation"
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white p-6 rounded-xl shadow md:col-span-1">
          <h2 className="text-lg font-bold mb-4">Your active reservations</h2>
          {myReservations.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No active reservations found.
            </p>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-96">
              {myReservations.map((res) => (
                <div
                  key={res.id}
                  className="border p-3 rounded-lg bg-gray-50 text-sm space-y-1"
                >
                  <p>
                    <strong>Table ID: </strong>
                    {res.tableId}
                  </p>
                  <p>
                    <strong>Time: </strong>
                    {new Date(res.reservationTime).toLocaleString()}
                  </p>
                  <p>
                    <strong>Guests: </strong>
                    {res.guestsCount}
                  </p>
                  <p>
                    <strong>Duration: </strong>
                    {`${res.durationHours} hours`}
                  </p>
                  {res.specialRequests && (
                    <p>
                      <strong>Requests:</strong> {res.specialRequests}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
