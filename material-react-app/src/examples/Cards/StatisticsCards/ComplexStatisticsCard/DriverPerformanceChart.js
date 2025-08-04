import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

const DriverPerformanceChart = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchDriverStats = async () => {
      try {
        const res = await axios.get("/stats/driver-performance-per-month", {
          headers: { Authorization: localStorage.getItem("token") },
        });

        const rawData = res.data;

        // Récupérer les 10 derniers mois triés
        const now = new Date();
        const last10Months = [];
        for (let i = 9; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          last10Months.push({
            key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
            label: `${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`,
          });
        }

        // Organiser les données par chauffeur
        const groupedByMonth = {};

        rawData.forEach((entry) => {
          const key = `${entry._id.year}-${String(entry._id.month).padStart(2, "0")}`;
          if (!groupedByMonth[key]) {
            groupedByMonth[key] = { month: key };
          }
          groupedByMonth[key][entry._id.driverName] = entry.totalDistance.toFixed(2);
        });

        // Format pour Recharts
        const chartFormatted = last10Months.map((monthObj) => ({
          month: monthObj.label,
          ...(groupedByMonth[monthObj.key] || {}),
        }));

        setData(chartFormatted);
      } catch (error) {
        console.error("Erreur chargement stats des chauffeurs :", error);
      }
    };

    fetchDriverStats();
  }, []);

  return (
    <MDBox p={3} bgColor="white" borderRadius="lg" shadow="sm">
      <MDTypography variant="h6" gutterBottom>
        Performance mensuelle des chauffeurs (distance)
      </MDTypography>
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis unit=" km" />
          <Tooltip />
          <Legend />
          {data.length > 0 &&
            Object.keys(data[0])
              .filter((key) => key !== "month")
              .map((driver, index) => (
                <Area
                  key={driver}
                  type="monotone"
                  dataKey={driver}
                  stackId="1"
                  stroke={`hsl(${(index * 70) % 360}, 70%, 50%)`}
                  fill={`hsl(${(index * 70) % 360}, 70%, 60%)`}
                />
              ))}
        </AreaChart>
      </ResponsiveContainer>
    </MDBox>
  );
};

export default DriverPerformanceChart;
