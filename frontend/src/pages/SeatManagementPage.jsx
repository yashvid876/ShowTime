import { useEffect, useState } from "react";
import {
  createPhysicalSeats,
  deletePhysicalSeat,
  getPhysicalSeats,
  getScreens,
  getTheatres,
  updatePhysicalSeat,
} from "../api/admin.api.js";
import { apiMessage } from "../api/client.js";
import { ErrorMessage, Loading } from "../components/Feedback.jsx";

const seatTypes = ["regular", "premium", "recliner"];

export default function SeatManagementPage() {
  const [theatres, setTheatres] = useState([]);
  const [screens, setScreens] = useState([]);
  const [seats, setSeats] = useState([]);
  const [theatreId, setTheatreId] = useState("");
  const [screenId, setScreenId] = useState("");
  const [rowsInput, setRowsInput] = useState("A,B,C,D");
  const [seatCount, setSeatCount] = useState("10");
  const [seatType, setSeatType] = useState("regular");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    getTheatres()
      .then(setTheatres)
      .catch((reason) => setError(apiMessage(reason, "Couldn't load theatres.")))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setScreens([]);
    setScreenId("");
    setSeats([]);
    if (!theatreId) return;
    getScreens(theatreId)
      .then(setScreens)
      .catch((reason) => setError(apiMessage(reason, "Couldn't load screens for this theatre.")));
  }, [theatreId]);

  const loadSeats = () => {
    if (!screenId) {
      setSeats([]);
      return Promise.resolve();
    }
    setError("");
    return getPhysicalSeats(screenId)
      .then(setSeats)
      .catch((reason) => setError(apiMessage(reason, "Couldn't load seats for this screen.")));
  };

  useEffect(() => {
    loadSeats();
  }, [screenId]);

  const addSeats = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    const rows = rowsInput.split(",").map((row) => row.trim().toUpperCase());
    const count = Number(seatCount);
    if (
      !rows.length ||
      rows.some((row) => !/^[A-Z]{1,5}$/.test(row)) ||
      new Set(rows).size !== rows.length ||
      !Number.isInteger(count) ||
      count < 1
    ) {
      setError("Enter unique row labels (A–Z, comma-separated) and a positive whole number of seats per row.");
      return;
    }

    const newSeats = rows.flatMap((row) =>
      Array.from({ length: count }, (_, index) => ({
        row_label: row,
        seat_number: index + 1,
        seat_type: seatType,
      })),
    );

    setBusy(true);
    try {
      const result = await createPhysicalSeats(screenId, newSeats);
      setNotice(`${result.count} seats created.`);
      await loadSeats();
    } catch (reason) {
      setError(apiMessage(reason, "Couldn't create seats."));
    } finally {
      setBusy(false);
    }
  };

  const changeSeat = async (seat, changes) => {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await updatePhysicalSeat(seat.seat_id, changes);
      setSeats((current) =>
        current.map((item) => item.seat_id === seat.seat_id ? { ...item, ...changes } : item),
      );
      setNotice(`Seat ${seat.row_label}${seat.seat_number} updated.`);
    } catch (reason) {
      setError(apiMessage(reason, "Couldn't update this seat."));
    } finally {
      setBusy(false);
    }
  };

  const removeSeat = async (seat) => {
    if (!window.confirm(`Delete seat ${seat.row_label}${seat.seat_number}?`)) return;
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await deletePhysicalSeat(seat.seat_id);
      setSeats((current) => current.filter((item) => item.seat_id !== seat.seat_id));
      setNotice(`Seat ${seat.row_label}${seat.seat_number} deleted.`);
    } catch (reason) {
      setError(apiMessage(reason, "Couldn't delete this seat."));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loading label="Loading theatres…" />;

  return (
    <section className="section seat-admin-page">
      <a className="back-link" href="/admin">← Admin dashboard</a>
      <div className="eyebrow"><span className="eyebrow-line" /> VENUE SETUP</div>
      <div className="section-heading">
        <div><h1>Screen seats.</h1><p className="muted">Manage the physical seat inventory used by show seat maps.</p></div>
      </div>
      {error && <div className="inline-error admin-feedback" role="alert">{error}</div>}
      {notice && <div className="inline-success admin-feedback" role="status">{notice}</div>}
      {!error && theatres.length === 0 && <div className="inline-note">No theatres are available in the backend.</div>}
      <div className="admin-selectors">
        <label>Theatre
          <select value={theatreId} onChange={(event) => setTheatreId(event.target.value)}>
            <option value="">Choose a theatre</option>
            {theatres.map((theatre) => <option key={theatre.theatre_id} value={theatre.theatre_id}>{theatre.name} · {theatre.city}</option>)}
          </select>
        </label>
        <label>Screen
          <select value={screenId} onChange={(event) => setScreenId(event.target.value)} disabled={!theatreId}>
            <option value="">Choose a screen</option>
            {screens.map((screen) => <option key={screen.screen_id} value={screen.screen_id}>{screen.name}</option>)}
          </select>
        </label>
      </div>

      {screenId && (
        <>
          <form className="admin-create-form" onSubmit={addSeats}>
            <div>
              <h2>Add seat rows</h2>
              <p className="muted">Creates physical seats for this screen. Existing row/number pairs are rejected by the backend.</p>
            </div>
            <label>Row labels
              <input value={rowsInput} onChange={(event) => setRowsInput(event.target.value)} placeholder="A,B,C,D" required />
            </label>
            <label>Seats per row
              <input type="number" min="1" step="1" value={seatCount} onChange={(event) => setSeatCount(event.target.value)} required />
            </label>
            <label>Category
              <select value={seatType} onChange={(event) => setSeatType(event.target.value)}>
                {seatTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>
            <button className="button button-primary" type="submit" disabled={busy}>Create seats <span aria-hidden="true">→</span></button>
          </form>

          <div className="admin-table-wrap">
            <div className="admin-table-heading"><h2>Seat inventory</h2><span>{seats.length} seats</span></div>
            {seats.length === 0 ? (
              <div className="inline-note">No physical seats exist for this screen.</div>
            ) : (
              <table className="admin-table">
                <thead><tr><th>Seat</th><th>Category</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {seats.map((seat) => (
                    <tr key={seat.seat_id}>
                      <td>{seat.row_label}{seat.seat_number}</td>
                      <td>
                        <label className="sr-only" htmlFor={`type-${seat.seat_id}`}>Category for {seat.row_label}{seat.seat_number}</label>
                        <select
                          id={`type-${seat.seat_id}`}
                          value={seat.seat_type}
                          disabled={busy}
                          onChange={(event) => changeSeat(seat, { seat_type: event.target.value })}
                        >
                          {seatTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                        </select>
                      </td>
                      <td><span className={`status-pill ${seat.is_active ? "status-booked" : "status-cancelled"}`}>{seat.is_active ? "Active" : "Inactive"}</span></td>
                      <td className="admin-table-actions">
                        <button className="text-button" disabled={busy} onClick={() => changeSeat(seat, { is_active: !Boolean(seat.is_active) })}>
                          {seat.is_active ? "Deactivate" : "Activate"}
                        </button>
                        <button className="text-button danger-button" disabled={busy} onClick={() => removeSeat(seat)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
      {!screenId && theatreId && screens.length === 0 && <div className="inline-note">This theatre has no screens yet.</div>}
    </section>
  );
}
