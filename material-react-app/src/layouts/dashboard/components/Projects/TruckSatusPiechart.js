import React, { useEffect, useState, useMemo } from "react";
import PropTypes from "prop-types";
import axios from "axios";

// Chart.js
import { Doughnut } from "react-chartjs-2";
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

function TripStatusPieChart({
  color = "info",
  title = "Répartition des trajets du jour",
  description = "Statistiques des trajets par statut (aujourd'hui)",
  date = "",
}) {
  const [chartData, setChartData] = useState(null);
  const [legendLabels, setLegendLabels] = useState([]);

  useEffect(() => {
    async function fetchTripStatusToday() {
      try {
        const res = await axios.get("/statistic/stats/trips-by-status-today", {
          withCredentials: true,
        });
console.log("🚚 Trip status stats today:", res.data); // <== Ajoute ceci

        const stats = res.data || [];

        const labels = [];
        const values = [];
        const backgroundColor = [];

        const statusColors = {
          pending: "#FFB74D",
          in_progress: "#42A5F5",
          completed: "#66BB6A",
          active: "#AB47BC",
        };

        stats.forEach(({ statusTrip, count }) => {
          if (count > 0) {
            labels.push(statusTrip.replace("_", " ").toUpperCase());
            values.push(count);
            backgroundColor.push(statusColors[statusTrip] || "#BDBDBD");
          }
        });

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
              label: "Trajets par statut",
              data: values,
              backgroundColor,
              borderWidth: 1,
              hoverOffset: 6,
              cutout: "70%", // Doughnut effect
            },
          ],
        });
      } catch (error) {
        console.error("Erreur récupération statuts trajets :", error);
      }
    }

    fetchTripStatusToday();
  }, []);

  return (
   <Card sx={{ height: "100%" }}>
  <MDBox padding="1rem">
    {chartData ? (
      <MDBox
        variant="gradient"
        bgColor={color}
        borderRadius="lg"
        coloredShadow={color}
        py={2}
        pr={0.5}
        mt={-5}
        height="14rem"
        display="flex"
        justifyContent="center"
        alignItems="center"
        position="relative"
      >
        <>
          <Doughnut
            data={chartData}
            options={{ responsive: true, plugins: { legend: { display: false } } }}
          />
          <Box
            position="absolute"
            top="50%"
            left="50%"
            sx={{ transform: "translate(-50%, -50%)" }}
          >
            <Icon sx={{ fontSize: 40, color: "white" }}>local_shipping</Icon>
          </Box>
        </>
      </MDBox>
    ) : (
      <MDBox
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="14rem"
      >
        <MDTypography variant="button" color="text">
          Aucune donnée disponible
        </MDTypography>
      </MDBox>
    )}


        {/* Légende */}
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

TripStatusPieChart.propTypes = {
  color: PropTypes.oneOf(["primary", "secondary", "info", "success", "warning", "error", "dark"]),
  title: PropTypes.string.isRequired,
  description: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  date: PropTypes.string,
};

export default TripStatusPieChart;
