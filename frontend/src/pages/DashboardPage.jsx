import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { Package, CheckCircle, Clock, MapPin, Search } from "lucide-react";

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

const dispatcherResponsibilities = [
  "Create and manage parcel operations",
  "Support rider assignment workflows",
  "Monitor delivery and status tracking",
];

const dispatcherPermissions = [
  "Create Parcel",
  "Edit Parcel Details (Before Pickup)",
  "Assign Rider",
  "View Delivery Status",
  "Track All Branch Parcels",
];

const dispatcherLimitations = ["Cannot create branches", "Cannot manage users"];

const dispatcherSections = [
  { id: "dashboard", label: "Dashboard" },
  { id: "parcel-operations", label: "Parcel Operations" },
  { id: "assignment-support", label: "Assignment Support" },
  { id: "delivery-monitor", label: "Delivery Monitor" },
];

const riderResponsibilities = [
  "Handle assigned parcels only",
  "Update delivery progress in real time",
  "Capture proof details for completed deliveries",
];

const riderPermissions = [
  "View assigned parcels",
  "Update status: picked_up, in_transit, out_for_delivery, delivered, failed",
  "Add delivery notes and location",
  "Attach delivery proof photo and receiver signature name",
];

const riderLimitations = [
  "Cannot create parcels",
  "Cannot edit parcel details",
  "Cannot assign riders",
  "Cannot view unassigned parcels",
];

const riderSections = [
  { id: "dashboard", label: "Dashboard" },
  { id: "assigned-parcels", label: "Assigned Parcels" },
  { id: "status-updates", label: "Status Updates" },
];

const riderStatusOptions = [
  { value: "picked_up", label: "Picked Up" },
  { value: "in_transit", label: "In Transit" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "failed", label: "Failed Delivery" },
];

const parcelStatusTransitions = {
  created: ["picked_up", "failed"],
  picked_up: ["in_transit", "failed"],
  in_transit: ["out_for_delivery", "failed"],
  out_for_delivery: ["delivered", "failed"],
  delivered: [],
  failed: ["out_for_delivery"],
  returned: [],
};

