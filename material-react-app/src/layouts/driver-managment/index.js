import { useEffect, useState } from "react";
import axios from "axios";
import {
  Grid,
  Card,
  IconButton,
  Button,
  TextField,
  Typography,
  Alert,
  Avatar,
  Tooltip,
  Box,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

// Material Dashboard components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
// import Footer from "examples/Footer";
import DataTable from "examples/Tables/DataTable";

// Icons
import DeleteIcon from "@mui/icons-material/Delete";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";
import AddIcon from "@mui/icons-material/Add";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

import { useTranslation } from "react-i18next";

const DriverManagement = () => {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ email_user: "" });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchDrivers();
  }, []);

  useEffect(() => {
    if (alert.message) {
      const timer = setTimeout(() => setAlert({ type: "", message: "" }), 4000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const fetchDrivers = async () => {
    try {
      const token = document.cookie.split("; ").find((row) => row.startsWith("token="))?.split("=")[1];
      const response = await axios.get("http://localhost:8080/user/manager/drivers", {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      const formatted = response.data.map((driver) => ({
        ...driver,
        image: driver.image ? `http://localhost:8080/uploads/${driver.image}` : null,
        created_at: new Date(driver.created_at).toLocaleDateString(),
      }));

      setRows(formatted);
    } catch (err) {
      console.error("Error fetching drivers:", err);
    }
  };

  const handleToggle = async (id) => {
    try {
      await axios.get(`http://localhost:8080/user/toggle-activation/${id}`, {
        withCredentials: true,
      });
      fetchDrivers();
    } catch (error) {
      console.error("Erreur lors du changement de statut :", error);
    }
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await axios.delete(`http://localhost:8080/user/user/${confirmDeleteId}`);
      setAlert({ type: "success", message: t("driverDeleted") });
      fetchDrivers();
    } catch (err) {
      console.error("Error deleting driver:", err);
      setAlert({ type: "error", message: t("deleteFailed") });
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const handleDelete = (id) => {
    setConfirmDeleteId(id);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert({ type: "", message: "" });

    try {
      const token = document.cookie.split("; ").find((row) => row.startsWith("token="))?.split("=")[1];

      const res = await axios.post(`http://localhost:8080/user/manager/create-driver`, formData, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      setAlert({ type: "success", message: res.data.message });
      setFormData({ email_user: "" });
      setShowForm(false);
      fetchDrivers();
    } catch (err) {
      setAlert({
        type: "error",
        message: err.response?.data?.message || "An error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      Header: "Image",
      accessor: "image",
      Cell: ({ value }) => (
        <Avatar
          src={value ? value : null}
          alt="user"
          sx={{ width: 50, height: 50 }}
        />
      ),
    },
    { Header: t("firstName"), accessor: "FirstName" },
    { Header: t("lastName"), accessor: "LastName" },
    { Header: t("email"), accessor: "email_user" },
    { Header: t("country"), accessor: "country" },
    { Header: t("phone"), accessor: "num_user" },
    { Header: t("status"), accessor: "status" },
    {
      Header: t("active"),
      accessor: "isActive",
      Cell: ({ value }) => (value ? t("yes") : t("no")),
    },
    { Header: t("createdAt"), accessor: "created_at" },
    {
      Header: t("actions"),
      accessor: "actions",
      Cell: ({ row }) => {
        const driver = row.original;
        return (
          <>
            <Tooltip title={t("toggleTooltip")}>
              <IconButton
                color="primary"
                onClick={() => handleToggle(driver._id)}
              >
                {driver.isActive ? <ToggleOffIcon /> : <ToggleOnIcon />}
              </IconButton>
            </Tooltip>

            <Tooltip title={t("deleteTooltip")}>
              <IconButton color="error" onClick={() => handleDelete(driver._id)}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title={t("infoTooltip")}>
              <IconButton
                color="secondary"
                onClick={() =>
                  navigate(
                    `/Manager/InfosByUser/${encodeURIComponent(`${driver.FirstName} ${driver.LastName}`)}`
                  )
                }
              >
                <CalendarMonthIcon />
              </IconButton>
            </Tooltip>
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
                  {t("driverList")}
                </MDTypography>
              </MDBox>

              {alert.message && (
                <MDBox px={2} pt={2}>
                  <Alert severity={alert.type}>{alert.message}</Alert>
                </MDBox>
              )}

              <MDBox pt={3} px={2}>
                <MDBox display="flex" justifyContent="flex-end" mb={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => setShowForm(true)}
                  >
                    <MDTypography variant="h8" color="white">
                      {t("addDriver")}
                    </MDTypography>
                  </Button>
                </MDBox>

                <DataTable
                  table={{ columns, rows }}
                  isSorted={false}
                  entriesPerPage={false}
                  showTotalEntries={false}
                  noEndBorder
                />
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>

      {/* <Footer /> */}

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
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: 1099,
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
              <Button
                variant="outlined"
                sx={{ color: "#1976d2", borderColor: "#1976d2" }}
                onClick={() => setConfirmDeleteId(null)}
              >
                {t("cancel")}
              </Button>
              <Button variant="contained" color="error" onClick={confirmDelete}>
                {t("delete")}
              </Button>
            </Box>
          </Card>
        </>
      )}

      {/* Form modal */}
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
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: 999,
            }}
          />
          <Card
            sx={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 1000,
              width: "90%",
              maxWidth: 500,
              p: 4,
            }}
          >
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              {t("addNewDriver")}
            </Typography>

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label={t("driverEmail")}
                name="email_user"
                value={formData.email_user}
                onChange={handleChange}
                type="email"
                required
                sx={{ mb: 3 }}
              />
              <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
                <Button
                  variant="outlined"
                  onClick={() => setShowForm(false)}
                  sx={{ color: "#1976d2", borderColor: "#1976d2" }}
                >
                  {t("cancel")}
                </Button>

                <Button type="submit" variant="contained" sx={{ color: "#fff" }}>
                  {loading ? t("loading") : t("create")}
                </Button>
              </Box>
            </form>
          </Card>
        </>
      )}
    </DashboardLayout>
  );
};

export default DriverManagement;
