import { useState } from "react";
import { api } from "../api/client";

const initialState = {
  senderName: "",
  senderPhone: "",
  receiverName: "",
  receiverPhone: "",
  receiverAddress: "",
  weightKg: 0,
  codAmount: 0,
  branch: "Main",
};

const CreateParcelPage = () => {
  const [form, setForm] = useState(initialState);
  const [trackingId, setTrackingId] = useState("");
  const [error, setError] = useState("");

  const setValue = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTrackingId("");
    setError("");

    try {
      const { data } = await api.post("/parcels", {
        ...form,
        weightKg: Number(form.weightKg),
        codAmount: Number(form.codAmount),
      });
      setTrackingId(data.trackingId);
      setForm(initialState);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create parcel");
    }
  };

  return (
    <section className="card">
      <h1>Create Parcel</h1>
      <form onSubmit={handleSubmit} className="form-grid">
        <label>Sender Name</label>
        <input
          value={form.senderName}
          onChange={(e) => setValue("senderName", e.target.value)}
          required
        />

        <label>Sender Phone</label>
        <input
          value={form.senderPhone}
          onChange={(e) => setValue("senderPhone", e.target.value)}
          required
        />

        <label>Receiver Name</label>
        <input
          value={form.receiverName}
          onChange={(e) => setValue("receiverName", e.target.value)}
          required
        />

        <label>Receiver Phone</label>
        <input
          value={form.receiverPhone}
          onChange={(e) => setValue("receiverPhone", e.target.value)}
          required
        />

        <label>Receiver Address</label>
        <textarea
          value={form.receiverAddress}
          onChange={(e) => setValue("receiverAddress", e.target.value)}
          required
        />

        <label>Weight (kg)</label>
        <input
          type="number"
          min="0"
          step="0.1"
          value={form.weightKg}
          onChange={(e) => setValue("weightKg", e.target.value)}
        />

        <label>COD Amount</label>
        <input
          type="number"
          min="0"
          value={form.codAmount}
          onChange={(e) => setValue("codAmount", e.target.value)}
        />

        <label>Branch</label>
        <input
          value={form.branch}
          onChange={(e) => setValue("branch", e.target.value)}
        />

        {error ? <p className="error">{error}</p> : null}
        {trackingId ? (
          <p className="success">Parcel created. Tracking ID: {trackingId}</p>
        ) : null}

        <button type="submit">Save Parcel</button>
      </form>
    </section>
  );
};

export default CreateParcelPage;
