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
// import Footer from "examples/Footer";
import { useTranslation } from "react-i18next";

const locales = { fr };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const modalStyle = {
  position: "absolute", top: "50%", left: "50%",
  transform: "translate(-50%, -50%)", width: 500,
  bgcolor: 'background.paper', border: '2px solid #000',
  boxShadow: 24, p: 4
};

export default function CongeCalendarManager() {
  const { t } = useTranslation();
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
      const formatted = res.data.map(c => {
        const start = new Date(c.startDate);
        const end = c.endDate ? new Date(c.endDate) : new Date(start.getTime() + 60 * 60 * 1000);
        return {
          ...c,
          title: `${t("calendar2.leave")} (${t(`form2.types.${c.typeConge}`)})`,
          start,
          end,
          id: c._id,
        };
      });
      setConges(formatted);
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: t("fetchError"), severity: "error" });
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
      setSnackbar({ open: true, message: t("fileTypeError"), severity: "warning" });
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
      setSnackbar({ open: true, message: t("leaveSaved"), severity: "success" });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: t("saveError"), severity: "error" });
    }
  }

  async function handleDelete() {
    if (!window.confirm(t("confirmDelete"))) return;
    try {
      await axios.delete(`http://localhost:8080/conge/delete/${selectedConge._id || selectedConge.id}`, headers);
      setModalOpen(false);
      fetchConges();
      setSnackbar({ open: true, message: t("leaveDeleted"), severity: "info" });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: t("deleteError"), severity: "error" });
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
      {/* <DashboardNavbar /> */}

      <Box display="flex" justifyContent="space-between" alignItems="center" px={2} mt={2}>
        <Typography variant="h4">{t("leaveManagement")}</Typography>
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
          {t("addLeave")}
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
            today: t("today"), previous: t("previous"), next: t("next"),
            month: t("month"), week: t("week"), day: t("day"), agenda: t("agenda"),
            noEventsInRange: t("noEventsInRange")
          }}
        />
      </Box>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
<Card sx={{ ...modalStyle, maxHeight: "80vh", overflowY: "auto" }}>
          {selectedConge ? (
            <>
              <Typography variant="h6" gutterBottom>{t("detailsTitle")}</Typography>

<Typography variant="body2" sx={{ mb: 0.5 }}>
  <b>{t("from")}:</b> {format(selectedConge.start, "dd/MM/yyyy")}
</Typography>

<Typography variant="body2" sx={{ mb: 0.5 }}>
  <b>{t("to")}:</b> {format(selectedConge.end, "dd/MM/yyyy")}
</Typography>

<Typography variant="body2" sx={{ mb: 0.5 }}>
  <b>{t("leaveType")}:</b> {t(`form2.types.${selectedConge.typeConge}`)}
</Typography>

<Typography variant="body2" sx={{ mb: 0.5 }}>
  <b>{t("reason")}</b> {selectedConge.reason}
</Typography>

<Typography variant="body2" sx={{ mb: 0.5 }}>
  <b>{t("status")}</b> {selectedConge.status}
</Typography>

             <Box mt={2} display="flex" justifyContent="flex-end" sx={{ position: 'sticky', bottom: 0, backgroundColor: 'white', py: 1 }}>
              {/* {selectedConge.status === "pending" && (
                <> */}
                  <Button onClick={handleDelete} color="error" startIcon={<DeleteIcon />}>{t("delete")}</Button>
                  <Button onClick={handleEdit} color="primary" startIcon={<EditIcon />}>{t("edit")}</Button>
                {/* </>
              )} */}
            </Box>

            </>
          ) : <CircularProgress />}
        </Card>
      </Modal>

      <Modal open={formOpen} onClose={() => setFormOpen(false)}>
        <Card component="form" sx={modalStyle} onSubmit={handleFormSubmit} encType="multipart/form-data">
          <Typography variant="h5" mb={2}>{newConge._id ? t("editLeave") : t("newLeave")}</Typography>

          <TextField label={t("startDate")} name="startDate" type="date" value={newConge.startDate} onChange={handleChange} fullWidth margin="normal" InputLabelProps={{ shrink: true }} required />

          <TextField label={t("endDate")} name="endDate" type="date" value={newConge.endDate} onChange={handleChange} fullWidth margin="normal" InputLabelProps={{ shrink: true }} />

          <TextField select label={t("leaveType")} name="typeConge" value={newConge.typeConge} onChange={handleChange} fullWidth margin="normal" required>
            {["maladie", "mariage", "vacance", "autre"].map(type => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </TextField>

          <TextField label={t("reason")} name="reason" multiline rows={3} value={newConge.reason} onChange={handleChange} fullWidth margin="normal" />


<Button
  variant="contained"            // bouton rempli (pas outlined)
  component="label"
  fullWidth={false}              // pour que le bouton ne prenne pas toute la largeur
 sx={{ color: "#fff" }}
>
  {t("uploadJustification")}
  <input
    type="file"
    hidden
    accept=".pdf,.jpg,.jpeg,.png"
    onChange={handleFileChange}
  />
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
            <Button type="submit" variant="contained" color="primary" sx={{ color: "#fff" }}>
              {newConge._id ? t("edit") : t("save")}
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
