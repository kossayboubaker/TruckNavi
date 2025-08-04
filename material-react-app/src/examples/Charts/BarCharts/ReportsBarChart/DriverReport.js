import React, { useEffect, useState } from "react";
import axios from "axios";
import ReportsBarChart from "examples/Charts/BarCharts/ReportsBarChart";

function TripsBarChartWeekly() {
  const [chartData, setChartData] = useState({
    labels: [], // jours de la semaine
    datasets: [
      {
        label: "Nombre de trajets",
        data: [],
        backgroundColor: "rgba(255, 255, 255, 0.9)",
      },
    ],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeeklyStats = async () => {
      try {
        const res = await axios.get("/statistic/stats/my-weekly-trips", {
          headers: { Authorization: localStorage.getItem("token") },
        });

        const data = res.data;
        // data = [{ day: "Lun", tripCount: 2 }, ...]

        // Ordre des jours à afficher (déjà dans ta route backend)
        const labels = data.map((item) => item.day);
        const trips = data.map((item) => item.tripCount);

        setChartData({
          labels,
          datasets: [
            {
              label: "Trajets cette semaine",
              data: trips,
              backgroundColor: "rgba(255, 255, 255, 0.9)",
            },
          ],
        });
      } catch (error) {
        console.error("Erreur récupération stats hebdo :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyStats();
  }, []);

  return (
    <ReportsBarChart
      color="info"
      title="Trajets hebdomadaires de driver "
      description="Nombre de trajets par jour cette semaine"
      date={`Mise à jour: ${new Date().toLocaleDateString()}`}
      chart={chartData}
      isLoading={loading} // si ReportsBarChart le gère, sinon ignore
    />
  );
}

export default TripsBarChartWeekly;
