import React, { useEffect, useState } from "react";
import axios from "axios";
import ReportsBarChart from "examples/Charts/BarCharts/ReportsBarChart";

const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function TripsBarChart() {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: "Nombre de trajets",
        data: [],
      },
    ],
  });

  const [loading, setLoading] = useState(true);

 useEffect(() => {
  const fetchStatistics = async () => {
    try {
      const res = await axios.get("/statistic/statistics/trips-consumption");
      console.log("✅ Données reçues :", res.data);

      const labels = res.data.map((item) => {
        const monthLabel = monthNames[item.month - 1] || "Inconnu";
        return `${monthLabel} ${item.year}`;
      });

      const data = res.data.map((item) => item.tripCount);

   setChartData({
  labels,
  datasets: [
    {
      label: "Nombre total de trajets",
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
}, []); // <== très important : tableau vide pour que ça ne tourne qu'une fois

  return (
    <ReportsBarChart
      color="info"
      title="Statistiques des trajets"
      description="Nombre de trajets par mois sur les 10 derniers mois"
      date={`Mis à jour: ${new Date().toLocaleDateString()}`}
      chart={chartData}
    />
  );
}

export default TripsBarChart;
