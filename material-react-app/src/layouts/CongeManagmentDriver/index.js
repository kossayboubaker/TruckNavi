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

export default function CongeCalendarDriver() {
  const [conges, setConges] = useState([]);
  const [selectedConge, setSelectedConge] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [newConge, setNewConge] = useState({
    startDate: "", endDate: "", typeConge: "", reason: ""
  });
  const [file, setFile] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const token = document.cookie.split("; ").find((r) => r.startsWith("token="))?.split("=")[1];
  const headers = { headers: { Authorization: `Bearer ${token}` }, withCredentials: true };
const [filePreview, setFilePreview] = useState(null);

  async function fetchConges() {
    try {
      const res = await axios.get("http://localhost:8080/conge/my", headers);
      const formatted = res.data.map(c => ({
        ...c,
        title: `Congé (${c.typeConge})`,
        start: new Date(c.startDate),
        end: new Date(c.endDate),
        id: c._id,
      }));
      setConges(formatted);
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Erreur lors du chargement des congés", severity: "error" });
    }
  }

  useEffect(() => { fetchConges(); }, []);

  function handleSelectConge(event) {
    const found = conges.find(c => c.id === event.id);
    if (found) {
      setSelectedConge(found);
      setModalOpen(true);
    }
  }

  function handleChange(e) {
    setNewConge(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleFileChange(e) {
    const selectedFile = e.target.files[0];
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (selectedFile && !allowedTypes.includes(selectedFile.type)) {
      setSnackbar({
        open: true,
        message: "Seuls les fichiers PDF, JPG ou PNG sont acceptés",
        severity: "warning",
      });
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
      fetchConges();
      setSnackbar({ open: true, message: "Congé sauvegardé avec succès", severity: "success" });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Erreur lors de la sauvegarde", severity: "error" });
    }
  }

  async function handleDelete() {
    if (!window.confirm("Confirmer la suppression du congé ?")) return;
    try {
      await axios.delete(`http://localhost:8080/conge/delete/${selectedConge._id || selectedConge.id}`, headers);
      setModalOpen(false);
      fetchConges();
      setSnackbar({ open: true, message: "Congé supprimé", severity: "info" });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Erreur de suppression", severity: "error" });
    }
  }

  function handleEdit() {
    setFormOpen(true);
    setNewConge({
      _id: selectedConge._id || selectedConge.id,
      startDate: format(selectedConge.start, "yyyy-MM-dd"),
      endDate: format(selectedConge.end, "yyyy-MM-dd"),
      typeConge: selectedConge.typeConge,
      reason: selectedConge.reason
    });
    setModalOpen(false);
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <Box display="flex" justifyContent="space-between" alignItems="center" px={2} mt={2}>
        <Typography variant="h4">Gestion des congés</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setFormOpen(true);
            setNewConge({ startDate: "", endDate: "", typeConge: "", reason: "" });
            setFile(null);
          }}
          sx={{ color: "#fff" }}
        >
          Ajouter Congé
        </Button>
      </Box>

      <Box height="75vh" p={2}>
        <Calendar
          localizer={localizer}
          events={conges}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%" }}
          onSelectEvent={handleSelectConge}
          culture="fr"
          messages={{
            today: "Aujourd'hui", previous: "Précédent", next: "Suivant",
            month: "Mois", week: "Semaine", day: "Jour", agenda: "Agenda",
            noEventsInRange: "Aucun congé dans cette période"
          }}
        />
      </Box>

      {/* Modal détail */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Card sx={modalStyle}>
          {selectedConge ? (
            <>
              <Typography variant="h5">Détails du congé</Typography>
              <Typography><b>Du :</b> {format(selectedConge.start, "dd/MM/yyyy")}</Typography>
              <Typography><b>Au :</b> {format(selectedConge.end, "dd/MM/yyyy")}</Typography>
              <Typography><b>Type :</b> {selectedConge.typeConge}</Typography>
              <Typography><b>Raison :</b> {selectedConge.reason}</Typography>
              <Typography><b>Statut :</b> {selectedConge.status}</Typography>
              <Box mt={2} display="flex" justifyContent="flex-end">
                {selectedConge.status === "pending" && (
                  <>
                    <Button onClick={handleDelete} color="error" startIcon={<DeleteIcon />}>Supprimer</Button>
                    <Button onClick={handleEdit} color="primary" startIcon={<EditIcon />}>Modifier</Button>
                  </>
                )}
              </Box>
            </>
          ) : <CircularProgress />}
        </Card>
      </Modal>

      {/* Formulaire ajout/modif */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)}>
        <Card component="form" sx={modalStyle} onSubmit={handleFormSubmit} encType="multipart/form-data">
          <Typography variant="h5" mb={2}>{newConge._id ? "Modifier Congé" : "Nouveau Congé"}</Typography>

          <TextField
            label="Date de début"
            name="startDate"
            type="date"
            value={newConge.startDate}
            onChange={handleChange}
            fullWidth margin="normal"
            InputLabelProps={{ shrink: true }} required
          />

          <TextField
            label="Date de fin"
            name="endDate"
            type="date"
            value={newConge.endDate}
            onChange={handleChange}
            fullWidth margin="normal"
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            select label="Type de congé"
            name="typeConge"
            value={newConge.typeConge}
            onChange={handleChange}
            fullWidth margin="normal" required
          >
            {["maladie", "mariage", "vacance", "autre"].map(type => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </TextField>

          <TextField
            label="Raison"
            name="reason"
            multiline rows={3}
            value={newConge.reason}
            onChange={handleChange}
            fullWidth margin="normal"
          />

          <Button variant="outlined" component="label" fullWidth>
            Joindre un justificatif (PDF/Image)
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
            <Button type="submit" variant="contained" color="primary">
              {newConge._id ? "Modifier" : "Enregistrer"}
            </Button>
          </Box>
        </Card>
      </Modal>

      {/* Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Footer />
    </DashboardLayout>
  );
}
