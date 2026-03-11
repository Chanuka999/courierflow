import { useState } from "react";
import { api } from "../api/client";

const customerJourneySteps = [
  "Enter your tracking ID",
  "Check live status timeline",
  "View estimated delivery date",
  "Enable optional SMS / Email alerts",
];

const customerAccessPolicy = [
  "Read-only customer access",
  "No parcel edits allowed",
  "No internal system data visibility",
];

const statusEtaDays = {
  created: 3,
  picked_up: 2,
  in_transit: 1,
  out_for_delivery: 0,
  delivered: 0,
  failed: 2,
  returned: 3,
};

const getEstimatedDeliveryText = (parcel) => {
  if (!parcel) {
    return "Not available";
  }

  if (parcel.currentStatus === "delivered") {
    return "Delivered";
  }

  const dayOffset = statusEtaDays[parcel.currentStatus];
  if (dayOffset === undefined) {
    return "Not available";
  }

  const baseDate = parcel.updatedAt || parcel.createdAt;
  if (!baseDate) {
    return "Not available";
  }

  const etaDate = new Date(baseDate);
  etaDate.setDate(etaDate.getDate() + dayOffset);

  return etaDate.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const toStatusLabel = (status) => status?.replaceAll("_", " ") || "unknown";

const TrackingPage = () => {
  const [trackingId, setTrackingId] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [notifyBySms, setNotifyBySms] = useState(false);
  const [notifyByEmail, setNotifyByEmail] = useState(false);

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
    <section className="customer-portal">
      <article className="card">
        <p className="admin-kicker">Public Portal</p>
        <h1>Customer (Sender / Receiver)</h1>
        <p>
          Track your parcel and monitor delivery progress using only the
          tracking ID.
        </p>
      </article>

      <section className="card customer-guide-panel">
        <article className="customer-guide-steps">
          <p className="admin-kicker">How To Track</p>
          <h3>4 Quick Steps</h3>
          <ol>
            {customerJourneySteps.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </article>

        <article className="customer-access-policy">
          <p className="admin-kicker">Access Policy</p>
          <h3>Customer View</h3>
          <div className="customer-policy-chip-row">
            {customerAccessPolicy.map((item) => (
              <span key={item} className="customer-policy-chip">
                {item}
              </span>
            ))}
          </div>
        </article>
      </section>

      <article className="card">
        <h2>Track Parcel</h2>
        <form onSubmit={handleSearch}>
          <label>Tracking ID</label>
          <input
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
            placeholder="Enter tracking ID"
            required
          />

          <fieldset className="notification-options">
            <legend>Optional Notifications</legend>
            <label>
              <input
                type="checkbox"
                checked={notifyBySms}
                onChange={(event) => setNotifyBySms(event.target.checked)}
              />
              SMS alerts
            </label>
            <label>
              <input
                type="checkbox"
                checked={notifyByEmail}
                onChange={(event) => setNotifyByEmail(event.target.checked)}
              />
              Email alerts
            </label>
            <p className="status-note">
              This is currently preference-only UI. Notification delivery
              integration can be connected next.
            </p>
          </fieldset>

          <button type="submit">Search</button>
        </form>
      </article>

      {error ? <p className="error">{error}</p> : null}

      {result ? (
        <div className="tracking-result card">
          <h2>{result.parcel.trackingId}</h2>
          <p>Current Status: {toStatusLabel(result.parcel.currentStatus)}</p>
          <p>Receiver: {result.parcel.receiverName}</p>
          <p>Address: {result.parcel.receiverAddress}</p>
          <p>Estimated Delivery: {getEstimatedDeliveryText(result.parcel)}</p>

          <h3>Delivery Status Timeline</h3>
          <ul>
            {result.logs.map((log) => (
              <li key={log._id}>
                <strong>{toStatusLabel(log.status)}</strong> -{" "}
                {new Date(log.createdAt).toLocaleString()}
                {log.note ? ` - ${log.note}` : ""}
                {log.location ? ` | Location: ${log.location}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
};

export default TrackingPage;
