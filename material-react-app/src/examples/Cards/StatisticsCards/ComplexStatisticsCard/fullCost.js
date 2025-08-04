import React, { useEffect, useState } from "react";
import axios from "axios";
import MDBox from "components/MDBox";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";

const FuelCostStatCard = () => {
  const [currentMonthCost, setCurrentMonthCost] = useState(0);

  useEffect(() => {
    const fetchCost = async () => {
      try {
        const res = await axios.get("statistic/stats/trip-cost-per-month", {
          headers: { Authorization: localStorage.getItem("token") },
        });

        const data = res.data;
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        const currentMonthData = data.find(
          (item) =>
            item._id.year === currentYear && item._id.month === currentMonth
        );

        setCurrentMonthCost(
          currentMonthData ? currentMonthData.totalCost.toFixed(2) : 0
        );
      } catch (error) {
        console.error("Erreur récupération du coût carburant :", error);
      }
    };

    fetchCost();
  }, []);

  return (
    <MDBox mb={1.5}>
      <ComplexStatisticsCard
        color="warning"
        icon="local_gas_station"
        title="Carburant ce mois"
        count={`${currentMonthCost} €`}
        percentage={{
          color: "success",
          amount: "",
          label: "Dépenses carburant",
        }}
      />
    </MDBox>
  );
};

export default FuelCostStatCard;
