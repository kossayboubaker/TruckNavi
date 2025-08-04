import React, { useEffect, useState } from "react";
import axios from "axios";
import ReportsBarChart from "examples/Charts/BarCharts/ReportsBarChart";

const monthNames = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function TripsBarChartManager() {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: "Nombre de trajets",
        data: [],
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        pointBackgroundColor: "#ffffff",
      },
    ],
  });


  const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchStatistics = async () => {
    try {
      const res = await axios.get("/statistic/stats/my-trips-per-month");
      console.log("✅ Données reçues :", res.data);

      const sortedData = res.data.sort((a, b) => {
        if (a._id.year === b._id.year) {
          return a._id.month - b._id.month;
        }
        return a._id.year - b._id.year;
      });

      console.log("📦 sortedData:", sortedData);

      const now = new Date();
      const last10Months = [];
      for (let i = 9; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        last10Months.push({
          year: date.getFullYear(),
          month: date.getMonth() + 1,
        });
      }

      console.log("🗓️ last10Months:", last10Months);

      const completedData = last10Months.map(({ year, month }) => {
        const found = sortedData.find(
          item => item._id.year === year && item._id.month === month
        );
        return {
          year,
          month,
          tripCount: found ? found.tripCount : 0,
        };
      });

      console.log("✅ completedData:", completedData);

      const labels = completedData.map(item => {
        const monthLabel = monthNames[item.month - 1] || "Inconnu";
        return `${monthLabel} ${item.year}`;
      });

      const data = completedData.map(item => item.tripCount);

      console.log("🏷️ labels:", labels);
      console.log("📊 data:", data);

      setChartData({
  labels,
  datasets: [
    {
      label: "Trajets du manager",
      data,
      backgroundColor: "rgba(255, 255, 255, 0.9)", // blanc si le fond est foncé
    },
  ],
});

   

    } catch (err) {
      console.error("Erreur lors du chargement des statistiques :", err);
    } finally {
      setLoading(false);
    }
  };

  fetchStatistics();
}, []);
   useEffect(() => {
  console.log("📊 Chart Data (mise à jour) :", chartData);
}, [chartData]);

  return (
    <ReportsBarChart
      color="info"
      title="Statistiques des trajets pour le manager"
      description="Nombre de trajets par mois sur les 10 derniers mois"
      date={`Mis à jour: ${new Date().toLocaleDateString()}`}
      chart={chartData}
      isLoading={loading} // si ton composant le supporte, sinon ignore
    />
  );
}

export default TripsBarChartManager;
