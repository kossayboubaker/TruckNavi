import React, { useEffect, useState } from "react";
import axios from "axios";
import MDBox from "components/MDBox";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";

const FuelCostStatCardManager = () => {
  const [currentMonthCost, setCurrentMonthCost] = useState(0);

  useEffect(() => {
    const fetchManagerFuelCost = async () => {
      try {
        const res = await axios.get("statistic/stats/my-trips-consumption-cost", {
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
        console.error("Erreur récupération coût manager :", error);
      }
    };

    fetchManagerFuelCost();
  }, []);

  return (
    <MDBox mb={1.5}>
      <ComplexStatisticsCard
        color="info"
        icon="local_gas_station"
        title="Coût carburant (Manager)"
        count={`${currentMonthCost} €`}
        percentage={{
          color: "success",
          amount: "",
          label: "Trajets personnels ce mois",
        }}
      />
    </MDBox>
  );
};

export default FuelCostStatCardManager;
