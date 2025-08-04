import React, { useState, useEffect } from "react";
import axios from "axios";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parse, startOfWeek, getDay } from "date-fns";
import fr from "date-fns/locale/fr";
import {
  Modal,
  Card,
  Box,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from "@mui/material";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

const locales = { fr };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 500,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

export default function InfosByUser() {
  const { t } = useTranslation();
  const { name } = useParams();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [filter, setFilter] = useState("all");

  const token = document.cookie.split("; ").find((r) => r.startsWith("token="))?.split("=")[1];
  const headers = { headers: { Authorization: `Bearer ${token}` }, withCredentials: true };

  useEffect(() => {
    if (!name) return;

    const fetchOverview = async () => {
      try {
        const encodedName = encodeURIComponent(name.trim());
        const url = `http://localhost:8080/conge/user/conges-infos-by-name/${encodedName}`;
        const res = await axios.get(url, headers);

        const { conges = [], trips = [] } = res.data;
        console.log("Data reçue:", res.data);

        const formattedConges = conges.map((c) => ({
          ...c,
          title: `${t("leaveTitle")} (${c.typeConge})`,
          start: new Date(c.startDate),
          end: new Date(c.endDate || c.startDate),
          type: "conge",
        }));

        const formattedTrips = trips.map((trip) => ({
          ...trip,
          title: `${t("tripTitle")}: ${trip.startPoint} ➜ ${trip.destination}`,
          start: new Date(trip.departureDate),
          end: new Date(trip.departureDate),
          type: "trip",
        }));

        setEvents([...formattedConges, ...formattedTrips]);
      } catch (err) {
        setSnackbar({ open: true, message: t("errorLoadingData"), severity: "error" });
      }
    };

    fetchOverview();
  }, [name, t]);

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setModalOpen(true);
  };

  const renderEventDetails = (event) => {
    if (event.type === "conge") {
      return (
        <>
          <Typography variant="h5">{t("leaveDetails")}</Typography>
          <Typography><b>{t("startDate")}</b> {format(event.start, "dd/MM/yyyy")}</Typography>
          <Typography><b>{t("endDate")}</b> {format(event.end, "dd/MM/yyyy")}</Typography>
          <Typography><b>{t("type")}</b> {event.typeConge}</Typography>
          <Typography><b>{t("reason")}</b> {event.reason || t("notSpecified")}</Typography>
          <Typography><b>{t("status")}</b> {event.status}</Typography>
          {event.user && (
            <Typography><b>{t("employee")}</b> {event.user.FirstName} {event.user.LastName}</Typography>
          )}
        </>
      );
    }

    if (event.type === "trip") {
      return (
        <>
          <Typography variant="h5">{t("tripDetails")}</Typography>
          <Typography><b>{t("departure")}</b> {event.startPoint}</Typography>
          <Typography><b>{t("destination")}</b> {event.destination}</Typography>
          <Typography><b>{t("date")}</b> {format(event.start, "dd/MM/yyyy")}</Typography>
          <Typography><b>{t("time")}</b> {event.departureTime}</Typography>
          <Typography><b>{t("driver")}</b> {event.driver?.FirstName} {event.driver?.LastName}</Typography>
          <Typography><b>{t("truck")}</b> {event.truck?.brand} ({event.truck?.registration})</Typography>
        </>
      );
    }

    return <Typography>{t("noDetails")}</Typography>;
  };

  const filteredEvents = events.filter((event) => {
    if (filter === "all") return true;
    return event.type === filter;
  });

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <Box px={2} mt={2}>
        <Typography variant="h4" mb={2}>{t("globalView")}</Typography>
        <FormControl sx={{ minWidth: 200, mb: 2 }}>
          <InputLabel id="filter-label">{t("filterBy")}</InputLabel>
          <Select
            labelId="filter-label"
            value={filter}
            label={t("filterBy")}
            onChange={(e) => setFilter(e.target.value)}
          >
            <MenuItem value="all">{t("all")}</MenuItem>
            <MenuItem value="conge">{t("leaves")}</MenuItem>
            <MenuItem value="trip">{t("trips")}</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box height="75vh" p={2}>
        <Calendar
          localizer={localizer}
          events={filteredEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%" }}
          onSelectEvent={handleSelectEvent}
          culture="fr"
          messages={{
            today: t("calendar.today"),
            previous: t("calendar.previous"),
            next: t("calendar.next"),
            month: t("calendar.month"),
            week: t("calendar.week"),
            day: t("calendar.day"),
            agenda: t("calendar.agenda"),
            noEventsInRange: t("calendar.noEventsInRange"),
            showMore: (total) => `+${total} ${t("calendar.more")}`,
          }}
        />
      </Box>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Card sx={modalStyle}>{selectedEvent ? renderEventDetails(selectedEvent) : <CircularProgress />}</Card>
      </Modal>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Footer />
    </DashboardLayout>
  );
}
