/**
=========================================================
* Material Dashboard 2 React - v2.1.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2022 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

// @mui material components
import Grid from "@mui/material/Grid";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import React, { useState, useEffect } from "react"; // ✅
// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
// import ReportsBarChart from "examples/Charts/BarCharts/ReportsBarChart";
import ReportsLineChart from "examples/Charts/LineCharts/ReportsLineChart";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";
import MDTypography from "components/MDTypography";
import axios from "axios";

// Data
import reportsBarChartData from "layouts/dashboard/data/reportsBarChartData";
import reportsLineChartData from "layouts/dashboard/data/reportsLineChartData";

// Dashboard components
import Projects from "layouts/dashboard/components/Projects";
import OrdersOverview from "layouts/dashboard/components/OrdersOverview";
import RolePieChartSciChart from "layouts/dashboard/components/rolePieChart";
import TripsBarChart from "examples/Charts/BarCharts/ReportsBarChart/report";
import TripStatsChart from "examples/Charts/LineCharts/ReportsLineChart/reportligne";
import TripStatusPieChart from "layouts/dashboard/components/Projects/TruckSatusPiechart";
import TripCostChart from "examples/Charts/LineCharts/GradientLineChart/statiscost";
import FuelCostStatCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard/fullCost";

function Dashboard() {
const { sales, tasks } = reportsLineChartData; // ✅
    const [totalTrucks, setTotalTrucks] = useState(0);
  const [totalTrips, setTotalTrips] = useState(0);
  const [truckStatusCounts, setTruckStatusCounts] = useState({
  in_service: 0,
  out_of_service: 0,
  under_maintenance: 0,
});
useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [truckRes, tripRes, statusRes] = await Promise.all([
          axios.get("/statistic/stats/total-trucks", {
            headers: { Authorization: localStorage.getItem("token") },
          }),
          axios.get("/statistic/stats/total-trips", {
            headers: { Authorization: localStorage.getItem("token") },
          }),
          axios.get("/statistic/camions/status", {
          headers: { Authorization: localStorage.getItem("token") },
        }),
        ]);
         const statusCounts = statusRes.data.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
              }, {});

      setTruckStatusCounts(statusCounts);
        setTotalTrucks(truckRes.data.totalTrucks);
        setTotalTrips(tripRes.data.totalTrips);
      } catch (error) {
        console.error("Erreur lors du chargement des stats :", error);
      }
    };

    fetchCounts();
  }, []);
  return (
    <DashboardLayout>
      {/* <DashboardNavbar /> */}
      <MDBox py={3}>
        <Grid container spacing={3}>
           <Grid item xs={12} md={6} lg={3}>
    <MDBox mb={1.5}>
      <ComplexStatisticsCard
        color="dark"
        icon="local_shipping" // Icône camion
        title="Total Trucks"
        count={totalTrucks}
        percentage={{
          color: "success",
          amount: "",
          label: "Current fleet size",
        }}
      />
    </MDBox>
  </Grid>
  <Grid item xs={12} md={6} lg={3}>
  <MDBox mb={1.5}>
    <ComplexStatisticsCard
      color="success"
      icon="check_circle"
      title=" Truck In Service"
      count={truckStatusCounts.in_service || 0}
      percentage={{
        color: "success",
        amount: "",
        label: "Operational",
      }}
    />
  </MDBox>
</Grid>

<Grid item xs={12} md={6} lg={3}>
  <MDBox mb={1.5}>
    <ComplexStatisticsCard
      color="error"
      icon="block"
      title=" Truck Out of Service"
      count={truckStatusCounts.out_of_service || 0}
      percentage={{
        color: "error",
        amount: "",
        label: "Unavailable",
      }}
    />
  </MDBox>
</Grid>

<Grid item xs={12} md={6} lg={3}>
  <MDBox mb={1.5}>
    <ComplexStatisticsCard
      color="warning"
      icon="build"
      title="Truck Under Maintenance"
      count={truckStatusCounts.under_maintenance || 0}
      percentage={{
        color: "warning",
        amount: "",
        label: "In repair",
      }}
    />
  </MDBox>
</Grid>
           {/* <Grid item xs={12} md={6} lg={3}>
    <MDBox mb={1.5}>
      <ComplexStatisticsCard
        color="info"
        icon="alt_route" // Icône de trajet
        title="Total Trips"
        count={totalTrips}
        percentage={{
          color: "success",
          amount: "",
          label: "Completed routes",
        }}
      />
    </MDBox>
  </Grid> */}
        </Grid>
        <MDBox mt={4.5}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} lg={4}>
              <MDBox mb={3}>
                <TripsBarChart />

              </MDBox>
            </Grid>
           <Grid item xs={12} md={6} lg={4}>
              <MDBox mb={3}>
                <RolePieChartSciChart
                  color="info"
                  title="Users by Role"
                  description="Distribution of Manager vs Driver"
                  date="updated just now"
                />
              </MDBox>
            </Grid>


            <Grid item xs={12} md={6} lg={4}>
              <MDBox mb={3}>
                <TripStatsChart />

              </MDBox>
            </Grid>
          </Grid>
        </MDBox>
        <MDBox>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} lg={8}>
              <Projects />
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <TripStatusPieChart />
              
            </Grid>
             <Grid item xs={12} md={6} lg={4}>
  <FuelCostStatCard/>
            </Grid>
          </Grid>
        </MDBox>
      </MDBox>
      {/* <Footer /> */}
    </DashboardLayout>
  );
}

export default Dashboard;
