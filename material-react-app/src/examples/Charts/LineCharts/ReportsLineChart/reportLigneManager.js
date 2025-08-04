import React, { useEffect, useState } from "react";
import axios from "axios";
import MDBox from "components/MDBox";
import ReportsLineChart from "examples/Charts/LineCharts/ReportsLineChart";

const monthNames = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const ConsumptionCostChartManager = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get("/statistic/stats/my-trips-consumption-cost");
        const data = res.data;

        const now = new Date();
        const last10Months = [];

        // Générer les 10 derniers mois (ordre chronologique)
        for (let i = 9; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          last10Months.push({
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            label: `${monthNames[date.getMonth()]} ${date.getFullYear()}`,
          });
        }

        // Aligner les données reçues avec les 10 derniers mois
        const alignedData = last10Months.map(({ year, month, label }) => {
          const found = data.find(item => item._id.year === year && item._id.month === month);
          return {
            label,
            totalConsumption: found ? found.totalConsumption : 0,
            totalCost: found ? found.totalCost : 0,
            totalDistance: found ? found.totalDistance : 0,
            tripCount: found ? found.tripCount : 0,
          };
        });

        // Préparer les datasets pour le graphique
        setChartData({
          labels: alignedData.map(item => item.label),
          datasets: [
            {
              label: "Consommation totale (L)",
              data: alignedData.map(item => item.totalConsumption),
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
              data: alignedData.map(item => item.totalCost),
              borderColor: "#42A5F5",
              backgroundColor: "rgb(255, 3, 3)",
              fill: true,
              tension: 0.4,
              pointRadius: 5,
              pointHoverRadius: 7,
              pointBackgroundColor: "#ffffff",
            },
            // Tu peux aussi ajouter distance ou tripCount si souhaité :
            // {
            //   label: "Distance totale (km)",
            //   data: alignedData.map(item => item.totalDistance),
            //   borderColor: "#FFA726",
            //   backgroundColor: "rgba(255, 167, 38, 0.2)",
            //   fill: true,
            //   tension: 0.4,
            //   pointRadius: 5,
            //   pointHoverRadius: 7,
            //   pointBackgroundColor: "#ffffff",
            // },
          ],
        });
      } catch (error) {
        console.error("Erreur chargement des stats consommation/coût :", error);
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

export default ConsumptionCostChartManager;
