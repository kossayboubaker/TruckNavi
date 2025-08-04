import { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Card,
  Grid,
  TextField,
  MenuItem,
  Button,
  Typography,
  Avatar,
  Divider,
  Alert,
  IconButton,
  InputAdornment,
} from "@mui/material";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import InfoIcon from "@mui/icons-material/Info";
import EditIcon from "@mui/icons-material/Edit";
import SecurityIcon from "@mui/icons-material/Security";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import PublicIcon from "@mui/icons-material/Public";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import backgroundImage from "assets/images/bg-profile.jpeg";
import { useTranslation } from "react-i18next";

const TUNISIAN_CITIES = [
  "Tunis", "Ariana", "Ben Arous", "Manouba", "Nabeul", "Zaghouan", "Bizerte",
  "Béja", "Jendouba", "Kef", "Siliana", "Sousse", "Monastir", "Mahdia",
  "Kairouan", "Kasserine", "Sidi Bouzid", "Sfax", "Gabès", "Medenine",
  "Tataouine", "Gafsa", "Tozeur", "Kebili"
];

const UpdateProfile = () => {
  const [user, setUser] = useState({
    FirstName: "",
    LastName: "",
    email_user: "",
    role: "",
    num_user: "",
    country: "",
    image: null,
    Post: "",
    status: "",
  });
  const { t } = useTranslation();

  const [selectedFile, setSelectedFile] = useState(null);
  const [activeTab, setActiveTab] = useState("info");
  const [alertMessage, setAlertMessage] = useState(null);

  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const fetchUser = async () => {
    try {
      const response = await axios.get("http://localhost:8080/user/getProfile", {
        withCredentials: true,
      });
      setUser(response.data);
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const changeHandler = (e) => {
    const { name, value } = e.target;
    if (name === "num_user") {
      const cleaned = value.replace(/\D/g, "").slice(0, 8);
      setUser({ ...user, [name]: cleaned });
    } else {
      setUser({ ...user, [name]: value });
    }
  };

  const passwordChangeHandler = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.entries(user).forEach(([key, value]) => {
        if (key !== "image" && value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });

      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      const response = await axios.put("http://localhost:8080/user/updateProfile", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 200) {
setAlertMessage({ type: "info", text: t("updateSuccess") });
        fetchUser();
        setActiveTab("info");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
setAlertMessage({ type: "error", text: t("updateError") });
    }
  };

  const handleAvatarUpdate = async (file) => {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await axios.put("http://localhost:8080/user/updateProfile", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 200) {
setAlertMessage({ type: "info", text: t("avatarSuccess") });
        fetchUser();
      }
    } catch (err) {
      console.error("Erreur mise à jour avatar:", err);
setAlertMessage({ type: "error", text: t("avatarError") });
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put("http://localhost:8080/user/updatePassword", passwords, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });

      if (response.status === 200) {
setAlertMessage({ type: "info", text: t("passwordSuccess") });
        setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
        setActiveTab("info");
      }
    } catch (err) {
      console.error("Error updating password:", err);
setAlertMessage({ type: "error", text: t("passwordError") });
    }
  };

  const renderPostField = () =>
    user.role === "admin" ? (
      <Grid item xs={12}>
        <TextField
          name="Post"
  label={t("post")}
          fullWidth
          value={user.Post || ""}
          onChange={changeHandler}
        />
      </Grid>
    ) : null;

  const renderStatusField = () =>
    user.role === "driver" ? (
      <Grid item xs={12}>
        <TextField
          select
          name="status"
  label={t("status")}
          fullWidth
          value={user.status || ""}
          onChange={changeHandler}
        >
         <MenuItem value="available">{t("available")}</MenuItem>
          <MenuItem value="on_route">{t("onRoute")}</MenuItem>
          <MenuItem value="off_duty">{t("offDuty")}</MenuItem>
        </TextField>
      </Grid>
    ) : null;

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
        <Box mx={2} mt={2} py={3} px={2} bgcolor="info.main" borderRadius="lg">
          <Typography variant="h6" sx={{ color: "#fff" }}>
  {t("accountSettings")}
          </Typography>
        </Box>

        <Box pt={3} px={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, textAlign: "center" }}>
                <Box display="flex" flexDirection="column" alignItems="center">
                  <Box position="relative" mb={2}>
                    <Avatar
                      src={
                        selectedFile
                          ? URL.createObjectURL(selectedFile)
                          : user.image
                          ? `http://localhost:8080/uploads/${user.image}`
                          : null
                      }
                      sx={{ width: 120, height: 120 }}
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
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setSelectedFile(file);
                          handleAvatarUpdate(file);
                        }
                      }}
                    />
                  </Box>

                  <Typography variant="h6">{`${user.FirstName} ${user.LastName}`}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {user.role}
                  </Typography>
                  <Divider sx={{ my: 2, width: "100%" }} />
                  <Button fullWidth onClick={() => setActiveTab("info")} startIcon={<InfoIcon />}>
  {t("personalInfo")}
                  </Button>
                  <Box mt={2} display="flex" flexDirection="column" gap={1} width="100%">
                    <Button
                      variant="outlined"
                      sx={{ color: "#1a73e8", borderColor: "#1a73e8" }}
                      startIcon={<EditIcon />}
                      onClick={() => setActiveTab("edit")}
                    >
  {t("updateProfile")}
                    </Button>
                    <Button
                      variant="outlined"
                      sx={{ color: "#1a73e8", borderColor: "#1a73e8" }}
                      startIcon={<SecurityIcon />}
                      onClick={() => setActiveTab("security")}
                    >
  {t("security")}
                    </Button>
                  </Box>
                </Box>
              </Card>
            </Grid>

            <Grid item xs={12} md={8}>
              {alertMessage && (
                <Alert
                  severity={alertMessage.type}
                  onClose={() => setAlertMessage(null)}
                  sx={{ mb: 2 }}
                >
                  {alertMessage.text}
                </Alert>
              )}

              {activeTab === "info" && (
                <Card variant="outlined" sx={{ p: 3, textAlign: "center" }}>
                  <Typography variant="h6" mb={3}>
                    {t("userDetails")}
                  </Typography>
                  <Box display="flex" alignItems="center" justifyContent="center" mb={1}>
                    <PersonIcon sx={{ mr: 1 }} />
                    <Typography>{user.FirstName} {user.LastName}</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" justifyContent="center" mb={1}>
                    <EmailIcon sx={{ mr: 1 }} />
                    <Typography>{user.email_user}</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" justifyContent="center" mb={1}>
                    <PhoneIphoneIcon sx={{ mr: 1 }} />
                    <Typography>+216 {user.num_user}</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" justifyContent="center">
                    <PublicIcon sx={{ mr: 1 }} />
                    <Typography>{user.country}</Typography>
                  </Box>
                </Card>
              )}

              {activeTab === "edit" && (
                <form onSubmit={handleUpdateProfile}>
                  <Card variant="outlined" sx={{ p: 3 }}>
                    <Typography variant="h6" mb={3}>
                          {t("updateProfile")}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          name="FirstName"
  label={t("firstName")}
                          fullWidth
                          value={user.FirstName}
                          onChange={changeHandler}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          name="LastName"
  label={t("lastName")}
                          fullWidth
                          value={user.LastName}
                          onChange={changeHandler}
                          required
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          name="email_user"
  label={t("email")}
                          type="email"
                          fullWidth
                          value={user.email_user}
                          onChange={changeHandler}
                          required
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          name="num_user"
  label={t("phoneNumber")}
                          fullWidth
                          value={user.num_user}
                          onChange={changeHandler}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">+216</InputAdornment>,
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          select
                          name="country"
  label={t("country")}
                          fullWidth
                          value={user.country}
                          onChange={changeHandler}
                        >
                          {TUNISIAN_CITIES.map((city) => (
                            <MenuItem key={city} value={city}>
                              {city}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>

                      {renderPostField()}
                      {renderStatusField()}

                      <Grid item xs={12} textAlign="right">
                        <Button type="submit" variant="contained" sx={{ backgroundColor: "#1976d2", color: "#fff" }}>
                          {t("updateProfile")}
                        </Button>
                      </Grid>
                    </Grid>
                  </Card>
                </form>
              )}

              {activeTab === "security" && (
                <form onSubmit={handlePasswordUpdate}>
                  <Card variant="outlined" sx={{ p: 3 }}>
                    <Typography variant="h6" mb={3}>
  {t("changePassword")}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
  label={t("currentPassword")}
                          type="password"
                          name="oldPassword"
                          value={passwords.oldPassword}
                          onChange={passwordChangeHandler}
                          fullWidth
                          required
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
  label={t("newPassword")}
                          type="password"
                          name="newPassword"
                          value={passwords.newPassword}
                          onChange={passwordChangeHandler}
                          fullWidth
                          required
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
  label={t("confirmNewPassword")}
                          type="password"
                          name="confirmPassword"
                          value={passwords.confirmPassword}
                          onChange={passwordChangeHandler}
                          fullWidth
                          required
                        />
                      </Grid>
                      <Grid item xs={12} textAlign="right">
                        <Button type="submit" variant="contained" sx={{ backgroundColor: "#1976d2", color: "#fff" }}>
                          {t("changePassword")}
                        </Button>
                      </Grid>
                    </Grid>
                  </Card>
                </form>
              )}
            </Grid>
          </Grid>
        </Box>
      </Card>
    </DashboardLayout>
  );
};

export default UpdateProfile;
