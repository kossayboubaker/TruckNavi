import { useEffect, useState } from "react";
import axios from "axios";
import {
  Grid,
  Card,
  IconButton,
  Button,
  TextField,
  MenuItem,
  Typography,
  Alert,
  Avatar,
  InputAdornment,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  Tooltip,
  Box,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
// import Footer from "examples/Footer";
import DataTable from "examples/Tables/DataTable";

import DeleteIcon from "@mui/icons-material/Delete";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";

import { useTranslation } from "react-i18next";

const UserManagement = () => {
  const { t } = useTranslation();

  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "",
    country: "",
    isActive: "",
  });
  const [sortBy, setSortBy] = useState("created_at");
  const [order, setOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ email_user: "", role: "manager" });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Assign dialog states
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [managers, setManagers] = useState([]);
  const [assignForm, setAssignForm] = useState({ managerId: "", driverId: "" });

  // Chauffeurs liés au manager sélectionné (sans pagination ni recherche séparée)
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, [filters, sortBy, order, currentPage]);

  useEffect(() => {
    if (alert.message) {
      const timer = setTimeout(() => setAlert({ type: "", message: "" }), 4000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // Charger tous les utilisateurs (managers + drivers + autres)
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      const params = { ...filters, sortBy, order, page: currentPage };
      const response = await axios.get("http://localhost:8080/user/search", {
        headers: { Authorization: `Bearer ${token}` },
        params,
        withCredentials: true,
      });

      const formattedRows = response.data.results.map((user) => ({
        _id: user._id,
        company_name: user.company_name,
        email: user.email_user,
        role: user.role,
        num: user.num_user || "-",
        country: user.country || "-",
        isActive: user.isActive === "Active",
        created_at: new Date(user.created_at).toLocaleDateString(),
        image:
          user.image && user.image !== "undefined"
            ? `http://localhost:8080/uploads/${user.image}`
            : null,
        firstName: user.FirstName,
        lastName: user.LastName,
        post: user.Post || "-",
        managerName: user.createdByName || "-",
      }));

      setRows(formattedRows);
      setTotalPages(response.data.totalPages);

      // Met à jour la liste des managers pour assign dialog
      setManagers(response.data.results.filter((u) => u.role === "manager"));
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  // Charger les chauffeurs liés au manager sélectionné dans le dialog (sans pagination ni recherche)
  useEffect(() => {
    if (assignDialogOpen && assignForm.managerId) {
      fetchDrivers();
    }
  }, [assignDialogOpen, assignForm.managerId]);

  const fetchDrivers = async () => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      const response = await axios.get("http://localhost:8080/user/drivers", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          managerId: assignForm.managerId,
        },
        withCredentials: true,
      });

      setDrivers(response.data.drivers || []);
    } catch (error) {
      console.error("Erreur lors du chargement des chauffeurs :", error);
    }
  };

  // Ouvre le modal d'assignation, reset le driverId
  const openAssignDialog = (managerId) => {
    setAssignForm({ managerId, driverId: "" });
    setAssignDialogOpen(true);
  };

  const handleToggle = async (id) => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      await axios.get(`http://localhost:8080/user/toggle-activation/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      fetchUsers();
    } catch (error) {
      console.error("Erreur lors du changement de statut :", error);
    }
  };

  const handleDelete = async () => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      await axios.delete(`http://localhost:8080/user/user/${confirmDeleteId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setAlert({ type: "success", message: "User deleted successfully." });
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      setAlert({ type: "error", message: "Failed to delete user." });
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert({ type: "", message: "" });

    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      const response = await axios.post(
        `http://localhost:8080/user/create-user`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      setAlert({ type: "success", message: response.data.message });
      setFormData({ email_user: "", role: "manager" });
      fetchUsers();
      setTimeout(() => setShowForm(false), 300);
    } catch (error) {
      console.error(error);
      setAlert({
        type: "error",
        message: error.response?.data?.message || "An error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!assignForm.managerId || !assignForm.driverId) {
      setAlert({ type: "error", message: "Veuillez sélectionner un manager et un chauffeur." });
      return;
    }
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      const response = await axios.put(
        `http://localhost:8080/user/assign-driver/${assignForm.managerId}`,
        { driverId: assignForm.driverId },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      setAlert({ type: "success", message: "Driver assigned successfully" });
      fetchUsers();
      setAssignDialogOpen(false);
      setAssignForm({ managerId: "", driverId: "" });
    } catch (error) {
      console.error("Assignment error:", error);
      setAlert({
        type: "error",
        message: error.response?.data?.message || "Erreur lors de l'affectation",
      });
    }
  };

  const filteredRows = rows.filter((row) =>
    Object.values(row).some(
      (value) =>
        value &&
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const columns = [
    {
      Header: "Image",
      accessor: "image",
      Cell: ({ value }) => <Avatar src={value || null} alt="user" sx={{ width: 50, height: 50 }} />,
    },
    { Header: t("firstName"), accessor: "firstName" },
    { Header: t("lastName"), accessor: "lastName" },
    { Header: t("email"), accessor: "email" },
    { Header: t("role"), accessor: "role" },
    { Header: t("phone"), accessor: "num" },
    { Header: t("country"), accessor: "country" },
    { Header: t("post"), accessor: "post" },
    { Header: t("companyName"), accessor: "company_name" },
    { Header: t("status"), accessor: "isActive", Cell: ({ value }) => (value ? t("active") : t("inactive")) },
    { Header: t("createdAt"), accessor: "created_at" },
    {
      Header: t("actions"),
      accessor: "actions",
      Cell: ({ row }) => {
        const user = row.original;
        const isSuperAdmin = user.role === "super_admin";

        return (
          <>
            <Tooltip title={isSuperAdmin ? t("tooltipDisabled") : ""}>
              <span>
                <IconButton
                  color="primary"
                  onClick={() => handleToggle(user._id)}
                  disabled={isSuperAdmin}
                >
                  {user.isActive ? <ToggleOffIcon /> : <ToggleOnIcon />}
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title={isSuperAdmin ? t("tooltipDisabled") : ""}>
              <span>
                <IconButton
                  color="error"
                  onClick={() => setConfirmDeleteId(user._id)}
                  disabled={isSuperAdmin}
                >
                  <DeleteIcon />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title={t("viewUserInfo")}>
              <span>
                <IconButton
                  color="secondary"
                  onClick={() => {
                   const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
                    if (fullName) {
                      navigate(`/SuperAdmin/InfosByUser/${encodeURIComponent(fullName)}`);
                    } else {
                      // Par exemple, afficher un message d’erreur ou ne rien faire
                      console.warn("Nom complet vide, navigation annulée");
                    }}}
                  disabled={isSuperAdmin}
                >
                  <CalendarMonthIcon />
                </IconButton>
              </span>
            </Tooltip>

            {user.role === "manager" && (
              <Tooltip title={t("assignDriver")}>
                <span>
                  <IconButton
                    color="success"
                    onClick={() => openAssignDialog(user._id)}
                  >
                    <AssignmentIndIcon />
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </>
        );
      },
    },
  ];

  return (
    <DashboardLayout>
      {/* <DashboardNavbar /> */}
      <MDBox pt={6} pb={3}>
        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Card>
              <MDBox
                mx={2}
                mt={-3}
                py={3}
                px={2}
                variant="gradient"
                bgColor="info"
                borderRadius="lg"
                coloredShadow="info"
              >
                <MDTypography variant="h6" color="white">
                  {t("usersTable")}
                </MDTypography>
              </MDBox>

              {alert.message && (
                <MDBox px={2} pt={2}>
                  <Alert severity={alert.type}>{alert.message}</Alert>
                </MDBox>
              )}

              <MDBox pt={3} px={2} display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <TextField
                  variant="outlined"
                  placeholder={t("search")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ width: "60%" }}
                />

                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon sx={{ color: "white" }} />}
                  onClick={() => setShowForm(true)}
                >
                  <MDTypography variant="h8" color="white">
                    {t("createUser")}
                  </MDTypography>
                </Button>
              </MDBox>

              <DataTable
                table={{ columns, rows: filteredRows }}
                isSorted={false}
                entriesPerPage={false}
                showTotalEntries={false}
                noEndBorder
              />

              <MDBox mt={3} display="flex" justifyContent="center" flexWrap="wrap" gap={1}>
                {Array.from({ length: totalPages }, (_, i) => (
                  <Button
                    key={i}
                    variant={currentPage === i + 1 ? "contained" : "outlined"}
                    color="primary"
                    onClick={() => setCurrentPage(i + 1)}
                    sx={{
                      minWidth: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      fontWeight: "bold",
                      fontSize: "12px",
                      padding: 0,
                      color: currentPage === i + 1 ? "#fff" : "primary.main",
                    }}
                  >
                    {i + 1}
                  </Button>
                ))}
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      {/* <Footer /> */}

      {/* Create user modal */}
      {showForm && (
        <>
          <div
            onClick={() => setShowForm(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(0,0,0,0.3)",
              zIndex: 1000,
            }}
          />
          <Card
            sx={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 1100,
              padding: 4,
              width: "350px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <Typography  variant="h6" gutterBottom>
              {t("createUser")}
            </Typography>

            {alert.message && (
              <Alert severity={alert.type} sx={{ mb: 2 }}>
                {alert.message}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label={t("email")}
                name="email_user"
                value={formData.email_user}
                onChange={handleChange}
                margin="normal"
                required
                type="email"
              />
              <TextField
                fullWidth
                select
                label={t("role")}
                name="role"
                value={formData.role}
                onChange={handleChange}
                margin="normal"
                required
              >
                <MenuItem value="manager">{t("manager")}</MenuItem>
                <MenuItem value="driver">{t("driver")}</MenuItem>
              </TextField>

              <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
              <Button
                  variant="outlined"
                  onClick={() => setShowForm(false)}
                  sx={{ color: "#1976d2", borderColor: "#1976d2" }} // bleu primaire
                >
                  {t("cancel")}
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{ color: "#fff" }} // texte blanc
                >
                  {loading ? t("loading") : t("create")}
                </Button>

              </Box>
            </form>
          </Card>
        </>
      )}

      {/* Confirm delete dialog */}
      {confirmDeleteId && (
        <>
          <div
            onClick={() => setConfirmDeleteId(null)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(0,0,0,0.3)",
              zIndex: 1000,
            }}
          />
          <Card
            sx={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 1100,
              padding: 4,
              width: "320px",
            }}
          >
            <Typography variant="h6" gutterBottom>
              {t("confirmDelete")}
            </Typography>
            {t("confirmDeleteText")}

            <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>

              <Button   variant="outlined"
                  sx={{ color: "#1976d2", borderColor: "#1976d2" }}  onClick={() => setConfirmDeleteId(null)}>
                {t("cancel")}
              </Button>
              <Button type="submit" variant="contained" color="error"   onClick={handleDelete}>
                {t("delete")}
              </Button>
            </Box>
          </Card>
        </>
      )}

      {/* Assign Driver to Manager Dialog */}
      <Dialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{t("assignDialogTitle")}</DialogTitle>
        <DialogContent>
          {/* Manager - readonly */}
          <TextField
            fullWidth
            select
            label={t("manager")}
            value={assignForm.managerId}
            disabled
            sx={{ mb: 2 }}
          >
            {managers
              .filter((m) => m._id === assignForm.managerId)
              .map((m) => (
                <MenuItem key={m._id} value={m._id}>
                  {m.FirstName} {m.LastName}
                </MenuItem>
              ))}
          </TextField>

          {/* Chauffeur sans recherche ni pagination */}
          <TextField
            fullWidth
            select
            label={t("selectDriver")}
            value={assignForm.driverId}
            onChange={(e) =>
              setAssignForm({ ...assignForm, driverId: e.target.value })
            }
          >
            <MenuItem value="">{t("selectPlaceholder")}</MenuItem>
            {drivers.map((d) => (
              <MenuItem key={d._id} value={d._id}>
                {d.FirstName} {d.LastName}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>{t("cancel")}</Button>
          <Button variant="contained" onClick={handleAssign} color="primary">
            {t("assign")}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
};

export default UserManagement;
