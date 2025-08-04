// components/DriverPerformanceStats.js
import React, { useEffect, useState } from "react";
import {
  Card,
  Grid,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Icon,
  Tooltip,
} from "@mui/material";
import GetAppIcon from "@mui/icons-material/GetApp";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import axios from "axios";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DataTable from "examples/Tables/DataTable";

const DriverPerformanceStats = () => {
  const [data, setData] = useState([]);
  const [selectedYear, setSelectedYear] = useState("all");

  const fetchData = async () => {
    try {
      const res = await axios.get("/statistic/stats/driver-performance-per-month", {
        headers: {
          Authorization: localStorage.getItem("token"),
        },
      });
      setData(res.data);
    } catch (err) {
      console.error("Erreur récupération stats chauffeurs:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DriverStats");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `driver_stats.xlsx`);
  };

  const columns = [
    { Header: "Nom du Chauffeur", accessor: "_id.driverName" },
    { Header: "Année", accessor: "_id.year" },
    { Header: "Mois", accessor: "_id.month" },
    { Header: "Nombre de trajets", accessor: "tripCount" },
    { Header: "Distance totale (km)", accessor: "totalDistance" },
    { Header: "Consommation estimée (L)", accessor: "totalConsumption" },
  ];

  const filteredData =
    selectedYear === "all"
      ? data
      : data.filter((item) => item._id.year === parseInt(selectedYear));

  const years = [...new Set(data.map((item) => item._id.year))];

  return (
    <Card>
      <MDBox p={3} display="flex" justifyContent="space-between" alignItems="center">
        <MDBox>
          <MDTypography variant="h6">Performance mensuelle des chauffeurs</MDTypography>
          <MDTypography variant="body2" color="text.secondary">
            Nombre total de chauffeurs : {filteredData.length}
          </MDTypography>
        </MDBox>

        <MDBox display="flex" gap={2} alignItems="center">
          <FormControl size="small">
            <InputLabel>Année</InputLabel>
            <Select
              value={selectedYear}
              label="Année"
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <MenuItem value="all">Toutes</MenuItem>
              {years.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            size="small"
            startIcon={<GetAppIcon />}
            onClick={handleExportExcel}
            sx={{ color: "blue", borderColor: "blue", "&:hover": { borderColor: "blue" } }}
          >
            Export Excel
          </Button>
        </MDBox>
      </MDBox>

      <MDBox>
        <DataTable
          table={{ columns, rows: filteredData }}
          showTotalEntries={false}
          isSorted={true}
          noEndBorder
          entriesPerPage={false}
        />
      </MDBox>
    </Card>
  );
};

export default DriverPerformanceStats;
