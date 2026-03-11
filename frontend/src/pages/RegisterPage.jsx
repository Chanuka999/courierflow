import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

const roleOptions = [
  { value: "customer", label: "Customer" },
  { value: "dispatcher", label: "Dispatcher" },
  { value: "rider", label: "Rider" },
  { value: "branch_manager", label: "Branch Manager" },
  { value: "super_admin", label: "Super Admin" },
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "customer",
    branch: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        ...form,
        branch: form.branch.trim() || undefined,
      };

      const { data } = await api.post("/auth/register", payload);
      login(data);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card auth-card">
      <h1>Create Account</h1>
      <p>Register as customer or staff role for testing the system.</p>
      <form onSubmit={handleSubmit}>
        <label>Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, name: e.target.value }))
          }
          required
        />

        <label>Email</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, email: e.target.value }))
          }
          required
        />

        <label>Password</label>
        <input
          type="password"
          value={form.password}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, password: e.target.value }))
          }
          minLength={6}
          required
        />

        <label>Role</label>
        <select
          value={form.role}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, role: e.target.value }))
          }
        >
          {roleOptions.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>

        <label>Branch (optional)</label>
        <input
          type="text"
          value={form.branch}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, branch: e.target.value }))
          }
          placeholder="Colombo Main"
        />

        {error ? <p className="error">{error}</p> : null}

        <button type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="auth-switch-text">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </section>
  );
};

export default RegisterPage;
