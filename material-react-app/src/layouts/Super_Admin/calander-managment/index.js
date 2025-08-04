import React, { useState, useEffect } from "react";
import axios from "axios";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parse, startOfWeek, getDay } from "date-fns";
import fr from "date-fns/locale/fr";
import {
  Modal, Card, Box, Button, Typography, CircularProgress, Snackbar, Alert
} from "@mui/material";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
// import Footer from "examples/Footer";

const locales = { fr };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const modalStyle = {
  position: "absolute", top: "50%", left: "50%",
  transform: "translate(-50%, -50%)", width: 500,
  bgcolor: 'background.paper', border: '2px solid #000',
  boxShadow: 24, p: 4
};

export default function CalendarManagementT() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const token = document.cookie.split("; ").find(r => r.startsWith("token="))?.split("=")[1];
  const headers = { headers: { Authorization: `Bearer ${token}` }, withCredentials: true };

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await axios.get("http://localhost:8080/conge/global/overview", headers);
        const { trips, conges } = res.data.data;

        const formattedConges = conges.map(c => ({
          ...c,
          title: `Congé (${c.typeConge})`,
          start: new Date(c.startDate),
          end: new Date(c.endDate || c.startDate),
          type: 'conge',
        }));

        const formattedTrips = trips.map(t => ({
          ...t,
          title: `Trajet : ${t.startPoint} ➜ ${t.destination}`,
          start: new Date(t.departureDate),
          end: new Date(t.departureDate),
          type: 'trip',
        }));

        setEvents([...formattedConges, ...formattedTrips]);
      } catch (err) {
        console.error(err);
        setSnackbar({ open: true, message: "Erreur de chargement", severity: "error" });
      }
    };

    fetchOverview();
  }, []);

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setModalOpen(true);
  };

  const renderEventDetails = (event) => {
    if (event.type === "conge") {
      return (
        <>
          <Typography variant="h5">Détails du Congé</Typography>
          <Typography><b>Date début :</b> {format(event.start, "dd/MM/yyyy")}</Typography>
          <Typography><b>Date fin :</b> {format(event.end, "dd/MM/yyyy")}</Typography>
          <Typography><b>Type :</b> {event.typeConge}</Typography>
          <Typography><b>Raison :</b> {event.reason || "Non spécifiée"}</Typography>
          <Typography><b>Statut :</b> {event.status}</Typography>
          {event.user && (
            <Typography><b>Employé :</b> {event.user.FirstName} {event.user.LastName}</Typography>
          )}
        </>
      );
    }

    if (event.type === "trip") {
      return (
        <>
          <Typography variant="h5">Détails du Trajet</Typography>
          <Typography><b>Départ :</b> {event.startPoint}</Typography>
          <Typography><b>Destination :</b> {event.destination}</Typography>
          <Typography><b>Date :</b> {format(event.start, "dd/MM/yyyy")}</Typography>
          <Typography><b>Heure :</b> {event.departureTime}</Typography>
          <Typography><b>Chauffeur :</b> {event.driver?.FirstName} {event.driver?.LastName}</Typography>
          <Typography><b>Camion :</b> {event.truck?.brand} ({event.truck?.registration})</Typography>
        </>
      );
    }

    return <Typography>Aucun détail disponible</Typography>;
  };

  return (
    <DashboardLayout>
      {/* <DashboardNavbar /> */}

      <Box px={2} mt={2}>
        <Typography variant="h4">Vue Globale – Congés & Trajets</Typography>
      </Box>

      <Box height="75vh" p={2}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%" }}
          onSelectEvent={handleSelectEvent}
          culture="fr"
          messages={{
            today: "Aujourd'hui", previous: "Précédent", next: "Suivant",
            month: "Mois", week: "Semaine", day: "Jour", agenda: "Agenda",
            noEventsInRange: "Aucun événement"
          }}
        />
      </Box>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Card sx={modalStyle}>
          {selectedEvent ? renderEventDetails(selectedEvent) : <CircularProgress />}
        </Card>
      </Modal>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* <Footer /> */}
    </DashboardLayout>
  );
}
