import { useState } from "react";
import { api } from "../api/client";

const TrackingPage = () => {
  const [trackingId, setTrackingId] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleSearch = async (event) => {
    event.preventDefault();
    setError("");
    setResult(null);

    try {
      const { data } = await api.get(`/parcels/tracking/${trackingId}`);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || "Tracking not found");
    }
  };

  return (
    <section className="card">
      <h1>Track Parcel</h1>
      <form onSubmit={handleSearch}>
        <label>Tracking ID</label>
        <input
          value={trackingId}
          onChange={(e) => setTrackingId(e.target.value)}
          required
        />
        <button type="submit">Search</button>
      </form>

      {error ? <p className="error">{error}</p> : null}

      {result ? (
        <div className="tracking-result">
          <h2>{result.parcel.trackingId}</h2>
          <p>Current Status: {result.parcel.currentStatus}</p>
          <p>Receiver: {result.parcel.receiverName}</p>
          <p>Address: {result.parcel.receiverAddress}</p>
          <h3>Status History</h3>
          <ul>
            {result.logs.map((log) => (
              <li key={log._id}>
                <strong>{log.status}</strong> -{" "}
                {new Date(log.createdAt).toLocaleString()}{" "}
                {log.note ? `- ${log.note}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
};

export default TrackingPage;
