import { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  Avatar,
  Button,
  Typography,
  Box,
  Grid,
  TextField,
  IconButton,
  Alert,
} from "@mui/material";

import PhotoCamera from "@mui/icons-material/PhotoCamera";
import BusinessIcon from "@mui/icons-material/Business";
import EditIcon from "@mui/icons-material/Edit";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PersonIcon from "@mui/icons-material/Person";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
// import Footer from "examples/Footer";
import backgroundImage from "assets/images/bg-profile.jpeg";
import MDBox from "components/MDBox";
import { useTranslation } from "react-i18next";

const ProfileCompany = () => {
  const { t } = useTranslation();

  const [alertMessage, setAlertMessage] = useState(null);
  const [view, setView] = useState("info");

  const [company, setCompany] = useState({
    company_name: "",
    campany_email: "",
    code_tva: "",
    Campany_adress: "",
    num_campany: "",
    representant_legal: "",
    image_campany: null,
  });

  const fetchCompany = async () => {
    try {
      const response = await axios.get("http://localhost:8080/user/getProfileCompany", {
        withCredentials: true,
      });
      setCompany(response.data);
    } catch (err) {
      console.error("Error fetching company profile:", err);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, []);

  const changeHandler = (e) => {
    setCompany({ ...company, [e.target.name]: e.target.value });
  };
//hi
  const handleImageUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append("image_campany", file);

      const response = await axios.put("http://localhost:8080/user/updateCompany", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 200) {
        setAlertMessage({ type: "success", text: t("avatarSuccess") });
        fetchCompany();
      }
    } catch (err) {
      console.error("Erreur lors de la mise à jour de l'image:", err);
      setAlertMessage({ type: "error", text: t("avatarError") });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleUpdateCompany = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.entries(company).forEach(([key, value]) => {
        if (key !== "image_campany" && value) {
          formData.append(key, value);
        }
      });

      const response = await axios.put("http://localhost:8080/user/updateCompany", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 200) {
        setAlertMessage({ type: "success", text: t("updateSuccess") });
        fetchCompany();
        setView("info");
      }
    } catch (err) {
      console.error("Error updating company profile:", err);
      setAlertMessage({ type: "error", text: t("updateError") });
    }
  };

  return (
    <DashboardLayout>
      {/* <DashboardNavbar /> */}
      <Box
        height="300px"
        sx={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderRadius: "lg",
          mb: 2,
        }}
      />
      <Card sx={{ m: 2 }}>
        <MDBox
          mx={2}
          mt={2}
          py={3}
          px={2}
          variant="gradient"
          bgColor="info"
          borderRadius="lg"
          coloredShadow="info"
        >
          <Typography variant="h6" sx={{ color: "#fff" }}>
            {t("companyProfile")}
          </Typography>
        </MDBox>
        <MDBox pt={3} px={2}>
          {alertMessage && (
            <Alert
              severity={alertMessage.type}
              onClose={() => setAlertMessage(null)}
              sx={{ mb: 2 }}
            >
              {alertMessage.text}
            </Alert>
          )}
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, textAlign: "center" }}>
                <Box position="relative" mb={2}>
                  <Avatar
                    src={
                      company.image_campany
                        ? `http://localhost:8080/uploads/${company.image_campany}`
                        : null
                    }
                    sx={{ width: 120, height: 120, margin: "0 auto" }}
                  />
                  <IconButton
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      backgroundColor: "#ffffffcc",
                      "&:hover": { backgroundColor: "#f0f0f0" },
                      transform: "translate(20%, 20%)",
                    }}
                    size="small"
                    onClick={() => document.getElementById("image-upload").click()}
                  >
                    <PhotoCamera fontSize="small" />
                  </IconButton>
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                </Box>
                <Typography variant="h6" mb={2}>
                  {company.company_name || t("companyName")}
                </Typography>

                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<BusinessIcon />}
                  onClick={() => setView("info")}
                  sx={{ mb: 1, backgroundColor: "#1976d2", color: "#fff" }}
                >
                  {t("companyInfo")}
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<EditIcon />}
                  sx={{ color: "#1a73e8", borderColor: "#1a73e8" }}
                  onClick={() => setView("update")}
                >
                  {t("updateCompany")}
                </Button>
              </Card>
            </Grid>

            <Grid item xs={12} md={8}>
              {view === "info" && (
                <Card variant="outlined" sx={{ p: 3 }}>
                  <Typography variant="h6" mb={3} align="center">
                    {t("companyDetails")}
                  </Typography>

                  <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
                    <BusinessIcon sx={{ mr: 1, color: "text.secondary" }} />
                    <Typography>{company.company_name || "-"}</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
                    <EmailIcon sx={{ mr: 1, color: "text.secondary" }} />
                    <Typography>{company.campany_email || "-"}</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
                    <ConfirmationNumberIcon sx={{ mr: 1, color: "text.secondary" }} />
                    <Typography>{company.code_tva || "-"}</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
                    <LocationOnIcon sx={{ mr: 1, color: "text.secondary" }} />
                    <Typography>{company.Campany_adress || "-"}</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
                    <PhoneIcon sx={{ mr: 1, color: "text.secondary" }} />
                    <Typography>{company.num_campany || "-"}</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
                    <PersonIcon sx={{ mr: 1, color: "text.secondary" }} />
                    <Typography>{company.representant_legal || "-"}</Typography>
                  </Box>
                </Card>
              )}

              {view === "update" && (
                <Card variant="outlined" sx={{ p: 3 }}>
                  <Typography variant="h6" mb={3}>
                    {t("updateCompany")}
                  </Typography>
                  <form onSubmit={handleUpdateCompany}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          name="company_name"
                          label={t("companyName")}
                          fullWidth
                          value={company.company_name || ""}
                          onChange={changeHandler}
                          required
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          name="campany_email"
                          label={t("companyEmail")}
                          type="email"
                          fullWidth
                          value={company.campany_email || ""}
                          onChange={changeHandler}
                          required
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          name="code_tva"
                          label={t("vatCode")}
                          fullWidth
                          value={company.code_tva || ""}
                          onChange={changeHandler}
                          required
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          name="Campany_adress"
                          label={t("address")}
                          fullWidth
                          value={company.Campany_adress || ""}
                          onChange={changeHandler}
                          required
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          name="num_campany"
                          label={t("phone")}
                          type="number"
                          fullWidth
                          value={company.num_campany || ""}
                          onChange={changeHandler}
                          required
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          name="representant_legal"
                          label={t("legalRep")}
                          fullWidth
                          value={company.representant_legal || ""}
                          onChange={changeHandler}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} textAlign="right">
                        <Button
                          type="submit"
                          variant="contained"
                          sx={{ backgroundColor: "#1976d2", color: "#fff" }}
                        >
                          {t("updateCompany")}
                        </Button>
                      </Grid>
                    </Grid>
                  </form>
                </Card>
              )}
            </Grid>
          </Grid>
        </MDBox>
      </Card>
      {/* <Footer /> */}
    </DashboardLayout>
  );
};

export default ProfileCompany;
