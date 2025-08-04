import React, { useEffect, useState } from "react";
import axios from "axios";
import GradientLineChart from "examples/Charts/LineCharts/GradientLineChart";

function TripCostChart() {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    async function fetchTripCostStats() {
      try {
        const res = await axios.get("/statistic/stats/trip-cost-per-month", {
          withCredentials: true,
        });

        const stats = res.data;

        // Tri par année/mois
        stats.sort((a, b) => {
          const dateA = new Date(a._id.year, a._id.month - 1);
          const dateB = new Date(b._id.year, b._id.month - 1);
          return dateA - dateB;
        });

        // Labels mois/année
        const labels = stats.map(
          (item) => `${item._id.month.toString().padStart(2, "0")}/${item._id.year}`
        );

        const data = stats.map((item) => parseFloat(item.totalCost.toFixed(2)));

        setChartData({
          labels,
          datasets: [
            {
              label: "Coût total des trajets (TND)",
              data,
              color: "success", // ou autre couleur
            },
          ],
        });
      } catch (err) {
        console.error("Erreur récupération coût des trajets :", err);
      }
    }

    fetchTripCostStats();
  }, []);

  return (
    <GradientLineChart
      icon={{ color: "success", component: "local_gas_station" }}
      title="Coût des trajets par mois"
      description="Total estimé en fonction de la distance et de la consommation"
      chart={chartData}
    />
  );
}

export default TripCostChart;