const formatRole = (role) => role?.replaceAll("_", " ") || "unknown";

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const isBranchManager = user?.role === "branch_manager";
  const isDispatcher = user?.role === "dispatcher";
  const isRider = user?.role === "rider";
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
  const [activeBranchManagerSection, setActiveBranchManagerSection] =
    useState("dashboard");
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
  const [activeDispatcherSection, setActiveDispatcherSection] =
    useState("dashboard");
  const [dispatcherData, setDispatcherData] = useState({
    parcels: [],
    riders: [],
  });
  const [dispatcherError, setDispatcherError] = useState("");
  const [dispatcherLoading, setDispatcherLoading] = useState(false);
  const [dispatcherEditParcelId, setDispatcherEditParcelId] = useState("");
  const [dispatcherEditForm, setDispatcherEditForm] = useState({
    receiverName: "",
    receiverPhone: "",
    receiverAddress: "",
    codAmount: 0,
  });
  const [activeRiderSection, setActiveRiderSection] = useState("dashboard");
  const [riderData, setRiderData] = useState({ parcels: [] });
  const [riderError, setRiderError] = useState("");
  const [riderLoading, setRiderLoading] = useState(false);
  const [riderStatusForms, setRiderStatusForms] = useState({});

  const refreshMetrics = async () => {
    const { data } = await api.get("/parcels/metrics");
    setMetrics(data);
  };

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        await refreshMetrics();
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
        setAdminError(
          error.response?.data?.message || "Failed to load admin data",
        );
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

  useEffect(() => {
    if (!isDispatcher) {
      return undefined;
    }

    const loadDispatcherData = async () => {
      setDispatcherLoading(true);
      setDispatcherError("");

      try {
        const [parcelsRes, ridersRes] = await Promise.all([
          api.get("/parcels"),
          api.get("/parcels/riders"),
        ]);

        setDispatcherData({
          parcels: parcelsRes.data,
          riders: ridersRes.data,
        });
      } catch (error) {
        setDispatcherError(
          error.response?.data?.message || "Failed to load dispatcher data",
        );
      } finally {
        setDispatcherLoading(false);
      }
    };

    loadDispatcherData();
    return undefined;
  }, [isDispatcher]);

  useEffect(() => {
    if (!isRider) {
      return undefined;
    }

    const loadRiderData = async () => {
      setRiderLoading(true);
      setRiderError("");

      try {
        const { data } = await api.get("/parcels");
        setRiderData({ parcels: data });
      } catch (error) {
        setRiderError(
          error.response?.data?.message || "Failed to load assigned parcels",
        );
      } finally {
        setRiderLoading(false);
      }
    };

    loadRiderData();

    const intervalId = setInterval(() => {
      loadRiderData();
      refreshMetrics().catch((error) => {
        console.error(error);
      });
    }, 10000);

    return () => clearInterval(intervalId);
  }, [isRider]);

  useEffect(() => {
    if (!isRider) {
      return undefined;
    }

    refreshMetrics().catch((error) => {
      console.error(error);
    });

    return undefined;
  }, [isRider, activeRiderSection]);

  const refreshAdminData = async () => {
    const { data } = await api.get("/admin/dashboard");
    setAdminData(data);
  };

  const refreshBranchManagerData = async () => {
    const { data } = await api.get("/branch-manager/dashboard");
    setBranchManagerData(data);
  };

  const refreshDispatcherData = async () => {
    const [parcelsRes, ridersRes] = await Promise.all([
      api.get("/parcels"),
      api.get("/parcels/riders"),
    ]);

    setDispatcherData({
      parcels: parcelsRes.data,
      riders: ridersRes.data,
    });
  };

  const refreshRiderData = async () => {
    const { data } = await api.get("/parcels");
    setRiderData({ parcels: data });
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
      setBranchManagerError(
        "Please select a rider before approving assignment",
      );
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

  const handleDispatcherAssignRider = async (parcelId) => {
    const riderId = selectedRiders[parcelId];
    if (!riderId) {
      setDispatcherError("Please select a rider before assignment");
      return;
    }

    setDispatcherError("");

    try {
      await api.patch(`/parcels/${parcelId}/assign`, { riderId });
      await refreshDispatcherData();
      setSelectedRiders((prev) => ({ ...prev, [parcelId]: "" }));
    } catch (error) {
      setDispatcherError(
        error.response?.data?.message || "Failed to assign rider",
      );
    }
  };

  const startDispatcherEdit = (parcel) => {
    setDispatcherEditParcelId(parcel._id);
    setDispatcherEditForm({
      receiverName: parcel.receiverName || "",
      receiverPhone: parcel.receiverPhone || "",
      receiverAddress: parcel.receiverAddress || "",
      codAmount: parcel.codAmount || 0,
    });
  };

  const handleDispatcherParcelEditSave = async (parcelId) => {
    setDispatcherError("");

    try {
      await api.patch(`/parcels/${parcelId}/details`, dispatcherEditForm);
      setDispatcherEditParcelId("");
      await refreshDispatcherData();
    } catch (error) {
      setDispatcherError(
        error.response?.data?.message || "Failed to update parcel details",
      );
    }
  };

  const handleRiderStatusChange = (parcelId, key, value) => {
    setRiderStatusForms((prev) => ({
      ...prev,
      [parcelId]: {
        status: prev[parcelId]?.status || "picked_up",
        note: prev[parcelId]?.note || "",
        location: prev[parcelId]?.location || "",
        proofImageUrl: prev[parcelId]?.proofImageUrl || "",
        proofImageFile: prev[parcelId]?.proofImageFile || null,
        signatureName: prev[parcelId]?.signatureName || "",
        [key]: value,
      },
    }));
  };

  const handleRiderStatusSubmit = async (parcel) => {
    setRiderError("");
    const parcelId = parcel._id;
    const allowedStatuses = parcelStatusTransitions[parcel.currentStatus] || [];
    const defaultStatus = allowedStatuses[0] || "";
    const formState = riderStatusForms[parcelId] || {
      status: defaultStatus,
      note: "",
      location: "",
      proofImageUrl: "",
      proofImageFile: null,
      signatureName: "",
    };
    const selectedStatus = allowedStatuses.includes(formState.status)
      ? formState.status
      : defaultStatus;

    if (!selectedStatus) {
      setRiderError(
        `No valid status transition available from ${parcel.currentStatus}`,
      );
      return;
    }

    try {
      let uploadedProofImageUrl = formState.proofImageUrl || "";

      if (formState.proofImageFile) {
        const proofFormData = new FormData();
        proofFormData.append("proofImage", formState.proofImageFile);
        const { data } = await api.post(
          `/parcels/${parcelId}/proof-upload`,
          proofFormData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );
        uploadedProofImageUrl = data?.proofImageUrl || "";
      }

      const payload = {
        status: selectedStatus,
        note: formState.note,
        location: formState.location,
        proofImageUrl: uploadedProofImageUrl,
        signatureName: formState.signatureName,
      };

      await api.patch(`/parcels/${parcelId}/status`, payload);
      await Promise.all([refreshRiderData(), refreshMetrics()]);
      setRiderStatusForms((prev) => ({
        ...prev,
        [parcelId]: {
          ...(prev[parcelId] || {}),
          proofImageFile: null,
          proofImageUrl: uploadedProofImageUrl,
        },
      }));
    } catch (error) {
      setRiderError(
        error.response?.data?.message || "Failed to update parcel status",
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

  const activeDispatcherSectionLabel =
    dispatcherSections.find((section) => section.id === activeDispatcherSection)
      ?.label || "Dashboard";

  const activeRiderSectionLabel =
    riderSections.find((section) => section.id === activeRiderSection)?.label ||
    "Dashboard";

  return (
    <section className="dashboard" data-role={user?.role || "customer"}>
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
            <section className="card super-admin-hero hero-with-image">
              <div className="hero-text-content">
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
              </div>
              <div className="hero-image-container">
                <img src="/images/admin_hero.png" alt="Super Admin Control Center" />
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

                  <section className="card admin-command-board">
                    <div className="admin-command-head">
                      <p className="admin-kicker">Admin Command Board</p>
                      <h3>Choose Your Next Action</h3>
                    </div>

                    <div className="admin-command-grid">
                      <article className="admin-command-card">
                        <span>Branch Governance</span>
                        <strong>
                          {adminData.summary.branchCount} branches
                        </strong>
                        <p>
                          Create, update, and monitor all branch operations.
                        </p>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() =>
                            setActiveAdminSection("branch-management")
                          }
                        >
                          Open Branch Management
                        </button>
                      </article>

                      <article className="admin-command-card">
                        <span>User Access</span>
                        <strong>{adminData.summary.userCount} users</strong>
                        <p>
                          Manage role access and account lifecycle controls.
                        </p>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() =>
                            setActiveAdminSection("user-management")
                          }
                        >
                          Open User Management
                        </button>
                      </article>

                      <article className="admin-command-card">
                        <span>System Oversight</span>
                        <strong>
                          {adminData.summary.totalParcels} parcels
                        </strong>
                        <p>
                          Track delivery health and network performance quickly.
                        </p>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() =>
                            setActiveAdminSection("operational-summary")
                          }
                        >
                          View Operational Summary
                        </button>
                      </article>
                    </div>
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

                  <form
                    className="admin-form-grid"
                    onSubmit={handleBranchSubmit}
                  >
                    <label>Branch Name</label>
                    <input
                      value={branchForm.name}
                      onChange={(event) =>
                        setBranchForm((prev) => ({
                          ...prev,
                          name: event.target.value,
                        }))
                      }
                      required
                    />

                    <label>Branch Code</label>
                    <input
                      value={branchForm.code}
                      onChange={(event) =>
                        setBranchForm((prev) => ({
                          ...prev,
                          code: event.target.value.toUpperCase(),
                        }))
                      }
                      required
                    />

                    <label>Location</label>
                    <input
                      value={branchForm.location}
                      onChange={(event) =>
                        setBranchForm((prev) => ({
                          ...prev,
                          location: event.target.value,
                        }))
                      }
                    />

                    <label>Assign Manager</label>
                    <select
                      value={branchForm.manager}
                      onChange={(event) =>
                        setBranchForm((prev) => ({
                          ...prev,
                          manager: event.target.value,
                        }))
                      }
                    >
                      <option value="">No manager selected</option>
                      {branchManagers.map((manager) => (
                        <option
                          key={manager.id || manager._id}
                          value={manager.id || manager._id}
                        >
                          {manager.name}
                        </option>
                      ))}
                    </select>

                    {branchMessage ? (
                      <p className="success">{branchMessage}</p>
                    ) : null}
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
                            Manager: {branch.manager?.name || "Not assigned"} |
                            Status: {branch.isActive ? "Active" : "Inactive"}
                          </p>
                        </div>
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() =>
                              handleBranchStatusToggle(
                                branch._id,
                                branch.isActive,
                              )
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
                        setUserForm((prev) => ({
                          ...prev,
                          name: event.target.value,
                        }))
                      }
                      required
                    />

                    <label>Email</label>
                    <input
                      type="email"
                      value={userForm.email}
                      onChange={(event) =>
                        setUserForm((prev) => ({
                          ...prev,
                          email: event.target.value,
                        }))
                      }
                      required
                    />

                    <label>Password</label>
                    <input
                      type="password"
                      value={userForm.password}
                      onChange={(event) =>
                        setUserForm((prev) => ({
                          ...prev,
                          password: event.target.value,
                        }))
                      }
                      minLength={6}
                      required
                    />

                    <label>Role</label>
                    <select
                      value={userForm.role}
                      onChange={(event) =>
                        setUserForm((prev) => ({
                          ...prev,
                          role: event.target.value,
                        }))
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
                        setUserForm((prev) => ({
                          ...prev,
                          branch: event.target.value,
                        }))
                      }
                      placeholder="Colombo"
                    />

                    {userMessage ? (
                      <p className="success">{userMessage}</p>
                    ) : null}
                    <button type="submit">Create User</button>
                  </form>

                  <div className="admin-entity-list">
                    {adminLoading ? <p>Loading users...</p> : null}
                    {adminData.users.map((entry) => (
                      <div
                        className="admin-entity-row"
                        key={entry._id || entry.id}
                      >
                        <div>
                          <strong>{entry.name}</strong>
                          <p>{entry.email}</p>
                          <p>
                            {formatRole(entry.role)} |{" "}
                            {entry.branch || "No branch"}
                          </p>
                        </div>
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="danger-button"
                            onClick={() =>
                              handleUserDelete(entry._id || entry.id)
                            }
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
                <section className="admin-settings-hub">
                  <article className="card admin-panel-card admin-settings-hero">
                    <p className="admin-kicker">Settings Hub</p>
                    <h3>System Management Center</h3>
                    <p>
                      Manage users, branches, and operations from one place. Use
                      the shortcuts below for faster daily admin work.
                    </p>

                    <div className="admin-settings-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => setActiveAdminSection("user-management")}
                      >
                        Go to User Management
                      </button>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() =>
                          setActiveAdminSection("branch-management")
                        }
                      >
                        Go to Branch Management
                      </button>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() =>
                          setActiveAdminSection("operational-summary")
                        }
                      >
                        Open Operational Summary
                      </button>
                    </div>
                  </article>

                  <section className="admin-settings-grid">
                    <article className="card admin-settings-stat">
                      <span>Total Users</span>
                      <strong>{adminData.summary.userCount}</strong>
                      <p>Manage accounts, roles, and branch access.</p>
                    </article>

                    <article className="card admin-settings-stat">
                      <span>Total Branches</span>
                      <strong>{adminData.summary.branchCount}</strong>
                      <p>Monitor active branches and manager assignments.</p>
                    </article>

                    <article className="card admin-settings-stat">
                      <span>Total Parcels</span>
                      <strong>{adminData.summary.totalParcels}</strong>
                      <p>Track operational load across all branches.</p>
                    </article>

                    <article className="card admin-settings-stat">
                      <span>Delivered Parcels</span>
                      <strong>{adminData.summary.deliveredParcels}</strong>
                      <p>Review delivery performance and follow-ups.</p>
                    </article>
                  </section>
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
            <section className="card super-admin-hero hero-with-image">
              <div className="hero-text-content">
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
              </div>
              <div className="hero-image-container">
                <img src="/images/branch_manager_hero.png" alt="Branch Manager" />
              </div>
            </section>

            <section className="card admin-section-header">
              <p className="admin-kicker">Active Section</p>
              <h2>{activeBranchManagerSectionLabel}</h2>
            </section>

            <section className="admin-workspace">
              {branchManagerError ? (
                <p className="error">{branchManagerError}</p>
              ) : null}

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

                  <section className="card branch-control-panel">
                    <div className="branch-control-head">
                      <p className="admin-kicker">Branch Control</p>
                      <h3>Daily Operations Snapshot</h3>
                    </div>

                    <div className="branch-control-grid">
                      <article className="branch-control-card">
                        <span>Pending Assignments</span>
                        <strong>
                          {branchManagerData.pendingAssignments.length}
                        </strong>
                        <p>
                          Assign riders quickly for unassigned branch parcels.
                        </p>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() =>
                            setActiveBranchManagerSection("assignment-approval")
                          }
                        >
                          Open Assignment Approval
                        </button>
                      </article>

                      <article className="branch-control-card">
                        <span>Active Riders</span>
                        <strong>{branchManagerData.summary.riderCount}</strong>
                        <p>Manage rider availability and team operations.</p>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() =>
                            setActiveBranchManagerSection("rider-management")
                          }
                        >
                          Open Rider Management
                        </button>
                      </article>

                      <article className="branch-control-card">
                        <span>Pending Deliveries</span>
                        <strong>
                          {branchManagerData.summary.pendingParcels}
                        </strong>
                        <p>Monitor parcels still in delivery lifecycle.</p>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() =>
                            setActiveBranchManagerSection("reports")
                          }
                        >
                          Open Branch Reports
                        </button>
                      </article>
                    </div>
                  </section>
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
                            Status: {parcel.currentStatus} | Rider:{" "}
                            {parcel.assignedRider?.name || "Not assigned"}
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

                  <form
                    className="admin-form-grid"
                    onSubmit={handleRiderSubmit}
                  >
                    <label>Name</label>
                    <input
                      value={riderForm.name}
                      onChange={(event) =>
                        setRiderForm((prev) => ({
                          ...prev,
                          name: event.target.value,
                        }))
                      }
                      required
                    />

                    <label>Email</label>
                    <input
                      type="email"
                      value={riderForm.email}
                      onChange={(event) =>
                        setRiderForm((prev) => ({
                          ...prev,
                          email: event.target.value,
                        }))
                      }
                      required
                    />

                    <label>Password</label>
                    <input
                      type="password"
                      value={riderForm.password}
                      onChange={(event) =>
                        setRiderForm((prev) => ({
                          ...prev,
                          password: event.target.value,
                        }))
                      }
                      minLength={6}
                      required
                    />

                    {riderMessage ? (
                      <p className="success">{riderMessage}</p>
                    ) : null}
                    <button type="submit">Create Rider</button>
                  </form>

                  <div className="admin-entity-list">
                    {branchManagerData.riders.map((rider) => (
                      <div
                        className="admin-entity-row"
                        key={rider._id || rider.id}
                      >
                        <div>
                          <strong>{rider.name}</strong>
                          <p>{rider.email}</p>
                          <p>{rider.branch || "No branch"}</p>
                        </div>
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="danger-button"
                            onClick={() =>
                              handleRiderDelete(rider._id || rider.id)
                            }
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
                              <option
                                key={rider._id || rider.id}
                                value={rider._id || rider.id}
                              >
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
                      <strong>
                        {branchManagerData.summary.deliveredParcels}
                      </strong>
                    </div>
                    <div className="report-stat-box">
                      <span>Pending</span>
                      <strong>
                        {branchManagerData.summary.pendingParcels}
                      </strong>
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

      {isDispatcher ? (
        <section className="admin-console">
          <aside className="card admin-sidebar">
            <div className="admin-sidebar-header">
              <p className="admin-kicker">Navigation</p>
              <h3>Dispatcher</h3>
            </div>

            <div className="admin-sidebar-nav">
              {dispatcherSections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  className={`admin-nav-button ${
                    activeDispatcherSection === section.id ? "active" : ""
                  }`}
                  onClick={() => setActiveDispatcherSection(section.id)}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </aside>

          <div className="admin-content">
            <section className="card super-admin-hero hero-with-image">
              <div className="hero-text-content">
                <p className="admin-kicker">Parcel Operations Control</p>
                <h2>Dispatcher</h2>
                <p>Parcel operations handling role for dispatch execution.</p>
                <div className="admin-chip-row">
                  {dispatcherResponsibilities.map((item) => (
                    <span key={item} className="admin-chip">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className="hero-image-container">
                <img src="/images/dispatcher_hero.png" alt="Dispatcher" />
              </div>
            </section>

            <section className="card admin-section-header">
              <p className="admin-kicker">Active Section</p>
              <h2>{activeDispatcherSectionLabel}</h2>
            </section>

            <section className="admin-workspace">
              {dispatcherError ? (
                <p className="error">{dispatcherError}</p>
              ) : null}

              {activeDispatcherSection === "dashboard" ? (
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

                  <section className="card dispatcher-control-panel">
                    <div className="dispatcher-control-head">
                      <p className="admin-kicker">Dispatch Control</p>
                      <h3>Today's Delivery Operations</h3>
                    </div>

                    <div className="dispatcher-control-grid">
                      <article className="dispatcher-control-card">
                        <span>Unassigned Parcels</span>
                        <strong>
                          {
                            dispatcherData.parcels.filter(
                              (parcel) => !parcel.assignedRider,
                            ).length
                          }
                        </strong>
                        <p>Assign riders to pending parcels quickly.</p>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() =>
                            setActiveDispatcherSection("assignment-support")
                          }
                        >
                          Open Assignment Support
                        </button>
                      </article>

                      <article className="dispatcher-control-card">
                        <span>Editable Parcels</span>
                        <strong>
                          {
                            dispatcherData.parcels.filter(
                              (parcel) => parcel.currentStatus === "created",
                            ).length
                          }
                        </strong>
                        <p>Update parcel details before pickup starts.</p>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() =>
                            setActiveDispatcherSection("parcel-operations")
                          }
                        >
                          Open Parcel Operations
                        </button>
                      </article>

                      <article className="dispatcher-control-card">
                        <span>In Progress Deliveries</span>
                        <strong>
                          {
                            dispatcherData.parcels.filter((parcel) =>
                              [
                                "picked_up",
                                "in_transit",
                                "out_for_delivery",
                              ].includes(parcel.currentStatus),
                            ).length
                          }
                        </strong>
                        <p>Monitor active deliveries across all branches.</p>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() =>
                            setActiveDispatcherSection("delivery-monitor")
                          }
                        >
                          Open Delivery Monitor
                        </button>
                      </article>
                    </div>
                  </section>
                </>
              ) : null}

              {activeDispatcherSection === "parcel-operations" ? (
                <article className="card admin-panel-card admin-form-card">
                  <div className="admin-card-header">
                    <div>
                      <p className="admin-kicker">Parcel Operations</p>
                      <h3>Create and Edit Parcels</h3>
                    </div>
                  </div>

                  <div className="quick-links">
                    <div className="actions">
                      <Link to="/parcels/new" className="button-link">
                        Create Parcel
                      </Link>
                    </div>
                  </div>

                  <div className="admin-entity-list">
                    {dispatcherLoading ? <p>Loading parcels...</p> : null}
                    {dispatcherData.parcels.map((parcel) => (
                      <div className="admin-entity-row" key={parcel._id}>
                        <div>
                          <strong>{parcel.trackingId}</strong>
                          <p>
                            {parcel.receiverName} | {parcel.receiverAddress}
                          </p>
                          <p>
                            Status: {parcel.currentStatus} | COD: Rs.{" "}
                            {parcel.codAmount}
                          </p>
                          {dispatcherEditParcelId === parcel._id ? (
                            <div className="dispatcher-edit-grid">
                              <label>Receiver Name</label>
                              <input
                                value={dispatcherEditForm.receiverName}
                                onChange={(event) =>
                                  setDispatcherEditForm((prev) => ({
                                    ...prev,
                                    receiverName: event.target.value,
                                  }))
                                }
                              />
                              <label>Receiver Phone</label>
                              <input
                                value={dispatcherEditForm.receiverPhone}
                                onChange={(event) =>
                                  setDispatcherEditForm((prev) => ({
                                    ...prev,
                                    receiverPhone: event.target.value,
                                  }))
                                }
                              />
                              <label>Receiver Address</label>
                              <input
                                value={dispatcherEditForm.receiverAddress}
                                onChange={(event) =>
                                  setDispatcherEditForm((prev) => ({
                                    ...prev,
                                    receiverAddress: event.target.value,
                                  }))
                                }
                              />
                              <label>COD Amount</label>
                              <input
                                type="number"
                                min="0"
                                value={dispatcherEditForm.codAmount}
                                onChange={(event) =>
                                  setDispatcherEditForm((prev) => ({
                                    ...prev,
                                    codAmount: Number(event.target.value),
                                  }))
                                }
                              />
                            </div>
                          ) : null}
                        </div>
                        <div className="admin-row-actions">
                          {parcel.currentStatus === "created" ? (
                            dispatcherEditParcelId === parcel._id ? (
                              <>
                                <button
                                  type="button"
                                  className="secondary-button"
                                  onClick={() =>
                                    handleDispatcherParcelEditSave(parcel._id)
                                  }
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  className="danger-button"
                                  onClick={() => setDispatcherEditParcelId("")}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                className="secondary-button"
                                onClick={() => startDispatcherEdit(parcel)}
                              >
                                Edit Before Pickup
                              </button>
                            )
                          ) : (
                            <span className="status-note">
                              Editing locked after pickup
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ) : null}

              {activeDispatcherSection === "assignment-support" ? (
                <article className="card admin-panel-card">
                  <div className="admin-card-header">
                    <div>
                      <p className="admin-kicker">Rider Assignment</p>
                      <h3>Assign Riders to Parcels</h3>
                    </div>
                  </div>

                  <div className="admin-entity-list">
                    {dispatcherData.parcels
                      .filter((parcel) => !parcel.assignedRider)
                      .map((parcel) => (
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
                              {dispatcherData.riders.map((rider) => (
                                <option key={rider._id} value={rider._id}>
                                  {rider.name} ({rider.branch || "No branch"})
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() =>
                                handleDispatcherAssignRider(parcel._id)
                              }
                            >
                              Assign Rider
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </article>
              ) : null}

              {activeDispatcherSection === "delivery-monitor" ? (
                <article className="card admin-panel-card">
                  <div className="admin-card-header">
                    <div>
                      <p className="admin-kicker">Delivery Tracking</p>
                      <h3>Monitor Parcel Status Across Branches</h3>
                    </div>
                  </div>

                  <div className="admin-entity-list">
                    {dispatcherData.parcels.map((parcel) => (
                      <div className="admin-entity-row" key={parcel._id}>
                        <div>
                          <strong>{parcel.trackingId}</strong>
                          <p>
                            {parcel.branch || "Unassigned"} |{" "}
                            {parcel.receiverName}
                          </p>
                          <p>
                            Status: {parcel.currentStatus} | Rider:{" "}
                            {parcel.assignedRider?.name || "Not assigned"}
                          </p>
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

      {isRider ? (
        <section className="admin-console">
          <aside className="card admin-sidebar">
            <div className="admin-sidebar-header">
              <p className="admin-kicker">Navigation</p>
              <h3>Delivery Rider</h3>
            </div>

            <div className="admin-sidebar-nav">
              {riderSections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  className={`admin-nav-button ${
                    activeRiderSection === section.id ? "active" : ""
                  }`}
                  onClick={() => setActiveRiderSection(section.id)}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </aside>

          <div className="admin-content">
            <section className="card super-admin-hero hero-with-image">
              <div className="hero-text-content">
                <p className="admin-kicker">Field Delivery Console</p>
                <h2>Delivery Rider</h2>
                <p>
                  You can only access parcels assigned to you and update the
                  delivery journey with proof and notes.
                </p>
                <div className="admin-chip-row">
                  {riderResponsibilities.map((item) => (
                    <span key={item} className="admin-chip">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className="hero-image-container">
                <img src="/images/rider_hero.png" alt="Delivery Rider" />
              </div>
            </section>

            <section className="card admin-section-header">
              <p className="admin-kicker">Active Section</p>
              <h2>{activeRiderSectionLabel}</h2>
            </section>

            <section className="admin-workspace">
              {riderError ? <p className="error">{riderError}</p> : null}

              {activeRiderSection === "dashboard" ? (
                <>
                  <div className="grid-3">
                    <article className="card stat">
                      <h3>Assigned Parcels</h3>
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

                  <section className="card rider-briefing">
                    <div className="rider-briefing-head">
                      <p className="admin-kicker">Rider Briefing</p>
                      <h3>Today's Operating Rules</h3>
                    </div>

                    <div className="rider-briefing-grid">
                      <article className="rider-briefing-block">
                        <h4>Do</h4>
                        <ul className="rider-rule-list">
                          {riderResponsibilities.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </article>

                      <article className="rider-briefing-block">
                        <h4>Can</h4>
                        <ul className="rider-rule-list rider-rule-list--allow">
                          {riderPermissions.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </article>

                      <article className="rider-briefing-block">
                        <h4>Cannot</h4>
                        <ul className="rider-rule-list rider-rule-list--deny">
                          {riderLimitations.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </article>
                    </div>
                  </section>
                </>
              ) : null}

              {activeRiderSection === "assigned-parcels" ? (
                <article className="card admin-panel-card">
                  <div className="admin-card-header">
                    <div>
                      <p className="admin-kicker">Assigned Parcels</p>
                      <h3>Only Your Assigned Deliveries</h3>
                    </div>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => {
                        refreshRiderData().catch((error) => {
                          setRiderError(
                            error.response?.data?.message ||
                              "Failed to refresh assigned parcels",
                          );
                        });
                        refreshMetrics().catch((error) => {
                          console.error(error);
                        });
                      }}
                    >
                      Refresh
                    </button>
                  </div>

                  <div className="admin-entity-list">
                    {riderLoading ? <p>Loading assigned parcels...</p> : null}
                    {!riderLoading && riderData.parcels.length === 0 ? (
                      <p className="status-note">
                        No assigned parcels available right now.
                      </p>
                    ) : null}
                    {riderData.parcels.map((parcel) => (
                      <div className="admin-entity-row" key={parcel._id}>
                        <div>
                          <strong>{parcel.trackingId}</strong>
                          <p>
                            {parcel.receiverName} | {parcel.receiverAddress}
                          </p>
                          <p>
                            Status: {parcel.currentStatus} | COD: Rs.{" "}
                            {parcel.codAmount}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ) : null}

              {activeRiderSection === "status-updates" ? (
                <article className="card admin-panel-card">
                  <div className="admin-card-header">
                    <div>
                      <p className="admin-kicker">Status Updates</p>
                      <h3>Update Progress and Delivery Proof</h3>
                    </div>
                  </div>

                  <div className="admin-entity-list">
                    {riderLoading ? <p>Loading assigned parcels...</p> : null}
                    {!riderLoading && riderData.parcels.length === 0 ? (
                      <p className="status-note">
                        No assigned parcels available for status updates yet.
                      </p>
                    ) : null}
                    {riderData.parcels.map((parcel) => {
                      const allowedStatuses =
                        parcelStatusTransitions[parcel.currentStatus] || [];
                      const statusOptions = riderStatusOptions.filter(
                        (option) => allowedStatuses.includes(option.value),
                      );
                      const defaultStatus = statusOptions[0]?.value || "";
                      const form = riderStatusForms[parcel._id] || {
                        status: defaultStatus,
                        note: "",
                        location: "",
                        proofImageUrl: "",
                        proofImageFile: null,
                        signatureName: "",
                      };
                      const currentStatusValue = statusOptions.some(
                        (option) => option.value === form.status,
                      )
                        ? form.status
                        : defaultStatus;

                      return (
                        <div className="admin-entity-row" key={parcel._id}>
                          <div>
                            <strong>{parcel.trackingId}</strong>
                            <p>
                              {parcel.receiverName} | {parcel.receiverAddress}
                            </p>
                            <p>Current: {parcel.currentStatus}</p>

                            <div className="dispatcher-edit-grid">
                              <label>Status</label>
                              <select
                                value={currentStatusValue}
                                onChange={(event) =>
                                  handleRiderStatusChange(
                                    parcel._id,
                                    "status",
                                    event.target.value,
                                  )
                                }
                                disabled={statusOptions.length === 0}
                              >
                                {statusOptions.length === 0 ? (
                                  <option value="">
                                    No transitions available
                                  </option>
                                ) : null}
                                {statusOptions.map((option) => (
                                  <option
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </option>
                                ))}
                              </select>

                              <label>Delivery Note</label>
                              <input
                                value={form.note}
                                onChange={(event) =>
                                  handleRiderStatusChange(
                                    parcel._id,
                                    "note",
                                    event.target.value,
                                  )
                                }
                                placeholder="Optional update note"
                              />

                              <label>Current Location</label>
                              <input
                                value={form.location}
                                onChange={(event) =>
                                  handleRiderStatusChange(
                                    parcel._id,
                                    "location",
                                    event.target.value,
                                  )
                                }
                                placeholder="Optional location"
                              />

                              <label>Delivery Proof Photo</label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(event) =>
                                  handleRiderStatusChange(
                                    parcel._id,
                                    "proofImageFile",
                                    event.target.files?.[0] || null,
                                  )
                                }
                              />
                              {form.proofImageFile ? (
                                <p className="status-note">
                                  Selected: {form.proofImageFile.name}
                                </p>
                              ) : null}
                              {form.proofImageUrl ? (
                                <p className="status-note">
                                  Uploaded proof available for this parcel.
                                </p>
                              ) : null}

                              <label>Receiver Signature Name</label>
                              <input
                                value={form.signatureName}
                                onChange={(event) =>
                                  handleRiderStatusChange(
                                    parcel._id,
                                    "signatureName",
                                    event.target.value,
                                  )
                                }
                                placeholder="Name captured on delivery"
                              />
                            </div>
                          </div>

                          <div className="admin-row-actions">
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() => handleRiderStatusSubmit(parcel)}
                              disabled={statusOptions.length === 0}
                            >
                              Update Status
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>
              ) : null}
            </section>
          </div>
        </section>
      ) : null}

      {!isSuperAdmin && !isBranchManager && !isDispatcher && !isRider ? (
        <motion.div 
          className="customer-dashboard-modern"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="customer-header-section">
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              Your Deliveries Overview
            </motion.h2>
            <p>Track and manage all your packages in one place.</p>
          </div>

          <motion.div 
            className="modern-grid-3"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.1 }
              }
            }}
          >
            <motion.article 
              className="card modern-stat-card total-card"
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(27, 95, 191, 0.15)" }}
            >
              <div className="icon-wrapper bg-blue-soft">
                <Package size={28} className="text-blue" />
              </div>
              <div>
                <h3>Total Parcels</h3>
                <p>{metrics.total}</p>
              </div>
            </motion.article>

            <motion.article 
              className="card modern-stat-card delivered-card"
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(39, 103, 73, 0.15)" }}
            >
              <div className="icon-wrapper bg-green-soft">
                <CheckCircle size={28} className="text-green" />
              </div>
              <div>
                <h3>Delivered</h3>
                <p>{metrics.delivered}</p>
              </div>
            </motion.article>

            <motion.article 
              className="card modern-stat-card pending-card"
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(197, 48, 48, 0.15)" }}
            >
              <div className="icon-wrapper bg-red-soft">
                <Clock size={28} className="text-red" />
              </div>
              <div>
                <h3>Pending</h3>
                <p>{metrics.pending}</p>
              </div>
            </motion.article>
          </motion.div>

          <motion.div 
            className="card modern-quick-links"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="quick-action-content">
              <h2>Ready to Track?</h2>
              <p>Enter your tracking ID to see real-time updates and delivery status.</p>
              <Link to="/tracking" className="modern-button-link">
                <Search size={20} />
                Track a Package
              </Link>
            </div>
            <div className="quick-action-visual">
              <MapPin size={80} className="floating-icon" strokeWidth={1} />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </section>
  );
};

export default DashboardPage;
