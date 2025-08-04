import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";

import Card from "@mui/material/Card";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import CoverLayout from "layouts/authentication/components/CoverLayout";
import bgImage from "assets/images/bg-sign-up-cover.jpeg";

const PasswordReset = () => {
  const { t } = useTranslation();

  const [token, setToken] = useState(null);
  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [inputs, setInputs] = useState({
    password: "",
    password_confirmation: "",
  });

  const [errors, setErrors] = useState({
    passwordError: false,
    confirmationError: false,
    error: false,
    textError: "",
  });

  const navigate = useNavigate();

  const changeHandler = (e) => {
    setInputs({
      ...inputs,
      [e.target.name]: e.target.value,
    });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("token");
    const emailFromUrl = params.get("email");

    if (!tokenFromUrl || !emailFromUrl) {
      window.location.href = "/auth/login";
    } else {
      setToken(tokenFromUrl);
      setEmail(emailFromUrl);
    }
  }, []);

  const submitHandler = async (e) => {
    e.preventDefault();

    setErrors({
      passwordError: false,
      confirmationError: false,
      error: false,
      textError: "",
    });
    setSuccessMessage("");

    if (inputs.password.trim().length < 8) {
      setErrors((prev) => ({
        ...prev,
        passwordError: true,
        textError: t("passwordTooShort"),
      }));
      return;
    }

    if (inputs.password !== inputs.password_confirmation) {
      setErrors((prev) => ({
        ...prev,
        confirmationError: true,
        textError: t("passwordsDoNotMatch"),
      }));
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`http://localhost:8080/user/reset-password`, {
        email_user: email,
        token: token,
        password: inputs.password,
        password_confirmation: inputs.password_confirmation,
      });

      setSuccessMessage(response.data.message || t("passwordResetSuccess"));
      setInputs({ password: "", password_confirmation: "" });

      setTimeout(() => {
        navigate("/auth/login");
      }, 2000);
    } catch (err) {
      const message =
        err?.response?.data?.message || t("passwordResetError");
      setErrors((prev) => ({
        ...prev,
        error: true,
        textError: message,
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <CoverLayout image={bgImage}>
      <Card>
        <MDBox
          variant="gradient"
          bgColor="info"
          borderRadius="lg"
          coloredShadow="success"
          mx={2}
          mt={-3}
          p={3}
          mb={1}
          textAlign="center"
        >
          <MDTypography variant="h4" fontWeight="medium" color="white" mt={1}>
            {t("resetPasswordTitle")}
          </MDTypography>
          <MDTypography display="block" variant="button" color="white" my={1}>
            {t("resetPasswordSubtitle")}
          </MDTypography>
        </MDBox>
        <MDBox pt={4} pb={3} px={3}>
          <MDBox component="form" role="form" method="POST" onSubmit={submitHandler}>
            <MDBox mb={2}>
              <MDInput
                type="password"
                label={t("newPassword")}
                variant="standard"
                fullWidth
                name="password"
                value={inputs.password}
                onChange={changeHandler}
                error={errors.passwordError}
              />
            </MDBox>
            <MDBox mb={2}>
              <MDInput
                type="password"
                label={t("confirmPassword")}
                variant="standard"
                fullWidth
                name="password_confirmation"
                value={inputs.password_confirmation}
                onChange={changeHandler}
                error={errors.confirmationError}
              />
            </MDBox>

            {errors.error && (
              <MDTypography variant="caption" color="error" fontWeight="light">
                {errors.textError}
              </MDTypography>
            )}

            {successMessage && (
              <MDTypography variant="caption" color="success" fontWeight="medium">
                {successMessage}
              </MDTypography>
            )}

            <MDBox mt={4} mb={1}>
              <MDButton variant="gradient" color="info" fullWidth type="submit" disabled={loading}>
                {loading ? t("processing") : t("resetPassword")}
              </MDButton>
            </MDBox>
                            <MDBox mt={3} textAlign="center">
                  <MDTypography variant="button" color="text">
                    {t("form1.alreadyAccount")}{" "}
                    <MDTypography component={Link} to="/auth/login" variant="button" color="info" fontWeight="medium" textGradient>
                      {t("form1.signIn")}
                    </MDTypography>
                  </MDTypography>
                </MDBox>
            <MDBox mt={3} mb={1} textAlign="center">
              <MDTypography variant="button" color="text">
                {t("alreadyHaveAccount")}{" "}
                <MDTypography
                  component={Link}
                  to="/auth/login"
                  variant="button"
                  color="info"
                  fontWeight="medium"
                  textGradient
                >
                  {t("signIn")}
                </MDTypography>
              </MDTypography>
            </MDBox>
          </MDBox>
        </MDBox>
      </Card>
    </CoverLayout>
  );
};

export default PasswordReset;
