// UnifiedCalendarDriver.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parse, startOfWeek, getDay } from "date-fns";
import fr from "date-fns/locale/fr";
import {
  Modal, Card, Box, Button, Typography, CircularProgress,
  TextField, MenuItem, Snackbar, Alert, Select, FormControl, InputLabel
} from "@mui/material";
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon } from "@mui/icons-material";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
// import Footer from "examples/Footer";
import { useTranslation } from "react-i18next";

const locales = { fr };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });
const modalStyle = {
  position: "absolute",
  top: "50%", left: "50%",
  transform: "translate(-50%, -50%)",
  width: 500,
  maxHeight: '90vh',       // Limite de hauteur
  overflowY: 'auto',       // Scroll vertical
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4
};


export default function CalendarDriver() {
  const { t } = useTranslation();

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [newConge, setNewConge] = useState({ startDate: "", endDate: "", typeConge: "", reason: "" });
  const [file, setFile] = useState(null);

  const token = document.cookie.split("; ").find(r => r.startsWith("token="))?.split("=")[1];
  const headers = { headers: { Authorization: `Bearer ${token}` }, withCredentials: true };
const [filePreview, setFilePreview] = useState(null);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      const [tripsRes, congesRes] = await Promise.all([
        axios.get("http://localhost:8080/trip/driver/trips", headers),
        axios.get("http://localhost:8080/conge/my", headers)
      ]);

      const tripEvents = tripsRes.data.map(tr => {
        const dateOnly = tr.departureDate.split("T")[0];
        const startDateTime = new Date(`${dateOnly}T${tr.departureTime}:00`);
        return {
          ...tr,
          title: `${t("calendar2.trip")}: ${tr.startPoint} → ${tr.destination}`,
          start: startDateTime,
          end: startDateTime,
          type: "trip"
        };
      });

      const congeEvents = congesRes.data.map(c => {
        const start = new Date(c.startDate);
        const end = c.endDate ? new Date(c.endDate) : new Date(start);
        return {
          ...c,
          title: `${t("calendar2.leave")} (${t(`form2.types.${c.typeConge}`)})`,
          start,
          end,
          type: "conge"
        };
      });

      setEvents([...tripEvents, ...congeEvents]);
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: t("snackbar.loadError"), severity: "error" });
    }
  }

  function handleSelectEvent(event) {
    setSelectedEvent(event);
    setModalOpen(true);
  }

  const filteredEvents = events.filter(event => filter === "all" || event.type === filter);

  function handleChange(e) {
    setNewConge(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleFileChange(e) {
    const selectedFile = e.target.files[0];
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (selectedFile && !allowedTypes.includes(selectedFile.type)) {
      setSnackbar({ open: true, message: t("form2.fileTypeError"), severity: "warning" });
      setFile(null);
    } else {
      setFile(selectedFile);
          setFilePreview(URL.createObjectURL(selectedFile)); // ➕ Ceci génère un aperçu

    }
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("startDate", newConge.startDate);
      if (newConge.endDate) formData.append("endDate", newConge.endDate);
      formData.append("typeConge", newConge.typeConge);
      if (newConge.reason) formData.append("reason", newConge.reason);
      if (file) formData.append("justificatif", file);

      const url = newConge._id
        ? `http://localhost:8080/conge/edit/${newConge._id}`
        : "http://localhost:8080/conge/add";
      const method = newConge._id ? axios.put : axios.post;
      await method(url, formData, { ...headers, headers: { ...headers.headers, 'Content-Type': 'multipart/form-data' } });

      setFormOpen(false);
      setFile(null);
      fetchData();
      setSnackbar({ open: true, message: t("snackbar.saved"), severity: "success" });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: t("snackbar.saveError"), severity: "error" });
    }
  }

  async function handleDeleteConge() {
    if (!window.confirm(t("modal.confirmDelete"))) return;
    try {
      await axios.delete(`http://localhost:8080/conge/delete/${selectedEvent._id || selectedEvent.id}`, headers);
      setModalOpen(false);
      fetchData();
      setSnackbar({ open: true, message: t("snackbar.deleted"), severity: "info" });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: t("snackbar.deleteError"), severity: "error" });
    }
  }

  function handleEditConge() {
    setFormOpen(true);
    setNewConge({
      _id: selectedEvent._id || selectedEvent.id,
      startDate: format(selectedEvent.start, "yyyy-MM-dd"),
      endDate: format(selectedEvent.end, "yyyy-MM-dd"),
      typeConge: selectedEvent.typeConge,
      reason: selectedEvent.reason
    });
    setModalOpen(false);
  }

  return (
    <DashboardLayout>
      {/* <DashboardNavbar /> */}
      <Box display="flex" justifyContent="space-between" alignItems="center" px={2} mt={2}>
        <Typography variant="h4">{t("calendar2.title")}</Typography>
        <Box display="flex" gap={2}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>{t("calendar2.filterLabel")}</InputLabel>
            <Select value={filter} label={t("calendar2.filterLabel")} onChange={e => setFilter(e.target.value)}>
              <MenuItem value="all">{t("calendar2.filters.all")}</MenuItem>
              <MenuItem value="trip">{t("calendar2.filters.trips")}</MenuItem>
              <MenuItem value="conge">{t("calendar2.filters.leaves")}</MenuItem>
            </Select>
          </FormControl>
       
          <Button variant="contained" startIcon={<AddIcon />} sx={{ color: "#fff" }}
onClick={() => {
            setFormOpen(true);
            setNewConge({ startDate: "", endDate: "", typeConge: "", reason: "" });
            setFile(null);
          }}>
            {t("calendar2.addLeave")}
          </Button>
        </Box>
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
            today: t("calendar2.today"),
            previous: t("calendar2.previous"),
            next: t("calendar2.next"),
            month: t("calendar2.month"),
            week: t("calendar2.week"),
            day: t("calendar2.day"),
            agenda: t("calendar2.agenda"),
            noEventsInRange: t("calendar2.noEvents")
          }}
        />
      </Box>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Card sx={modalStyle}>
          {selectedEvent ? (
            selectedEvent.type === "trip" ? (
              <>
                <Typography variant="h5" mb={2}>{t("modal.tripTitle")}</Typography>
                <Typography><b>{t("modal.date")}:</b> {format(selectedEvent.start, "dd/MM/yyyy")}</Typography>
                <Typography><b>{t("modal.time")}:</b> {format(selectedEvent.start, "HH:mm")}</Typography>
                <Typography><b>{t("modal.from")}:</b> {selectedEvent.startPoint}</Typography>
                <Typography><b>{t("modal.to")}:</b> {selectedEvent.destination}</Typography>
                <Typography><b>{t("modal.truck")}:</b> {selectedEvent.truck?.registration}</Typography>
              </>
            ) : (
              <>
                <Typography variant="h5" mb={2}  sx={{ wordBreak: "break-word" }}>{t("modal.leaveTitle")}</Typography>
                <Typography><b>{t("modal.start")}:</b> {format(selectedEvent.start, "dd/MM/yyyy")}</Typography>
                <Typography><b>{t("modal.end")}:</b> {format(selectedEvent.end, "dd/MM/yyyy")}</Typography>
                <Typography><b>{t("modal.type")}:</b> {t(`${selectedEvent.typeConge}`)}</Typography>
                <Typography><b>{t("modal.reason")}:</b> {selectedEvent.reason}</Typography>
                <Typography><b>{t("modal.status")}:</b> {selectedEvent.status}</Typography>
                {/* {selectedEvent.status === "pending" && ( */}
                  <Box mt={2} display="flex" justifyContent="flex-end" gap={1} flexWrap="wrap">
                    <Button onClick={handleDeleteConge} color="error" startIcon={<DeleteIcon />}>{t("modal.delete")}</Button>
                    <Button onClick={handleEditConge} color="primary" startIcon={<EditIcon />}>{t("modal.edit")}</Button>
                  </Box>
                {/* )} */}
              </>
            )
          ) : <CircularProgress />}
        </Card>
      </Modal>

      <Modal open={formOpen} onClose={() => setFormOpen(false)}>
        <Card component="form" sx={modalStyle} onSubmit={handleFormSubmit} encType="multipart/form-data">
          <Typography variant="h5" mb={2}>{newConge._id ? t("form2.editTitle") : t("form2.newTitle")}</Typography>
          <TextField label={t("form2.startDate")} name="startDate" type="date" value={newConge.startDate} onChange={handleChange} fullWidth margin="normal" InputLabelProps={{ shrink: true }} required />
          <TextField label={t("form2.endDate")} name="endDate" type="date" value={newConge.endDate} onChange={handleChange} fullWidth margin="normal" InputLabelProps={{ shrink: true }} />
          <TextField select label={t("form2.type")} name="typeConge" value={newConge.typeConge} onChange={handleChange} fullWidth margin="normal" required>
            {["maladie", "mariage", "vacance", "autre"].map(type => (
              <MenuItem key={type} value={type}>{t(`form2.types.${type}`)}</MenuItem>
            ))}
          </TextField>
          <TextField label={t("form2.reason")} name="reason" multiline rows={3} value={newConge.reason} onChange={handleChange} fullWidth margin="normal" />
          <Button   variant="contained"            // bouton rempli (pas outlined)
  component="label"
  fullWidth={false}              // pour que le bouton ne prenne pas toute la largeur
 sx={{ color: "#fff" }}>
            {t("form2.upload")}
            <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
          </Button>

          {filePreview && (
  <Box mt={2}>
    {file?.type?.startsWith("image/") ? (
      <img
        src={filePreview}
        alt="Preview"
        style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: 8 }}
      />
    ) : (
      <a href={filePreview} target="_blank" rel="noopener noreferrer" style={{ color: "blue" }}>
        📄 {file?.name}
      </a>
    )}
  </Box>
)}

          <Box display="flex" justifyContent="flex-end" mt={2}>
            <Button type="submit" variant="contained" sx={{ color: "#fff" }}>
              {newConge._id ? t("form2.edit") : t("form2.save")}
            </Button>
          </Box>
        </Card>
      </Modal>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* <Footer /> */}
    </DashboardLayout>
  );
}
