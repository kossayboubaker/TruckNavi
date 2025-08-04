import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

// MUI components
import Card from "@mui/material/Card";
import { Switch, Grid } from "@mui/material";
import MuiLink from "@mui/material/Link";
import FacebookIcon from "@mui/icons-material/Facebook";
import GitHubIcon from "@mui/icons-material/GitHub";
import GoogleIcon from "@mui/icons-material/Google";

// Custom components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";

// Layout
import BasicLayout from "layouts/authentication/components/BasicLayout";
import { AuthContext } from "context";

// i18n
import { useTranslation } from "react-i18next";

// Image
import bgImage from "assets/images/camion.jpg";
import { io } from "socket.io-client";

function Login() {
  const { t } = useTranslation();
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);

  const handleSetRememberMe = () => setRememberMe(!rememberMe);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await axios.post(
        "http://localhost:8080/user/login",
        { email_user: email, password },
        { withCredentials: true }
      );

      if (response.status === 200) {
        const { role, _id } = response.data;
        localStorage.setItem("role", role);
        localStorage.setItem("userId", _id);

        const socket = io("http://localhost:8080", {
          withCredentials: true,
          query: { userId: _id },
        });

        socket.on("connect", () => {
          console.log("✅ Socket connecté avec ID :", socket.id);
        });

        socket.emit("addUser", _id);
        socket.emit("setup", _id);

        switch (role) {
          case "super_admin":
            navigate("/dashboard/superadmin");
            break;
          case "manager":
            navigate("/dashboard/manager");
            break;
          case "driver":
            navigate("/dashboard/driver");
            break;
          default:
            setError(t("unknownRole"));
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || t("loginError"));
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8080/admin/auth/google";
  };

  return (
    <BasicLayout image={bgImage}>
      <Card>
        <MDBox
          variant="gradient"
          bgColor="info"
          borderRadius="lg"
          coloredShadow="info"
          mx={2}
          mt={-3}
          p={2}
          mb={1}
          textAlign="center"
        >
          <MDTypography variant="h4" fontWeight="medium" color="white" mt={1}>
                {t("form3.signIn")}
          </MDTypography>
          <Grid container spacing={3} justifyContent="center" sx={{ mt: 1, mb: 2 }}>
            <Grid item xs={2}>
              <MDTypography component={MuiLink} href="#" variant="body1" color="white">
                <FacebookIcon color="inherit" />
              </MDTypography>
            </Grid>
            <Grid item xs={2}>
              <MDTypography component={MuiLink} href="#" variant="body1" color="white">
                <GitHubIcon color="inherit" />
              </MDTypography>
            </Grid>
            <Grid item xs={2}>
              <MDTypography
                component="div"
                variant="body1"
                color="white"
                sx={{ cursor: "pointer" }}
                onClick={handleGoogleLogin}
              >
                <GoogleIcon color="inherit" />
              </MDTypography>
            </Grid>
          </Grid>
        </MDBox>

        <MDBox pt={4} pb={3} px={3}>
          <MDBox component="form" role="form" onSubmit={handleLogin}>
            <MDBox mb={2}>
              <MDInput
                type="email"
                label={t("form3.email")}
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </MDBox>
            <MDBox mb={2}>
              <MDInput
                type="password"
                label={t("form3.password")
}
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </MDBox>

            <MDBox mt={2} mb={1} textAlign="right">
              <MDTypography
                component={Link}
                to="/auth/forgot-password"
                variant="button"
                color="info"
                fontWeight="medium"
                textGradient
                sx={{ fontSize: "0.875rem" }}
              >
                {t("forgotPassword")}
              </MDTypography>
            </MDBox>

            <MDBox display="flex" alignItems="center" ml={-1}>
              <Switch checked={rememberMe} onChange={handleSetRememberMe} />
              <MDTypography
                variant="button"
                fontWeight="regular"
                color="text"
                onClick={handleSetRememberMe}
                sx={{ cursor: "pointer", userSelect: "none", ml: -1 }}
              >
                &nbsp;&nbsp;{t("rememberMe")}
              </MDTypography>
            </MDBox>

            {error && (
              <MDTypography variant="caption" color="error" sx={{ mt: 1 }}>
                {error}
              </MDTypography>
            )}

            <MDBox mt={4} mb={1}>
              <MDButton variant="gradient" color="info" fullWidth type="submit">
                {t("form3.signIn")}
              </MDButton>
            </MDBox>

            <MDBox mt={3} mb={1} textAlign="center">
              <MDTypography variant="button" color="text">
                {t("dontHaveAccount")}{" "}
                <MDTypography
                  component={Link}
                  to="/auth/register"
                  variant="button"
                  color="info"
                  fontWeight="medium"
                  textGradient
                >
                  {t("signUp")}
                </MDTypography>
              </MDTypography>
            </MDBox>
          </MDBox>
        </MDBox>
      </Card>
    </BasicLayout>
  );
}

export default Login;
