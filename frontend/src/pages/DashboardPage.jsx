import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

const superAdminResponsibilities = [
  "System configuration manage කිරීම",
  "Branches create සහ manage කිරීම",
  "Users create සහ delete කිරීම",
  "System reports monitor කිරීම",
];

const superAdminPermissions = [
  "Create / Edit / Delete Users",
  "Create / Edit / Delete Branches",
  "View All Parcels (All Branches)",
  "Override Parcel Status",
  "Assign Branch Managers",
  "Access All Reports",
  "Configure Notifications / System settings",
  "View Audit Logs",
];

const superAdminExamples = [
  "New branch එකක් add කිරීම",
  "Manager කෙනෙක් assign කිරීම",
  "Wrong status එකක් fix කිරීම",
];

const initialBranchForm = {
  name: "",
  code: "",
  location: "",
  manager: "",
};

const initialUserForm = {
  name: "",
  email: "",
  password: "",
  role: "branch_manager",
  branch: "",
};

const adminSections = [
  { id: "dashboard", label: "Dashboard" },
  { id: "branch-management", label: "Branch Management" },
  { id: "user-management", label: "User Management" },
  { id: "settings", label: "Settings" },
  { id: "operational-summary", label: "Operational Summary" },
];

const branchManagerResponsibilities = [
  "Manage all parcels within the branch",
  "Create and supervise rider accounts",
  "Review and approve rider assignments",
  "Generate branch performance reports",
];

const branchManagerSections = [
  { id: "dashboard", label: "Dashboard" },
  { id: "branch-parcels", label: "Branch Parcels" },
  { id: "rider-management", label: "Rider Management" },
  { id: "assignment-approval", label: "Assignment Approval" },
  { id: "reports", label: "Reports" },
];

