import React, { useState, useEffect } from "react";
import axios from "axios";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parse, startOfWeek, getDay } from "date-fns";
import fr from "date-fns/locale/fr";
import {
  Modal, Card, Box, Button, Typography, CircularProgress,
  TextField, MenuItem, Snackbar, Alert
} from "@mui/material";
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon } from "@mui/icons-material";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

const locales = { fr };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });
const modalStyle = {
  position: "absolute", top: "50%", left: "50%",
  transform: "translate(-50%, -50%)", width: 500,
  bgcolor: 'background.paper', border: '2px solid #000',
  boxShadow: 24, p: 4
};

// Liste des villes tunisiennes
const tunisianCities = [
  "Tunis", "Ariana", "Ben Arous", "Manouba", "Nabeul", "Zaghouan", "Bizerte",
  "Beja", "Jendouba", "Kef", "Siliana", "Sousse", "Monastir", "Mahdia",
  "Kairouan", "Kasserine", "Sidi Bouzid", "Sfax", "Gafsa", "Tozeur", "Kebili",
  "Gabes", "Medenine", "Tataouine"
];

export default function CalanderManagement() {
  const [events, setEvents] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [newTrip, setNewTrip] = useState({
    startPoint: "", destination: "", departureDate: "", departureTime: "", driver: "", truck: ""
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const token = document.cookie.split("; ").find((r) => r.startsWith("token="))?.split("=")[1];
  const headers = { headers: { Authorization: `Bearer ${token}` }, withCredentials: true };

  async function fetchData() {
    try {
      const [tRes, dRes, trRes] = await Promise.all([
        axios.get("http://localhost:8080/trip/", headers),
        axios.get("http://localhost:8080/trip/available-drivers/", headers),
        axios.get("http://localhost:8080/trip/available-trucks/", headers),
      ]);

      setDrivers(dRes.data);
      setTrucks(trRes.data);

      setEvents(tRes.data.map(tr => {
        const dateOnly = tr.departureDate.split("T")[0];
        const startDateTime = new Date(`${dateOnly}T${tr.departureTime}:00`);
        return {
          ...tr,
          title: `${tr.startPoint} → ${tr.destination}`,
          start: startDateTime,
          end: startDateTime,
        };
      }));
    } catch (e) {
      console.error(e);
      setSnackbar({ open: true, message: "Erreur lors du chargement", severity: "error" });
    }
  }

  useEffect(() => { fetchData(); }, []);

  function handleSelect(event) {
    setSelected(event);
    setModalOpen(true);
  }

  async function handleDelete() {
    if (!window.confirm("Confirmer la suppression ?")) return;
    try {
      await axios.delete(`http://localhost:8080/trip/${selected._id}`, headers);
      setModalOpen(false);
      fetchData();
      setSnackbar({ open: true, message: "Trajet supprimé", severity: "info" });
    } catch (e) {
      console.error(e);
      setSnackbar({ open: true, message: "Échec suppression", severity: "error" });
    }
  }

  function handleEdit() {
    setFormOpen(true);
    setSelected(null);
    setNewTrip({
      _id: selected._id,
      startPoint: selected.startPoint,
      destination: selected.destination,
      departureDate: format(selected.start, "yyyy-MM-dd"),
      departureTime: format(selected.start, "HH:mm"),
      driver: selected.driver._id,
      truck: selected.truck._id
    });
    setModalOpen(false);
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    try {
      const url = newTrip._id
        ? `http://localhost:8080/trip/${newTrip._id}`
        : "http://localhost:8080/trip/";
      const method = newTrip._id ? axios.put : axios.post;
      await method(url, newTrip, headers);
      setFormOpen(false);
      fetchData();
      setSnackbar({ open: true, message: `Trajet ${newTrip._id ? "édité" : "réservé"}`, severity: "success" });
    } catch (e) {
      console.error(e);
      setSnackbar({ open: true, message: "Erreur lors de l'enregistrement", severity: "error" });
    }
  }

  function handleChange(e) {
    setNewTrip(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <Box display="flex" justifyContent="space-between" alignItems="center" px={2} mt={2}>
        <Typography variant="h4">Calendrier des trajets</Typography>
        <Button variant="contained" color="success" startIcon={<AddIcon />} onClick={() => {
          setFormOpen(true);
          setNewTrip({ startPoint: "", destination: "", departureDate: "", departureTime: "", driver: "", truck: "" });
        }}>
          Réserver un trajet
        </Button>
      </Box>

      <Box height="75vh" p={2}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%" }}
          onSelectEvent={handleSelect}
          culture="fr"
          messages={{ today: "Aujourd'hui", previous: "Précédent", next: "Suivant", month: "Mois", week: "Semaine", day: "Jour" }}
        />
      </Box>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Card sx={modalStyle}>
          {selected ? (
            <>
              <Typography variant="h5" mb={2}>Trajet du {format(selected.start, "dd/MM/yyyy")} à {format(selected.start, "HH:mm")}</Typography>
              <Typography><b>Départ :</b> {selected.startPoint}</Typography>
              <Typography><b>Destination :</b> {selected.destination}</Typography>
              <Typography><b>Chauffeur :</b> {selected.driver?.FirstName} {selected.driver?.LastName}</Typography>
              <Typography><b>Camion :</b> {selected.truck?.registration}</Typography>
              <Box display="flex" justifyContent="flex-end" mt={3}>
                <Button onClick={handleDelete} color="error" startIcon={<DeleteIcon />}>Supprimer</Button>
                <Button onClick={handleEdit} color="primary" startIcon={<EditIcon />}>Modifier</Button>
              </Box>
            </>
          ) : <CircularProgress />}
        </Card>
      </Modal>

      <Modal open={formOpen} onClose={() => setFormOpen(false)}>
        <Card component="form" sx={modalStyle} onSubmit={handleFormSubmit}>
          <Typography variant="h5" mb={2}>{newTrip._id ? "Modifier Trajet" : "Réserver un trajet"}</Typography>

          {/* Liste déroulante pour le point de départ */}
          <TextField select label="Départ" name="startPoint" value={newTrip.startPoint} onChange={handleChange} fullWidth margin="normal" required>
            {tunisianCities.map((city, i) => <MenuItem key={i} value={city}>{city}</MenuItem>)}
          </TextField>

          {/* Liste déroulante pour la destination */}
          <TextField select label="Destination" name="destination" value={newTrip.destination} onChange={handleChange} fullWidth margin="normal" required>
            {tunisianCities.map((city, i) => <MenuItem key={i} value={city}>{city}</MenuItem>)}
          </TextField>

          <TextField label="Date" type="date" name="departureDate" value={newTrip.departureDate} onChange={handleChange} fullWidth margin="normal" InputLabelProps={{ shrink: true }} required />
          <TextField label="Heure" type="time" name="departureTime" value={newTrip.departureTime} onChange={handleChange} fullWidth margin="normal" InputLabelProps={{ shrink: true }} required />

          <TextField select label="Chauffeur" name="driver" value={newTrip.driver} onChange={handleChange} fullWidth margin="normal" required>
            {drivers.map(d => <MenuItem key={d._id} value={d._id}>{d.FirstName} {d.LastName}</MenuItem>)}
          </TextField>

          <TextField select label="Camion" name="truck" value={newTrip.truck} onChange={handleChange} fullWidth margin="normal" required>
            {trucks.map(t => <MenuItem key={t._id} value={t._id}>{t.registration}</MenuItem>)}
          </TextField>

          <Box display="flex" justifyContent="flex-end" mt={2}>
            <Button type="submit" variant="contained" color="primary">{newTrip._id ? "Modifier" : "Enregistrer"}</Button>
          </Box>
        </Card>
      </Modal>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Footer />
    </DashboardLayout>
  );
}
