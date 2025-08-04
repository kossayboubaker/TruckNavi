import { useState, useEffect } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";

import Card from "@mui/material/Card";

// Material Dashboard components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import MDAlert from "components/MDAlert";

// Layout and image
import CoverLayout from "layouts/authentication/components/CoverLayout";
import bgImage from "assets/images/bg-reset-cover.jpeg";

function ForgotPassword() {
  const { t } = useTranslation();

  const [isDemo, setIsDemo] = useState(false);
  const [notification, setNotification] = useState(false);
  const [input, setEmail] = useState({ email_user: "" });
  const [error, setError] = useState({ err: false, textError: "" });

  useEffect(() => {
    setIsDemo(process.env.REACT_APP_IS_DEMO === "true");
  }, []);

  const changeHandler = (e) => {
    setEmail({ [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const mailFormat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

    if (
      input.email_user.trim().length === 0 ||
      !input.email_user.trim().match(mailFormat)
    ) {
      setError({ err: true, textError: t("forgot.validation.invalidEmail") });
      return;
    }

    try {
      if (!isDemo) {
        await axios.post(`http://localhost:8080/user/forgot-password`, {
          email_user: input.email_user,
        });

        setError({ err: false, textError: "" });
        setNotification(true);
      } else {
        setNotification(true);
      }
    } catch (err) {
      const message =
        err.response?.data?.message || t("forgot.validation.serverError");
      setError({ err: true, textError: message });
    }
  };

  return (
    <CoverLayout coverHeight="50vh" image={bgImage}>
      <Card>
        <MDBox
          variant="gradient"
          bgColor="info"
          borderRadius="lg"
          coloredShadow="success"
          mx={2}
          mt={-3}
          py={2}
          mb={1}
          textAlign="center"
        >
          <MDTypography variant="h3" fontWeight="medium" color="white" mt={1}>
            {t("forgot.title")}
          </MDTypography>
          <MDTypography display="block" variant="button" color="white" my={1}>
            {t("forgot.subtitle")}
          </MDTypography>
        </MDBox>
        <MDBox pt={4} pb={3} px={3}>
          <MDBox component="form" role="form" method="POST" onSubmit={handleSubmit}>
            <MDBox mb={4}>
              <MDInput
                type="email"
                label={t("form.email")}
                variant="standard"
                fullWidth
                value={input.email_user}
                name="email_user"
                onChange={changeHandler}
                error={error.err}
              />
            </MDBox>
            {error.err && (
              <MDTypography variant="caption" color="error" fontWeight="light">
                {error.textError}
              </MDTypography>
            )}
                            <MDBox mt={3} textAlign="center">
                              <MDTypography variant="button" color="text">
                                {t("form1.alreadyAccount")}{" "}
                                <MDTypography component={Link} to="/auth/login" variant="button" color="info" fontWeight="medium" textGradient>
                                  {t("form1.signIn")}
                                </MDTypography>
                              </MDTypography>
                            </MDBox>
            <MDBox mt={6} mb={1}>
              <MDButton variant="gradient" color="info" fullWidth type="submit">
                {t("buttons.reset")}
              </MDButton>
            </MDBox>
          </MDBox>
        </MDBox>
      </Card>
      {notification && (
        <MDAlert color="info" mt="20px" dismissible>
          <MDTypography variant="body2" color="white">
            {isDemo
              ? t("forgot.demoMessage")
              : t("forgot.successMessage")}
          </MDTypography>
        </MDAlert>
      )}
    </CoverLayout>
  );
}

export default ForgotPassword;
