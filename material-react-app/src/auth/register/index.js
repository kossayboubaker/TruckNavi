import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

import Card from "@mui/material/Card";
import Checkbox from "@mui/material/Checkbox";
import { InputLabel, MenuItem, Select, FormControl } from "@mui/material";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";

import CoverLayout from "layouts/authentication/components/CoverLayout";
import bgImage from "assets/images/bg-sign-up-cover.jpeg";

import { AuthContext } from "context";
import { useTranslation } from "react-i18next";

const tunisianCities = [
  "Tunis", "Ariana", "Ben Arous", "Manouba", "Nabeul", "Zaghouan", "Bizerte",
  "Beja", "Jendouba", "Kef", "Siliana", "Sousse", "Monastir", "Mahdia",
  "Kairouan", "Kasserine", "Sidi Bouzid", "Sfax", "Gafsa", "Tozeur", "Kebili",
  "Gabes", "Medenine", "Tataouine"
];

function Register() {
  const { t } = useTranslation();
  const authContext = useContext(AuthContext);
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [inputs, setInputs] = useState({
    FirstName: "",
    LastName: "",
    email_user: "",
    password: "",
    num_user: "",
    country: "",
    agree: false,
    company_name: "",
    campany_email: "",
    code_tva: "",
    Campany_adress: "",
    num_campany: "",
    representant_legal: "",
  });

  const [errors, setErrors] = useState({});

  const isOnlyLetters = (value) => /^[A-Za-zÀ-ÿ\s]+$/.test(value);
  const isOnlyNumbers = (value) => /^[0-9]+$/.test(value);

  const changeHandler = (e) => {
    const { name, value, type, checked } = e.target;
    setInputs({ ...inputs, [name]: type === "checkbox" ? checked : value });
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateStep1 = () => {
    const newErrors = {};

    if (!inputs.FirstName.trim()) {
      newErrors.FirstName = t("validation.firstNameRequired");
    } else if (!isOnlyLetters(inputs.FirstName)) {
      newErrors.FirstName = t("validation.onlyLetters");
    }

    if (!inputs.LastName.trim()) {
      newErrors.LastName = t("validation.lastNameRequired");
    } else if (!isOnlyLetters(inputs.LastName)) {
      newErrors.LastName = t("validation.onlyLetters");
    }

    if (!inputs.email_user.trim()) {
      newErrors.email_user = t("validation.emailRequired");
    } else if (!/^\S+@\S+\.\S+$/.test(inputs.email_user)) {
      newErrors.email_user = t("validation.invalidEmail");
    }

    if (!inputs.password) {
      newErrors.password = t("validation.passwordRequired");
    } else if (inputs.password.length < 8) {
      newErrors.password = t("validation.passwordLength");
    }

    if (!inputs.num_user.trim()) {
      newErrors.num_user = t("validation.phoneRequired");
    } else if (!isOnlyNumbers(inputs.num_user)) {
      newErrors.num_user = t("validation.onlyNumbers");
    }

    if (!inputs.country) {
      newErrors.country = t("validation.cityRequired");
    }

    if (!inputs.agree) {
      newErrors.agree = t("validation.agreeRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!inputs.company_name.trim()) {
      newErrors.company_name = t("validation.companyNameRequired");
    }

    if (!inputs.campany_email.trim()) {
      newErrors.campany_email = t("validation.companyEmailRequired");
    } else if (!/^\S+@\S+\.\S+$/.test(inputs.campany_email)) {
      newErrors.campany_email = t("validation.invalidEmail");
    }

    if (!inputs.code_tva.trim()) {
      newErrors.code_tva = t("validation.tvaCodeRequired");
    } else if (!isOnlyNumbers(inputs.code_tva)) {
      newErrors.code_tva = t("validation.onlyNumbers");
    }

    if (!inputs.Campany_adress.trim()) {
      newErrors.Campany_adress = t("validation.companyAddressRequired");
    }

    if (!inputs.num_campany.trim()) {
      newErrors.num_campany = t("validation.companyPhoneRequired");
    } else if (!isOnlyNumbers(inputs.num_campany)) {
      newErrors.num_campany = t("validation.onlyNumbers");
    }

    if (!inputs.representant_legal.trim()) {
      newErrors.representant_legal = t("validation.legalRepresentativeRequired");
    } else if (!isOnlyLetters(inputs.representant_legal)) {
      newErrors.representant_legal = t("validation.onlyLetters");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    const newUser = {
      ...inputs,
      role: "super_admin",
    };

    try {
      const response = await axios.post("http://localhost:8080/user/register-super-admin", newUser, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.status === 201) {
        navigate("/auth/login");
      }
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        error: true,
        errorText: err.response?.data?.message || err.message,
      }));
    }
  };

  return (
    <CoverLayout image={bgImage}>
      <Card>
        <MDBox variant="gradient" bgColor="info" borderRadius="lg" coloredShadow="info" mx={2} mt={-3} p={3} mb={1} textAlign="center">
          <MDTypography variant="h4" fontWeight="medium" color="white" mt={1}>
            {t("register.title")}
          </MDTypography>
          <MDTypography display="block" variant="button" color="white" my={1}>
            {step === 1 ? t("register.step1") : t("register.step2")}
          </MDTypography>
        </MDBox>

        <MDBox pt={4} pb={3} px={3}>
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <>
                <MDInput label={t("form1.firstName")} name="FirstName" fullWidth onChange={changeHandler} value={inputs.FirstName} error={!!errors.FirstName} />
                {errors.FirstName && <MDTypography variant="caption" color="error">{errors.FirstName}</MDTypography>}
                <MDBox mt={2} />

                <MDInput label={t("form1.lastName")} name="LastName" fullWidth onChange={changeHandler} value={inputs.LastName} error={!!errors.LastName} />
                {errors.LastName && <MDTypography variant="caption" color="error">{errors.LastName}</MDTypography>}
                <MDBox mt={2} />

                <MDInput label={t("form1.email")} name="email_user" fullWidth onChange={changeHandler} value={inputs.email_user} error={!!errors.email_user} />
                {errors.email_user && <MDTypography variant="caption" color="error">{errors.email_user}</MDTypography>}
                <MDBox mt={2} />

                <MDInput type="password" label={t("form1.password")} name="password" fullWidth onChange={changeHandler} value={inputs.password} error={!!errors.password} />
                {errors.password && <MDTypography variant="caption" color="error">{errors.password}</MDTypography>}
                <MDBox mt={2} />

                <MDInput label={t("form1.phoneNumber")} name="num_user" fullWidth onChange={changeHandler} value={inputs.num_user} error={!!errors.num_user} />
                {errors.num_user && <MDTypography variant="caption" color="error">{errors.num_user}</MDTypography>}
                <MDBox mt={2} />

                <FormControl fullWidth error={!!errors.country}>
                  <Select name="country" value={inputs.country} onChange={changeHandler} displayEmpty>
                    <MenuItem value=""><em>{t("form1.selectCity")}</em></MenuItem>
                    {tunisianCities.map((city) => (
                      <MenuItem key={city} value={city}>{city}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {errors.country && <MDTypography variant="caption" color="error">{errors.country}</MDTypography>}
                <MDBox mt={2} />

                <MDBox display="flex" alignItems="center">
                  <Checkbox name="agree" checked={inputs.agree} onChange={changeHandler} />
                  <InputLabel htmlFor="agree">&nbsp;&nbsp;{t("form1.agreePrefix")}</InputLabel>
                  <MDTypography component={Link} to="#" variant="button" fontWeight="bold" color="info" textGradient>
                    {t("form1.terms")}
                  </MDTypography>
                </MDBox>
                {errors.agree && <MDTypography variant="caption" color="error">{errors.agree}</MDTypography>}
                <MDBox mt={3} textAlign="center">
                  <MDTypography variant="button" color="text">
                    {t("form1.alreadyAccount")}{" "}
                    <MDTypography component={Link} to="/auth/login" variant="button" color="info" fontWeight="medium" textGradient>
                      {t("form1.signIn")}
                    </MDTypography>
                  </MDTypography>
                </MDBox>

                <MDBox mt={4} mb={1}>
                  <MDButton variant="gradient" color="info" fullWidth onClick={handleNext}>
                    {t("buttons1.next")}
                  </MDButton>
                </MDBox>
              </>
            )}

            {step === 2 && (
              <>
                {["company_name", "campany_email", "code_tva", "Campany_adress", "num_campany", "representant_legal"].map((field) => (
                  <div key={field}>
                    <MDInput label={t(`form1.${field}`)} name={field} fullWidth onChange={changeHandler} value={inputs[field]} error={!!errors[field]} />
                    {errors[field] && <MDTypography variant="caption" color="error">{errors[field]}</MDTypography>}
                    <MDBox mt={2} />
                  </div>
                ))}

                {errors.error && <MDTypography variant="caption" color="error" mt={2}>{errors.errorText}</MDTypography>}
                <MDBox mt={3} textAlign="center">
                  <MDTypography variant="button" color="text">
                    {t("form1.alreadyAccount")}{" "}
                    <MDTypography component={Link} to="/auth/login" variant="button" color="info" fontWeight="medium" textGradient>
                      {t("form1.signIn")}
                    </MDTypography>
                  </MDTypography>
                </MDBox>
                <MDBox mt={4} mb={1}>
                  <MDButton variant="gradient" color="info" fullWidth type="submit">
                    {t("buttons1.signUp")}
                  </MDButton>
                </MDBox>
              </>
            )}
          </form>
        </MDBox>
      </Card>
    </CoverLayout>
  );
}

export default Register;