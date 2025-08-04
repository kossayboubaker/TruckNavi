import React, { useEffect, useState } from "react";
import axios from "axios";
import MDBox from "components/MDBox";
import ReportsLineChart from "examples/Charts/LineCharts/ReportsLineChart";

const monthNames = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const ConsumptionAndCostChart = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // On récupère les deux séries de données en parallèle
        const [consumptionRes, costRes] = await Promise.all([
          axios.get("/statistic/statistics/trips-consumption"),
          axios.get("/statistic/stats/trip-cost-per-month"),
        ]);

        const consumptionData = consumptionRes.data;
        const costData = costRes.data;

        const now = new Date();
        const last10Months = [];

        for (let i = 9; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          last10Months.push({
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            label: `${monthNames[date.getMonth()]} ${date.getFullYear()}`,
          });
        }

        // Aligner consommation
        const alignedConsumption = last10Months.map(({ year, month }) => {
          const found = consumptionData.find(
            (item) => item.year === year && item.month === month
          );
          return found ? found.totalConsumption : 0;
        });

        // Aligner coût
        const alignedCost = last10Months.map(({ year, month }) => {
          const found = costData.find(
            (item) => item._id.year === year && item._id.month === month
          );
          return found ? found.totalCost : 0;
        });

        setChartData({
          labels: last10Months.map((item) => item.label),
          datasets: [
            {
              label: "Consommation totale (L)",
              data: alignedConsumption,
              borderColor: "#66BB6A",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
              fill: true,
              tension: 0.4,
              pointRadius: 5,
              pointHoverRadius: 7,
              pointBackgroundColor: "#ffffff",
            },
            {
              label: "Coût total (€)",
              data: alignedCost,
              borderColor: "#42A5F5",
              backgroundColor: "rgb(255, 3, 3)",
              fill: true,
              tension: 0.4,
              pointRadius: 5,
              pointHoverRadius: 7,
              pointBackgroundColor: "#ffffff",
            },
          ],
        });
      } catch (error) {
        console.error("Erreur lors du chargement des statistiques :", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <MDBox mb={3}>
      <ReportsLineChart
        color="success"
        title="Consommation et coût total"
        description="Consommation et coût mensuels des trajets (10 derniers mois)"
        date={`Mise à jour: ${new Date().toLocaleDateString()}`}
        chart={chartData}
      />
    </MDBox>
  );
};

export default ConsumptionAndCostChart;
