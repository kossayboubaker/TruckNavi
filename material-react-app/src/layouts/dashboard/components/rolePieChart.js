import React, { useEffect, useState, useMemo } from "react";
import PropTypes from "prop-types";
import axios from "axios";

// Chart.js
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

// @mui
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import Icon from "@mui/material/Icon";
import Box from "@mui/material/Box";

// Material Dashboard 2 React
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

ChartJS.register(ArcElement, Tooltip, Legend);

function RolePieChart({
  color = "info",
  title = "Role Distribution",
  description = "Chart showing roles",
  date = "",
}) {
  const [chartData, setChartData] = useState(null);
  const [legendLabels, setLegendLabels] = useState([]);

  useEffect(() => {
    async function fetchRoleStats() {
      try {
        const res = await axios.get("/statistic/stats/users-by-role", {
          headers: { Authorization: localStorage.getItem("token") },
        });

        const data = res.data;
        const labels = [];
        const values = [];
        const backgroundColor = [];
        const legend = [];

        if (data.manager > 0) {
          labels.push("Manager");
          values.push(data.manager);
          backgroundColor.push("rgb(255, 99, 132)");
        }

        if (data.driver > 0) {
          labels.push("Driver");
          values.push(data.driver);
          backgroundColor.push("#A00F72"); // Violet
        }

        if (data.admin > 0) {
          labels.push("Admin");
          values.push(data.admin);
          backgroundColor.push("rgb(54, 162, 235)");
        }

        // Calcul pourcentage
        const total = values.reduce((a, b) => a + b, 0);
        const calculatedLegend = labels.map((label, idx) => ({
          label,
          color: backgroundColor[idx],
          percentage: ((values[idx] / total) * 100).toFixed(1),
        }));

        setLegendLabels(calculatedLegend);

        setChartData({
          labels,
          datasets: [
            {
              label: "Users by Role",
              data: values,
              backgroundColor,
              hoverOffset: 6,
            },
          ],
        });
      } catch (error) {
        console.error("Erreur récupération rôles :", error);
      }
    }

    fetchRoleStats();
  }, []);

  return (
    <Card sx={{ height: "100%" }}>
      <MDBox padding="1rem">
        {useMemo(
          () => (
            <MDBox
              variant="gradient"
              bgColor={color}
              borderRadius="lg"
              coloredShadow={color}
              py={2}
              pr={0.5}
              mt={-5}
              height="12.5rem"
              display="flex"
              justifyContent="center"
              alignItems="center"
            >
              {chartData ? (
                <Pie
                  data={chartData}
                  options={{ responsive: true, plugins: { legend: { display: false } } }}
                />
              ) : (
               null
              )}
            </MDBox>
          ),
          [chartData, color]
        )}

        {/* Légende à l’intérieur du card */}
        <Box display="flex" justifyContent="center" flexWrap="wrap" mt={2} gap={2}>
          {legendLabels.map((item, idx) => (
            <Box key={idx} display="flex" alignItems="center">
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: item.color,
                  mr: 1,
                }}
              />
              <MDTypography variant="caption" color="text">
                {item.label} - {item.percentage}%
              </MDTypography>
            </Box>
          ))}
        </Box>

        <MDBox pt={3} pb={1} px={1}>
          <MDTypography variant="h6" textTransform="capitalize">
            {title}
          </MDTypography>
          <MDTypography component="div" variant="button" color="text" fontWeight="light">
            {description}
          </MDTypography>
          <Divider />
          <MDBox display="flex" alignItems="center">
            <MDTypography variant="button" color="text" lineHeight={1} sx={{ mt: 0.15, mr: 0.5 }}>
              <Icon>schedule</Icon>
            </MDTypography>
            <MDTypography variant="button" color="text" fontWeight="light">
              {date}
            </MDTypography>
          </MDBox>
        </MDBox>
      </MDBox>
    </Card>
  );
}


// PropTypes
RolePieChart.propTypes = {
  color: PropTypes.oneOf(["primary", "secondary", "info", "success", "warning", "error", "dark"]),
  title: PropTypes.string.isRequired,
  description: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  date: PropTypes.string,
};

export default RolePieChart;
