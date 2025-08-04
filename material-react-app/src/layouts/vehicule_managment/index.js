import { useEffect, useState } from "react";
import axios from "axios";
import {
  Grid,
  Card,
  IconButton,
  Button,
  TextField,
  MenuItem,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";

import { useTranslation } from "react-i18next";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DataTable from "examples/Tables/DataTable";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";

const VehicleManager = () => {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    truckId: "",
    truckType: "Tanker",
    weight: "",
    height: "",
    width: "",
    length: "",
    axleCount: "",
    fuelType: "Diesel",
    fuelConsumption: "",
    emissionRate: "",
    ecoMode: false,
    hazardousCargo: false,
    maxAllowedSpeed: "",
    status: "out_of_service",
    _id: null,
  });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    fetchTrucks();
  }, []);

  useEffect(() => {
    if (alert.message) {
      const timer = setTimeout(() => setAlert({ type: "", message: "" }), 4000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const fetchTrucks = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:8080/camion", {
        withCredentials: true,
      });
      setRows(response.data);
    } catch (error) {
      console.error("Error fetching trucks:", error);
      setAlert({ type: "error", message: t("errorLoading") });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:8080/camion/${confirmDeleteId}`, {
        withCredentials: true,
      });
      setAlert({ type: "success", message: t("truckDeleted") });
      fetchTrucks();
    } catch (error) {
      console.error("Error deleting truck:", error);
      setAlert({ type: "error", message: t("errorDeleting") });
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const handleEdit = (truck) => {
    setFormData({ ...truck, _id: truck._id });
    setActiveStep(0);
    setShowForm(true);
  };

  const handleAdd = () => {
    setFormData({
      truckId: "",
      truckType: "Tanker",
      weight: "",
      height: "",
      width: "",
      length: "",
      axleCount: "",
      fuelType: "Diesel",
      fuelConsumption: "",
      emissionRate: "",
      ecoMode: false,
      hazardousCargo: false,
      maxAllowedSpeed: "",
      status: "out_of_service",
      _id: null,
    });
    setActiveStep(0);
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    console.log(`Changing ${name} to ${type === "checkbox" ? checked : value}`);
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleNext = (e) => {
    e.preventDefault();
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (formData._id) {
        await axios.put(`http://localhost:8080/camion/${formData._id}`, formData, {
          withCredentials: true,
        });
        setAlert({ type: "success", message: t("truckUpdated") });
      } else {
        await axios.post("http://localhost:8080/camion", formData, {
          withCredentials: true,
        });
        setAlert({ type: "success", message: t("truckAdded") });
      }

      setFormData({
        truckId: "",
        truckType: "Tanker",
        weight: "",
        height: "",
        width: "",
        length: "",
        axleCount: "",
        fuelType: "Diesel",
        fuelConsumption: "",
        emissionRate: "",
        ecoMode: false,
        hazardousCargo: false,
        maxAllowedSpeed: "",
        status: "out_of_service",
        _id: null,
      });
      setShowForm(false);
      setActiveStep(0);
      fetchTrucks();
    } catch (error) {
      console.error("Error saving truck:", error);
      setAlert({ type: "error", message: t("errorSaving") });
    } finally {
      setLoading(false);
    }
  };

  const filteredRows = rows.filter((row) =>
    Object.values(row).some((val) =>
      val?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const columns = [
    { Header: t("truckId"), accessor: "truckId" },
    { Header: t("truckType"), accessor: "truckType" },
    { Header: t("weight"), accessor: "weight" },
    { Header: t("height"), accessor: "height" },
    { Header: t("width"), accessor: "width" },
    { Header: t("length"), accessor: "length" },
    { Header: t("axleCount"), accessor: "axleCount" },
    { Header: t("fuelType"), accessor: "fuelType" },
    { Header: t("fuelConsumption"), accessor: "fuelConsumption" },
    { Header: t("emissionRate"), accessor: "emissionRate" },
    {
      Header: t("ecoMode"),
      accessor: "ecoMode",
      Cell: ({ value }) => (value ? "Active" : "Inactive"),
    },
    {
      Header: t("hazardousCargo"),
      accessor: "hazardousCargo",
      Cell: ({ value }) => (value ? "Active" : "Inactive"),
    },
    { Header: t("maxAllowedSpeed"), accessor: "maxAllowedSpeed" },
    { Header: t("status"), accessor: "status" },
    {
      Header: t("actions"),
      accessor: "actions",
      Cell: ({ row }) => {
        const truck = row.original;
        return (
          <>
            <IconButton color="primary" onClick={() => handleEdit(truck)}>
              <EditIcon />
            </IconButton>
            <IconButton color="error" onClick={() => setConfirmDeleteId(truck._id)}>
              <DeleteIcon />
            </IconButton>
          </>
        );
      },
    },
  ];

  const truckTypes = ["Tanker", "Flatbed", "Refrigerated", "Box", "Other"];
  const fuelTypes = ["Diesel", "Petrol", "Electric", "Hybrid"];
  const statusOptions = ["in_service", "out_of_service", "under_maintenance"];

  return (
    <DashboardLayout>
      <MDBox pt={6} pb={3}>
        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Card>
              <MDBox
                mx={2}
                mt={-3}
                py={3}
                px={2}
                variant="gradient"
                bgColor="info"
                borderRadius="lg"
                coloredShadow="info"
              >
                <MDTypography variant="h6" color="white">
                  {t("truckManagement")}
                </MDTypography>
              </MDBox>

              {alert.message && (
                <MDBox px={2} pt={2}>
                  <Alert severity={alert.type}>{alert.message}</Alert>
                </MDBox>
              )}

              <MDBox pt={3} px={2}>
                <MDBox display="flex" justifyContent="space-between" mb={2}>
                  <TextField
                    variant="outlined"
                    placeholder={t("searchPlaceholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ width: "60%" }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon sx={{ color: "white" }} />}
                    onClick={handleAdd}
                  >
                    <MDTypography variant="h8" color="white">
                      {t("addTruck")}
                    </MDTypography>
                  </Button>
                </MDBox>
                <DataTable
                  table={{ columns, rows: filteredRows }}
                  isSorted={false}
                  entriesPerPage={false}
                  showTotalEntries={false}
                  noEndBorder
                />
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>

      <Dialog open={showForm} onClose={() => setShowForm(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h5" fontWeight="bold">
            {formData._id ? t("editTruck") : t("addTruck")}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            <Step>
              <StepLabel>{t("basicInfo")}</StepLabel>
            </Step>
            <Step>
              <StepLabel>{t("technicalInfo")}</StepLabel>
            </Step>
          </Stepper>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {activeStep === 0 && (
                <Grid item xs={12}>
                  <Card sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      {t("basicInfo")}
                    </Typography>
                    <TextField
                      fullWidth
                      name="truckId"
                      label={t("truckId")}
                      value={formData.truckId}
                      onChange={handleChange}
                      required
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      select
                      name="truckType"
                      label={t("truckType")}
                      value={formData.truckType}
                      onChange={handleChange}
                      required
                      sx={{ mb: 2 }}
                    >
                      {truckTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {t(type)}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      fullWidth
                      name="weight"
                      label={t("weight")}
                      type="number"
                      value={formData.weight}
                      onChange={handleChange}
                      required
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      name="height"
                      label={t("height")}
                      type="number"
                      value={formData.height}
                      onChange={handleChange}
                      required
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      name="width"
                      label={t("width")}
                      type="number"
                      value={formData.width}
                      onChange={handleChange}
                      required
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      name="length"
                      label={t("length")}
                      type="number"
                      value={formData.length}
                      onChange={handleChange}
                      required
                      sx={{ mb: 2 }}
                    />
                  </Card>
                </Grid>
              )}

              {activeStep === 1 && (
                <Grid item xs={12}>
                  <Card sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      {t("technicalInfo")}
                    </Typography>
                    <TextField
                      fullWidth
                      name="axleCount"
                      label={t("axleCount")}
                      type="number"
                      value={formData.axleCount}
                      onChange={handleChange}
                      required
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      select
                      name="fuelType"
                      label={t("fuelType")}
                      value={formData.fuelType}
                      onChange={handleChange}
                      required
                      sx={{ mb: 2 }}
                    >
                      {fuelTypes.map((fuel) => (
                        <MenuItem key={fuel} value={fuel}>
                          {t(fuel)}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      fullWidth
                      name="fuelConsumption"
                      label={t("fuelConsumption")}
                      type="number"
                      value={formData.fuelConsumption}
                      onChange={handleChange}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      name="emissionRate"
                      label={t("emissionRate")}
                      type="number"
                      value={formData.emissionRate}
                      onChange={handleChange}
                      sx={{ mb: 2 }}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="ecoMode"
                          checked={formData.ecoMode}
                          onChange={handleChange}
                        />
                      }
                      label={`${t("ecoMode")} - ${formData.ecoMode ? "Active" : "Inactive"}`}
                      sx={{ mb: 1 }}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="hazardousCargo"
                          checked={formData.hazardousCargo}
                          onChange={handleChange}
                        />
                      }
                      label={`${t("hazardousCargo")} - ${formData.hazardousCargo ? "Active" : "Inactive"}`}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      name="maxAllowedSpeed"
                      label={t("maxAllowedSpeed")}
                      type="number"
                      value={formData.maxAllowedSpeed}
                      onChange={handleChange}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      select
                      name="status"
                      label={t("status")}
                      value={formData.status}
                      onChange={handleChange}
                      required
                      sx={{ mb: 3 }}
                    >
                      {statusOptions.map((status) => (
                        <MenuItem key={status} value={status}>
                          {t(status)}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Card>
                </Grid>
              )}

              <Grid item xs={12} sx={{ mt: 4 }}>
                <MDBox display="flex" justifyContent="space-between" gap={2}>
                  {activeStep === 1 ? (
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      fullWidth
                      disabled={loading}
                      startIcon={loading && <CircularProgress size={20} />}
                    >
                      <MDTypography variant="h8" color="white">
                        {formData._id ? t("update") : t("add")}
                      </MDTypography>
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="contained"
                      color="primary"
                      fullWidth
                      onClick={handleNext}
                    >
                      {t("next")}
                    </Button>
                  )}
                  {activeStep === 1 && (
                    <Button
                      type="button"
                      variant="contained"
                      color="primary"
                      fullWidth
                      onClick={handleBack}
                      sx={{ backgroundColor: "#42a5f5", "&:hover": { backgroundColor: "#2196f3" } }}
                    >
                      {t("back")}
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setShowForm(false);
                      setFormData({
                        truckId: "",
                        truckType: "Tanker",
                        weight: "",
                        height: "",
                        width: "",
                        length: "",
                        axleCount: "",
                        fuelType: "Diesel",
                        fuelConsumption: "",
                        emissionRate: "",
                        ecoMode: false,
                        hazardousCargo: false,
                        maxAllowedSpeed: "",
                        status: "out_of_service",
                        _id: null,
                      });
                      setActiveStep(0);
                    }}
                    variant="outlined"
                    fullWidth
                    sx={{ mt: 0, color: "#d32f2f", borderColor: "#d32f2f", "&:hover": { backgroundColor: "#fddede", borderColor: "#d32f2f" } }}
                  >
                    {t("cancel")}
                  </Button>
                </MDBox>
              </Grid>
            </Grid>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)}>
        <DialogTitle>{t("deleteConfirmTitle")}</DialogTitle>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteId(null)} color="inherit">{t("cancel")}</Button>
          <Button onClick={handleDelete} color="error" variant="contained">{t("delete")}</Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
};

export default VehicleManager;