const formatRole = (role) => role?.replaceAll("_", " ") || "unknown";

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const isBranchManager = user?.role === "branch_manager";
  const [metrics, setMetrics] = useState({
    total: 0,
    delivered: 0,
    pending: 0,
  });
  const [adminData, setAdminData] = useState({
    summary: {
      totalParcels: 0,
      deliveredParcels: 0,
      pendingParcels: 0,
      codTotal: 0,
      branchCount: 0,
      userCount: 0,
    },
    branches: [],
    users: [],
    reports: { parcelsByBranch: [] },
  });
  const [branchForm, setBranchForm] = useState(initialBranchForm);
  const [userForm, setUserForm] = useState(initialUserForm);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [branchMessage, setBranchMessage] = useState("");
  const [userMessage, setUserMessage] = useState("");
  const [activeAdminSection, setActiveAdminSection] = useState("dashboard");
  const [activeBranchManagerSection, setActiveBranchManagerSection] = useState(
    "dashboard",
  );
  const [branchManagerData, setBranchManagerData] = useState({
    summary: {
      totalParcels: 0,
      deliveredParcels: 0,
      pendingParcels: 0,
      riderCount: 0,
    },
    parcels: [],
    riders: [],
    pendingAssignments: [],
    reports: {
      statusBreakdown: [],
      riderWorkload: [],
    },
  });
  const [branchManagerError, setBranchManagerError] = useState("");
  const [branchManagerLoading, setBranchManagerLoading] = useState(false);
  const [riderForm, setRiderForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [riderMessage, setRiderMessage] = useState("");
  const [selectedRiders, setSelectedRiders] = useState({});

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const { data } = await api.get("/parcels/metrics");
        setMetrics(data);
      } catch (error) {
        console.error(error);
      }
    };

    loadMetrics();
  }, []);

  useEffect(() => {
    if (!isSuperAdmin) {
      return undefined;
    }

    const loadAdminData = async () => {
      setAdminLoading(true);
      setAdminError("");

      try {
        const { data } = await api.get("/admin/dashboard");
        setAdminData(data);
      } catch (error) {
        setAdminError(error.response?.data?.message || "Failed to load admin data");
      } finally {
        setAdminLoading(false);
      }
    };

    loadAdminData();
    return undefined;
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!isBranchManager) {
      return undefined;
    }

    const loadBranchManagerData = async () => {
      setBranchManagerLoading(true);
      setBranchManagerError("");

      try {
        const { data } = await api.get("/branch-manager/dashboard");
        setBranchManagerData(data);
      } catch (error) {
        setBranchManagerError(
          error.response?.data?.message || "Failed to load branch manager data",
        );
      } finally {
        setBranchManagerLoading(false);
      }
    };

    loadBranchManagerData();
    return undefined;
  }, [isBranchManager]);

  const refreshAdminData = async () => {
    const { data } = await api.get("/admin/dashboard");
    setAdminData(data);
  };

  const refreshBranchManagerData = async () => {
    const { data } = await api.get("/branch-manager/dashboard");
    setBranchManagerData(data);
  };

  const handleBranchSubmit = async (event) => {
    event.preventDefault();
    setBranchMessage("");
    setAdminError("");

    try {
      await api.post("/admin/branches", {
        ...branchForm,
        manager: branchForm.manager || undefined,
      });
      setBranchForm(initialBranchForm);
      setBranchMessage("Branch created successfully");
      await refreshAdminData();
    } catch (error) {
      setAdminError(error.response?.data?.message || "Failed to create branch");
    }
  };

  const handleBranchStatusToggle = async (branchId, isActive) => {
    setAdminError("");

    try {
      await api.patch(`/admin/branches/${branchId}`, { isActive: !isActive });
      await refreshAdminData();
    } catch (error) {
      setAdminError(error.response?.data?.message || "Failed to update branch");
    }
  };

  const handleBranchDelete = async (branchId) => {
    setAdminError("");

    try {
      await api.delete(`/admin/branches/${branchId}`);
      await refreshAdminData();
    } catch (error) {
      setAdminError(error.response?.data?.message || "Failed to delete branch");
    }
  };

  const handleUserSubmit = async (event) => {
    event.preventDefault();
    setUserMessage("");
    setAdminError("");

    try {
      await api.post("/admin/users", userForm);
      setUserForm(initialUserForm);
      setUserMessage("User created successfully");
      await refreshAdminData();
    } catch (error) {
      setAdminError(error.response?.data?.message || "Failed to create user");
    }
  };

  const handleUserDelete = async (userId) => {
    setAdminError("");

    try {
      await api.delete(`/admin/users/${userId}`);
      await refreshAdminData();
    } catch (error) {
      setAdminError(error.response?.data?.message || "Failed to delete user");
    }
  };

  const handleRiderSubmit = async (event) => {
    event.preventDefault();
    setRiderMessage("");
    setBranchManagerError("");

    try {
      await api.post("/branch-manager/riders", riderForm);
      setRiderForm({ name: "", email: "", password: "" });
      setRiderMessage("Rider created successfully");
      await refreshBranchManagerData();
    } catch (error) {
      setBranchManagerError(
        error.response?.data?.message || "Failed to create rider",
      );
    }
  };

  const handleRiderDelete = async (riderId) => {
    setBranchManagerError("");

    try {
      await api.delete(`/branch-manager/riders/${riderId}`);
      await refreshBranchManagerData();
    } catch (error) {
      setBranchManagerError(
        error.response?.data?.message || "Failed to delete rider",
      );
    }
  };

  const handleAssignmentApprove = async (parcelId) => {
    const riderId = selectedRiders[parcelId];
    if (!riderId) {
      setBranchManagerError("Please select a rider before approving assignment");
      return;
    }

    setBranchManagerError("");

    try {
      await api.patch(`/branch-manager/assignments/${parcelId}/approve`, {
        riderId,
      });
      await refreshBranchManagerData();
      setSelectedRiders((prev) => ({ ...prev, [parcelId]: "" }));
    } catch (error) {
      setBranchManagerError(
        error.response?.data?.message || "Failed to approve assignment",
      );
    }
  };

  const branchManagers = adminData.users.filter(
    (entry) => entry.role === "branch_manager",
  );

  const activeAdminSectionLabel =
    adminSections.find((section) => section.id === activeAdminSection)?.label ||
    "Dashboard";

  const activeBranchManagerSectionLabel =
    branchManagerSections.find(
      (section) => section.id === activeBranchManagerSection,
    )?.label || "Dashboard";

  return (
    <section className="dashboard">
      <header className="topbar card">
        <div className="topbar-main">
          <p className="admin-kicker">Control Desk</p>
          <h1>CourierFlow Dashboard</h1>
          <p className="welcome-text">
            Welcome, {user?.name} ({user?.role})
          </p>
        </div>
        <div className="topbar-actions">
          <span className="role-pill">{formatRole(user?.role)}</span>
          <button type="button" className="logout-button" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      {isSuperAdmin ? (
        <section className="admin-console">
          <aside className="card admin-sidebar">
            <div className="admin-sidebar-header">
              <p className="admin-kicker">Navigation</p>
              <h3>Admin Menu</h3>
            </div>

            <div className="admin-sidebar-nav">
              {adminSections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  className={`admin-nav-button ${
                    activeAdminSection === section.id ? "active" : ""
                  }`}
                  onClick={() => setActiveAdminSection(section.id)}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </aside>

          <div className="admin-content">
            <section className="card super-admin-hero">
              <p className="admin-kicker">Super Admin Control Center</p>
              <h2>Highest Authority Role</h2>
              <p>
                System-level configuration, branch governance, user lifecycle,
                and full visibility are available in this role.
              </p>
              <div className="admin-chip-row">
                <span className="admin-chip">Global Access</span>
                <span className="admin-chip">Audit Ready</span>
                <span className="admin-chip">Branch Governance</span>
                <span className="admin-chip">Users & Reports</span>
              </div>
            </section>

            <section className="card admin-section-header">
              <p className="admin-kicker">Active Section</p>
              <h2>{activeAdminSectionLabel}</h2>
            </section>

            <section className="admin-workspace">
          {adminError ? <p className="error">{adminError}</p> : null}

              {activeAdminSection === "dashboard" ? (
                <>
                  <div className="grid-3">
                    <article className="card stat">
                      <h3>Total Parcels</h3>
                      <p>{metrics.total}</p>
                    </article>
                    <article className="card stat">
                      <h3>Delivered</h3>
                      <p>{metrics.delivered}</p>
                    </article>
                    <article className="card stat">
                      <h3>Pending</h3>
                      <p>{metrics.pending}</p>
                    </article>
                  </div>

                  <div className="card quick-links">
                    <h2>Quick Actions</h2>
                    <div className="actions">
                      <Link to="/parcels/new" className="button-link">
                        Create Parcel
                      </Link>
                      <Link to="/tracking" className="button-link outline">
                        Customer Tracking
                      </Link>
                    </div>
                  </div>

                  <section className="admin-grid-3">
                    <article className="card admin-panel-card">
                      <h3>Main Responsibilities</h3>
                      <ul className="admin-list">
                        {superAdminResponsibilities.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </article>

                    <article className="card admin-panel-card">
                      <h3>Permissions</h3>
                      <ul className="admin-list permissions-list">
                        {superAdminPermissions.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </article>

                    <article className="card admin-panel-card">
                      <h3>Example Actions</h3>
                      <ul className="admin-list">
                        {superAdminExamples.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </article>
                  </section>
                </>
              ) : null}

              {activeAdminSection === "branch-management" ? (
                <article className="card admin-panel-card admin-form-card">
              <div className="admin-card-header">
                <div>
                  <p className="admin-kicker">Branch Management</p>
                  <h3>Create / Manage Branches</h3>
                </div>
                <span className="admin-mini-stat">
                  {adminData.summary.branchCount} branches
                </span>
              </div>

              <form className="admin-form-grid" onSubmit={handleBranchSubmit}>
                <label>Branch Name</label>
                <input
                  value={branchForm.name}
                  onChange={(event) =>
                    setBranchForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  required
                />

                <label>Branch Code</label>
                <input
                  value={branchForm.code}
                  onChange={(event) =>
                    setBranchForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))
                  }
                  required
                />

                <label>Location</label>
                <input
                  value={branchForm.location}
                  onChange={(event) =>
                    setBranchForm((prev) => ({ ...prev, location: event.target.value }))
                  }
                />

                <label>Assign Manager</label>
                <select
                  value={branchForm.manager}
                  onChange={(event) =>
                    setBranchForm((prev) => ({ ...prev, manager: event.target.value }))
                  }
                >
                  <option value="">No manager selected</option>
                  {branchManagers.map((manager) => (
                    <option key={manager.id || manager._id} value={manager.id || manager._id}>
                      {manager.name}
                    </option>
                  ))}
                </select>

                {branchMessage ? <p className="success">{branchMessage}</p> : null}
                <button type="submit">Create Branch</button>
              </form>

              <div className="admin-entity-list">
                {adminLoading ? <p>Loading branches...</p> : null}
                {adminData.branches.map((branch) => (
                  <div className="admin-entity-row" key={branch._id}>
                    <div>
                      <strong>{branch.name}</strong>
                      <p>
                        {branch.code} | {branch.location || "No location"}
                      </p>
                      <p>
                        Manager: {branch.manager?.name || "Not assigned"} | Status: {branch.isActive ? "Active" : "Inactive"}
                      </p>
                    </div>
                    <div className="admin-row-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() =>
                          handleBranchStatusToggle(branch._id, branch.isActive)
                        }
                      >
                        {branch.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        className="danger-button"
                        onClick={() => handleBranchDelete(branch._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
                </article>
              ) : null}

              {activeAdminSection === "user-management" ? (
                <article className="card admin-panel-card admin-form-card">
              <div className="admin-card-header">
                <div>
                  <p className="admin-kicker">User Management</p>
                  <h3>Create / Delete Users</h3>
                </div>
                <span className="admin-mini-stat">
                  {adminData.summary.userCount} users
                </span>
              </div>

              <form className="admin-form-grid" onSubmit={handleUserSubmit}>
                <label>Name</label>
                <input
                  value={userForm.name}
                  onChange={(event) =>
                    setUserForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  required
                />

                <label>Email</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(event) =>
                    setUserForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  required
                />

                <label>Password</label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(event) =>
                    setUserForm((prev) => ({ ...prev, password: event.target.value }))
                  }
                  minLength={6}
                  required
                />

                <label>Role</label>
                <select
                  value={userForm.role}
                  onChange={(event) =>
                    setUserForm((prev) => ({ ...prev, role: event.target.value }))
                  }
                >
                  <option value="branch_manager">Branch Manager</option>
                  <option value="dispatcher">Dispatcher</option>
                  <option value="rider">Rider</option>
                  <option value="customer">Customer</option>
                </select>

                <label>Branch</label>
                <input
                  value={userForm.branch}
                  onChange={(event) =>
                    setUserForm((prev) => ({ ...prev, branch: event.target.value }))
                  }
                  placeholder="Colombo"
                />

                {userMessage ? <p className="success">{userMessage}</p> : null}
                <button type="submit">Create User</button>
              </form>

              <div className="admin-entity-list">
                {adminLoading ? <p>Loading users...</p> : null}
                {adminData.users.map((entry) => (
                  <div className="admin-entity-row" key={entry._id || entry.id}>
                    <div>
                      <strong>{entry.name}</strong>
                      <p>{entry.email}</p>
                      <p>
                        {formatRole(entry.role)} | {entry.branch || "No branch"}
                      </p>
                    </div>
                    <div className="admin-row-actions">
                      <button
                        type="button"
                        className="danger-button"
                        onClick={() => handleUserDelete(entry._id || entry.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
                </article>
              ) : null}

              {activeAdminSection === "settings" ? (
                <section className="admin-grid-2">
                  <article className="card admin-panel-card">
                    <h3>System Control Notes</h3>
                    <ul className="admin-list">
                      {superAdminResponsibilities.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>

                  <article className="card admin-panel-card">
                    <h3>Available Configuration Scope</h3>
                    <ul className="admin-list permissions-list">
                      {superAdminPermissions.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <p className="settings-note">
                      Notification rules, audit logs, and global system settings can
                      be expanded in this panel next.
                    </p>
                  </article>
                </section>
              ) : null}

              {activeAdminSection === "operational-summary" ? (
                <article className="card admin-panel-card report-panel">
            <div className="admin-card-header">
              <div>
                <p className="admin-kicker">System Reports</p>
                <h3>Operational Summary</h3>
              </div>
            </div>

            <div className="report-summary-grid">
              <div className="report-stat-box">
                <span>Total Parcels</span>
                <strong>{adminData.summary.totalParcels}</strong>
              </div>
              <div className="report-stat-box">
                <span>Delivered</span>
                <strong>{adminData.summary.deliveredParcels}</strong>
              </div>
              <div className="report-stat-box">
                <span>Pending</span>
                <strong>{adminData.summary.pendingParcels}</strong>
              </div>
              <div className="report-stat-box">
                <span>Total COD</span>
                <strong>Rs. {adminData.summary.codTotal}</strong>
              </div>
            </div>

            <div className="branch-report-list">
              <h4>Branch-wise Parcel Report</h4>
              {adminData.reports.parcelsByBranch.map((report) => (
                <div className="branch-report-row" key={report._id}>
                  <div>
                    <strong>{report._id}</strong>
                  </div>
                  <div className="branch-report-metrics">
                    <span>Total: {report.total}</span>
                    <span>Delivered: {report.delivered}</span>
                  </div>
                </div>
              ))}
            </div>
                </article>
              ) : null}
            </section>
          </div>
        </section>
      ) : null}

      {isBranchManager ? (
        <section className="admin-console">
          <aside className="card admin-sidebar">
            <div className="admin-sidebar-header">
              <p className="admin-kicker">Navigation</p>
              <h3>Branch Manager</h3>
            </div>

            <div className="admin-sidebar-nav">
              {branchManagerSections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  className={`admin-nav-button ${
                    activeBranchManagerSection === section.id ? "active" : ""
                  }`}
                  onClick={() => setActiveBranchManagerSection(section.id)}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </aside>

          <div className="admin-content">
            <section className="card super-admin-hero">
              <p className="admin-kicker">Branch Operations Control</p>
              <h2>Branch Manager</h2>
              <p>
                This role is responsible for day-to-day branch operations,
                delivery coordination, and team oversight.
              </p>
              <div className="admin-chip-row">
                {branchManagerResponsibilities.map((item) => (
                  <span key={item} className="admin-chip">
                    {item}
                  </span>
                ))}
              </div>
            </section>

            <section className="card admin-section-header">
              <p className="admin-kicker">Active Section</p>
              <h2>{activeBranchManagerSectionLabel}</h2>
            </section>

            <section className="admin-workspace">
              {branchManagerError ? <p className="error">{branchManagerError}</p> : null}

              {activeBranchManagerSection === "dashboard" ? (
                <>
                  <div className="grid-3">
                    <article className="card stat">
                      <h3>Total Parcels</h3>
                      <p>{branchManagerData.summary.totalParcels}</p>
                    </article>
                    <article className="card stat">
                      <h3>Delivered</h3>
                      <p>{branchManagerData.summary.deliveredParcels}</p>
                    </article>
                    <article className="card stat">
                      <h3>Riders</h3>
                      <p>{branchManagerData.summary.riderCount}</p>
                    </article>
                  </div>

                  <article className="card admin-panel-card">
                    <h3>Main Responsibilities</h3>
                    <ul className="admin-list">
                      {branchManagerResponsibilities.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>
                </>
              ) : null}

              {activeBranchManagerSection === "branch-parcels" ? (
                <article className="card admin-panel-card">
                  <div className="admin-card-header">
                    <div>
                      <p className="admin-kicker">Branch Parcels</p>
                      <h3>Manage Branch Parcels</h3>
                    </div>
                  </div>
                  <div className="admin-entity-list">
                    {branchManagerLoading ? <p>Loading parcels...</p> : null}
                    {branchManagerData.parcels.map((parcel) => (
                      <div className="admin-entity-row" key={parcel._id}>
                        <div>
                          <strong>{parcel.trackingId}</strong>
                          <p>
                            {parcel.receiverName} | {parcel.receiverAddress}
                          </p>
                          <p>
                            Status: {parcel.currentStatus} | Rider: {parcel.assignedRider?.name || "Not assigned"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ) : null}

              {activeBranchManagerSection === "rider-management" ? (
                <article className="card admin-panel-card admin-form-card">
                  <div className="admin-card-header">
                    <div>
                      <p className="admin-kicker">Rider Management</p>
                      <h3>Create / Delete Riders</h3>
                    </div>
                  </div>

                  <form className="admin-form-grid" onSubmit={handleRiderSubmit}>
                    <label>Name</label>
                    <input
                      value={riderForm.name}
                      onChange={(event) =>
                        setRiderForm((prev) => ({ ...prev, name: event.target.value }))
                      }
                      required
                    />

                    <label>Email</label>
                    <input
                      type="email"
                      value={riderForm.email}
                      onChange={(event) =>
                        setRiderForm((prev) => ({ ...prev, email: event.target.value }))
                      }
                      required
                    />

                    <label>Password</label>
                    <input
                      type="password"
                      value={riderForm.password}
                      onChange={(event) =>
                        setRiderForm((prev) => ({ ...prev, password: event.target.value }))
                      }
                      minLength={6}
                      required
                    />

                    {riderMessage ? <p className="success">{riderMessage}</p> : null}
                    <button type="submit">Create Rider</button>
                  </form>

                  <div className="admin-entity-list">
                    {branchManagerData.riders.map((rider) => (
                      <div className="admin-entity-row" key={rider._id || rider.id}>
                        <div>
                          <strong>{rider.name}</strong>
                          <p>{rider.email}</p>
                          <p>{rider.branch || "No branch"}</p>
                        </div>
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="danger-button"
                            onClick={() => handleRiderDelete(rider._id || rider.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ) : null}

              {activeBranchManagerSection === "assignment-approval" ? (
                <article className="card admin-panel-card">
                  <div className="admin-card-header">
                    <div>
                      <p className="admin-kicker">Assignment Approval</p>
                      <h3>Approve Parcel Assignments</h3>
                    </div>
                  </div>

                  <div className="admin-entity-list">
                    {branchManagerData.pendingAssignments.map((parcel) => (
                      <div className="admin-entity-row" key={parcel._id}>
                        <div>
                          <strong>{parcel.trackingId}</strong>
                          <p>
                            {parcel.receiverName} | {parcel.receiverAddress}
                          </p>
                        </div>
                        <div className="admin-row-actions branch-assign-actions">
                          <select
                            value={selectedRiders[parcel._id] || ""}
                            onChange={(event) =>
                              setSelectedRiders((prev) => ({
                                ...prev,
                                [parcel._id]: event.target.value,
                              }))
                            }
                          >
                            <option value="">Select rider</option>
                            {branchManagerData.riders.map((rider) => (
                              <option key={rider._id || rider.id} value={rider._id || rider.id}>
                                {rider.name}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => handleAssignmentApprove(parcel._id)}
                          >
                            Approve
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ) : null}

              {activeBranchManagerSection === "reports" ? (
                <article className="card admin-panel-card report-panel">
                  <div className="admin-card-header">
                    <div>
                      <p className="admin-kicker">Reports</p>
                      <h3>Branch Operational Summary</h3>
                    </div>
                  </div>

                  <div className="report-summary-grid">
                    <div className="report-stat-box">
                      <span>Total Parcels</span>
                      <strong>{branchManagerData.summary.totalParcels}</strong>
                    </div>
                    <div className="report-stat-box">
                      <span>Delivered</span>
                      <strong>{branchManagerData.summary.deliveredParcels}</strong>
                    </div>
                    <div className="report-stat-box">
                      <span>Pending</span>
                      <strong>{branchManagerData.summary.pendingParcels}</strong>
                    </div>
                    <div className="report-stat-box">
                      <span>Riders</span>
                      <strong>{branchManagerData.summary.riderCount}</strong>
                    </div>
                  </div>

                  <div className="branch-report-list">
                    <h4>Status Breakdown</h4>
                    {branchManagerData.reports.statusBreakdown.map((entry) => (
                      <div className="branch-report-row" key={entry._id}>
                        <strong>{entry._id}</strong>
                        <span>{entry.total}</span>
                      </div>
                    ))}
                  </div>

                  <div className="branch-report-list">
                    <h4>Rider Workload</h4>
                    {branchManagerData.reports.riderWorkload.map((entry) => (
                      <div className="branch-report-row" key={entry.riderId}>
                        <div>
                          <strong>{entry.riderName}</strong>
                          <p>{entry.riderEmail}</p>
                        </div>
                        <span>{entry.totalAssigned}</span>
                      </div>
                    ))}
                  </div>
                </article>
              ) : null}
            </section>
          </div>
        </section>
      ) : null}

      {!isSuperAdmin && !isBranchManager ? (
        <>
          <div className="grid-3">
            <article className="card stat">
              <h3>Total Parcels</h3>
              <p>{metrics.total}</p>
            </article>
            <article className="card stat">
              <h3>Delivered</h3>
              <p>{metrics.delivered}</p>
            </article>
            <article className="card stat">
              <h3>Pending</h3>
              <p>{metrics.pending}</p>
            </article>
          </div>

          <div className="card quick-links">
            <h2>Quick Actions</h2>
            <div className="actions">
              <Link to="/parcels/new" className="button-link">
                Create Parcel
              </Link>
              <Link to="/tracking" className="button-link outline">
                Customer Tracking
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
};

export default DashboardPage;
