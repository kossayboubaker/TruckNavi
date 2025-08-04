import React, { useEffect, useState } from "react";
import axios from "axios";
import ReportsLineChart from "examples/Charts/LineCharts/ReportsLineChart";
import MDBox from "components/MDBox";

const WeeklyConsumptionCostChart = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  const [loading, setLoading] = useState(true);

  const dayLabels = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get("/statistic/stats/my-weekly-consumption-cost", {
          headers: { Authorization: localStorage.getItem("token") },
        });

        const data = res.data;

        // Trier les données dans l'ordre des jours de la semaine
        const sortedData = dayLabels.map((dayLabel) => {
          const found = data.find((d) => d.day === dayLabel);
          return {
            day: dayLabel,
            totalFuel: found ? parseFloat(found.totalFuel) : 0,
            totalCost: found ? parseFloat(found.totalCost) : 0,
          };
        });

        setChartData({
          labels: sortedData.map((d) => d.day),
          datasets: [
            {
              label: "Consommation (L)",
              data: sortedData.map((d) => d.totalFuel),
              borderColor: "#4CAF50",
              backgroundColor: "rgba(76, 175, 80, 0.2)",
              fill: true,
              tension: 0.4,
              pointRadius: 5,
              pointHoverRadius: 6,
              pointBackgroundColor: "#ffffff",
            },
            {
              label: "Coût (€)",
              data: sortedData.map((d) => d.totalCost),
              borderColor: "#F44336",
              backgroundColor: "rgba(244, 67, 54, 0.2)",
              fill: true,
              tension: 0.4,
              pointRadius: 5,
              pointHoverRadius: 6,
              pointBackgroundColor: "#ffffff",
            },
          ],
        });
      } catch (error) {
        console.error("Erreur récupération consommation/coût hebdomadaire :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <MDBox mb={3}>
      <ReportsLineChart
        color="info"
        title="Consommation & Coût Hebdomadaire de driver "
        description="Par jour sur la semaine en cours"
        date={`Mise à jour: ${new Date().toLocaleDateString()}`}
        chart={chartData}
        isLoading={loading}
      />
    </MDBox>
  );
};

export default WeeklyConsumptionCostChart;
