// components/ManagerStatsTable.js
import React, { useEffect, useState } from "react";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Grid from "@mui/material/Grid";
import Select from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import GetAppIcon from "@mui/icons-material/GetApp";
import axios from "axios";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DataTable from "examples/Tables/DataTable";

function  Projects() {
  const [month, setMonth] = useState("current");
  const [data, setData] = useState([]);
  const [menu, setMenu] = useState(null);

  const openMenu = ({ currentTarget }) => setMenu(currentTarget);
  const closeMenu = () => setMenu(null);

  const fetchData = async () => {
    try {
      const res = await axios.get("/statistic/stats/manager-overview", {
        headers: { Authorization: localStorage.getItem("token") },
      });
      setData(res.data);
    } catch (err) {
      console.error("Erreur récupération stats", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month]);

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Manager Stats");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `manager_stats_${month}.xlsx`);
  };

  const columns = [
    { Header: "Manager", accessor: "managerName" },
    { Header: "Email", accessor: "email" },
    { Header: "New Accounts", accessor: "newDriversThisMonth" },
    { Header: "Trips", accessor: "tripsThisMonth" },
    {
      Header: "Performance",
      accessor: "performance",
      Cell: ({ row }) => {
        const acc = row.original.newDriversThisMonth;
        const trips = row.original.tripsThisMonth;
        return acc === 0 || trips === 0 ? (
          <Tooltip title="Faible">
            <Chip label="🔴" color="error" size="small" />
          </Tooltip>
        ) : (
          <Tooltip title="Bonne">
            <Chip label="🟢" color="success" size="small" />
          </Tooltip>
        );
      },
    },
  ];

  const rows = data.map((row) => ({ ...row }));

  return (
    <Card>
      <MDBox display="flex" justifyContent="space-between" alignItems="center" p={3}>
        <MDBox>
          <MDTypography variant="h6" gutterBottom>
            Manager Statistics
          </MDTypography>
          <MDBox display="flex" alignItems="center" lineHeight={0}>
            <Icon
              sx={{
                fontWeight: "bold",
                color: ({ palette: { info } }) => info.main,
                mt: -0.5,
              }}
            >
              insights
            </Icon>
            <MDTypography variant="button" fontWeight="regular" color="text">
              &nbsp;<strong>{data.length}</strong> managers
            </MDTypography>
          </MDBox>
        </MDBox>
        <MDBox display="flex" alignItems="center" gap={2}>
          <FormControl size="small">
            <InputLabel>Mois</InputLabel>
            <Select value={month} label="Mois" onChange={(e) => setMonth(e.target.value)}>
              {[
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
                "current",
              ].map((m) => (
                <MenuItem key={m} value={m}>
                  {m}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            size="small"
            startIcon={<GetAppIcon />}
            onClick={handleExportExcel}
            sx={{ color: 'blue', borderColor: 'blue', '&:hover': { borderColor: 'blue' } }}

          >
            Export Excel
          </Button>
          <Icon sx={{ cursor: "pointer", fontWeight: "bold" }} fontSize="small" onClick={openMenu}>
            more_vert
          </Icon>
        </MDBox>
        <Menu
          id="simple-menu"
          anchorEl={menu}
          anchorOrigin={{ vertical: "top", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          open={Boolean(menu)}
          onClose={closeMenu}
        >
          <MenuItem onClick={closeMenu}>PDF Export (à venir)</MenuItem>
        </Menu>
      </MDBox>
      <MDBox>
        <DataTable
          table={{ columns, rows }}
          showTotalEntries={false}
          isSorted={true}
          noEndBorder
          entriesPerPage={false}
        />
      </MDBox>
    </Card>
  );
}

export default Projects;
