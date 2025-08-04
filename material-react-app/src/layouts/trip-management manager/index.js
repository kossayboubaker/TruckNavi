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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogActions,
} from "@mui/material";
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon } from "@mui/icons-material";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
// import Footer from "examples/Footer";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DataTable from "examples/Tables/DataTable";
import { useTranslation } from "react-i18next";
// Liste des villes tunisiennes
const tunisianCities = [
  "Tunis", "Ariana", "Ben Arous", "Manouba", "Nabeul", "Zaghouan", "Bizerte",
  "Beja", "Jendouba", "Kef", "Siliana", "Sousse", "Monastir", "Mahdia",
  "Kairouan", "Kasserine", "Sidi Bouzid", "Sfax", "Gafsa", "Tozeur", "Kebili",
  "Gabes", "Medenine", "Tataouine"
];

const TripManagerManagement = () => {
    const { t } = useTranslation();

  const [trips, setTrips] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [availableTrucks, setAvailableTrucks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTripId, setEditingTripId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const [formData, setFormData] = useState({
    truck: "",
    driver: "",
    startPoint: "",
    destination: "",
    departureDate: "",
    departureTime: "",
  });

  const [alert, setAlert] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const token = document.cookie.split("; ").find((row) => row.startsWith("token="))?.split("=")[1];

  useEffect(() => {
    fetchTrips();
    fetchOptions();
  }, []);

  useEffect(() => {
    if (alert.message) {
      const timer = setTimeout(() => setAlert({ type: "", message: "" }), 4000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const fetchTrips = async () => {
    try {
      const res = await axios.get("http://localhost:8080/trip/manager", {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      const formattedTrips = res.data.map((trip) => ({
        ...trip,
        departureDate: new Date(trip.departureDate).toISOString().split("T")[0],
      }));

      setTrips(formattedTrips);
    } catch (err) {
      console.error("Erreur lors du chargement des trajets :", err);
    }
  };

  const fetchOptions = async () => {
    try {
      const [drivers, trucks] = await Promise.all([
        axios.get("http://localhost:8080/trip/available-drivers", {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }),
        axios.get("http://localhost:8080/trip/available-trucks", {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }),
      ]);
      setAvailableDrivers(drivers.data);
      setAvailableTrucks(trucks.data);
    } catch (err) {
      console.error("Erreur chargement chauffeurs/camions :", err);
    }
  };

  const handleEdit = (trip) => {
    setFormData({
      truck: trip.truck?._id || "",
      driver: trip.driver?._id || "",
      startPoint: trip.startPoint,
      destination: trip.destination,
      departureDate: trip.departureDate,
      departureTime: trip.departureTime,
    });
    setEditingTripId(trip._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert({ type: "", message: "" });

    const today = new Date().toISOString().split("T")[0];
    if (formData.departureDate <= today) {
            setAlert({ type: "error", message: t("departureDateError") });

      setLoading(false);
      return;
    }

    const endpoint = editingTripId
      ? `http://localhost:8080/trip/${editingTripId}`
      : "http://localhost:8080/trip/request";

    const method = editingTripId ? axios.put : axios.post;

    try {
      await method(endpoint, formData, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setAlert({ type: "success", message: editingTripId ? "Trajet modifié." : "Trajet ajouté." });
      setFormData({
        truck: "",
        driver: "",
        startPoint: "",
        destination: "",
        departureDate: "",
        departureTime: "",
      });
      setEditingTripId(null);
      setShowForm(false);
      fetchTrips();
    } catch (err) {
      setAlert({
        type: "error",
        message: err.response?.data?.message || "Erreur serveur.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:8080/trip/${confirmDeleteId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setAlert({ type: "success", message: t("tripDeleted") });
      fetchTrips();
    } catch (err) {
      setAlert({ type: "error", message: t("tripDeleteFailed") });
      console.error("Erreur suppression trajet :", err);
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const columns = [
   { Header: t("start"), accessor: "startPoint" },
    { Header: t("destination"), accessor: "destination" },
    { Header: t("date"), accessor: "departureDate" },
    { Header: t("time"), accessor: "departureTime" },
    { Header: t("truck"), accessor: "truck.truckId" },
    
    {
      Header:  t("driver"),
      accessor: "driver",
      Cell: ({ value }) =>
        value ? `${value.firstName || value.FirstName} ${value.lastName || value.LastName}` : "",
    },
    {
      Header:  t("status"),
      accessor: "status",
      Cell: ({ value }) => {
        const color =
          value === "validated" ? "green" : value === "refused" ? "red" : "orange";
        return <span style={{ color }}>{value}</span>;
      },
    },
    {
      Header: t("actions"),
      accessor: "actions",
      Cell: ({ row }) => (
        <>
          <IconButton onClick={() => handleEdit(row.original)} color="primary">
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => setConfirmDeleteId(row.original._id)} color="error">
            <DeleteIcon />
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <DashboardLayout>
      {/* <DashboardNavbar /> */}
      <MDBox pt={6} pb={3}>
        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Card>
              <MDBox mx={2} mt={-3} py={3} px={2} variant="gradient" bgColor="info" borderRadius="lg">
                <MDTypography variant="h6" color="white">{t("tripManagement")}</MDTypography>
              </MDBox>

              {alert.message && (
                <MDBox px={2} pt={2}>
                  <Alert severity={alert.type}>{alert.message}</Alert>
                </MDBox>
              )}

              <MDBox display="flex" justifyContent="flex-end" m={2}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon sx={{ color: "white" }} />}
                  onClick={() => setShowForm(true)}
                >
                  <MDTypography variant="h8" color="white">{t("addTrip")}</MDTypography>
                </Button>
              </MDBox>

              <MDBox px={2}>
                <DataTable
                  table={{ columns, rows: trips }}
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

      {showForm && (
        <Card
          sx={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1300,
            width: "90%",
            maxWidth: 500,
            p: 4,
          }}
        >
          <Typography variant="h5" gutterBottom>
            {editingTripId ? t("editTrip") : t("newTrip")}
          </Typography>

          {alert.message && (
            <Alert severity={alert.type} sx={{ mb: 2 }}>
              {alert.message}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              select
              label={t("startPoint")}
              name="startPoint"
              fullWidth
              required
              value={formData.startPoint}
              onChange={(e) => setFormData({ ...formData, startPoint: e.target.value })}
              sx={{ mb: 2 }}
            >
              {tunisianCities.map((city) => (
                <MenuItem key={city} value={city}>
                  {city}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label={t("destination")}
              name="destination"
              fullWidth
              required
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              sx={{ mb: 2 }}
            >
              {tunisianCities.map((city) => (
                <MenuItem key={city} value={city}>
                  {city}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label={t("departureDate")}
              type="date"
              name="departureDate"
              fullWidth
              required
              value={formData.departureDate}
              onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
            <TextField
              label={t("departureTime")}
              type="time"
              name="departureTime"
              fullWidth
              required
              value={formData.departureTime}
              onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
            <TextField
              select
              label={t("truck")}
              name="truck"
              fullWidth
              required
              value={formData.truck}
              onChange={(e) => setFormData({ ...formData, truck: e.target.value })}
              sx={{ mb: 2 }}
            >
              {availableTrucks.map((truck) => (
                <MenuItem key={truck._id} value={truck._id}>
                  {truck.truckId}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label={t("driver")}
              name="driver"
              fullWidth
              required
              value={formData.driver}
              onChange={(e) => setFormData({ ...formData, driver: e.target.value })}
              sx={{ mb: 2 }}
            >
              {availableDrivers.map((driver) => (
                <MenuItem key={driver._id} value={driver._id}>
                  {driver.FirstName} {driver.LastName}
                </MenuItem>
              ))}
            </TextField>

            <Button type="submit" variant="contained" fullWidth disabled={loading}>
              {loading ? <CircularProgress size={20} /> : "Enregistrer"}
            </Button>
            <Button
              onClick={() => {
                setShowForm(false);
                setEditingTripId(null);
                setFormData({
                  truck: "",
                  driver: "",
                  startPoint: "",
                  destination: "",
                  departureDate: "",
                  departureTime: "",
                });
              }}
              fullWidth
              sx={{ mt: 2 }}
            >
            {t("cancel")}
            </Button>
          </form>
        </Card>
      )}

      {/* Dialog de confirmation de suppression */}
      <Dialog open={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)}>
        <DialogTitle>Voulez-vous vraiment supprimer ce trajet ?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteId(null)} color="inherit">
            {t("cancel")}
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            {t("delete")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* <Footer /> */}
    </DashboardLayout>
  );
};

export default TripManagerManagement;
