import UserProfile from "layouts/user-profile";
import UserManagement from "layouts/Super_Admin/user-management";
import Icon from "@mui/material/Icon";
import ProfileCompany from "layouts/company-profil";
import DriverManagement from "layouts/driver-managment";
import VehiculeManagement from "layouts/vehicule_managment";
import TripManagement from "layouts/Super_Admin/trip-management";
import TripManagerManagement from "layouts/trip-management manager";
import CalanderDriver from "layouts/CalanderDriver";
import CongeCalendar from "layouts/CongeManagment";
import CongeCalendarDriver from "layouts/CongeManagmentDriver";
import InfosByUser from "layouts/infos_by_user";
import ChatPage from "layouts/message/ChatPage";
import Dashboard from "layouts/dashboards/SuperAdminDashboard";
import ManagerDashboard from "layouts/dashboards/ManagerDashboard";
import DriverDashboard from "layouts/dashboards/DriverDashboard";
import Map from "./components/Map";
// import DeliveryList from './assets/theme/components/DeliveryList/DeliveryList';
// import MapCanvas from './assets/theme/components/MapCanvas/MapCanvas';

// import Index from "./pages/Index";
export const superAdminRoutes = [
  {
    type: "collapse",
    nameKey: "dashboard",
    key: "dashboard",
    icon: <Icon fontSize="small">bar_chart</Icon>,
    route: "/SuperAdmin/Dashboard",
    component: <Dashboard />,
  },
  {
    type: "collapse",
    nameKey: "companyProfile",
    key: "company-profile",
    icon: <Icon fontSize="small">business</Icon>,
    route: "/SuperAdmin/company-profile",
    component: <ProfileCompany />,
  },
  {
    type: "collapse",
    nameKey: "userProfile",
    key: "user-profile",
    icon: <Icon fontSize="small">person</Icon>,
    route: "/SuperAdmin/user-profile",
    component: <UserProfile />,
  },
  {
    type: "collapse",
    nameKey: "userManagement",
    key: "user-management",
    icon: <Icon fontSize="small">list</Icon>,
    route: "/SuperAdmin/user-management",
    component: <UserManagement />,
  },
  {
    type: "collapse",
    nameKey: "vehiculeManagement",
    key: "vehicule-management",
    icon: <Icon fontSize="small">local_shipping</Icon>,
    route: "/SuperAdmin/vehicule-management",
    component: <VehiculeManagement />,
  },
  {
    type: "collapse",
    nameKey: "tripManagement",
    key: "trip-management",
    icon: <Icon fontSize="small">directions_car</Icon>,
    route: "/SuperAdmin/trip-management",
    component: <TripManagement />,
  },
  {
    type: "collapse",
    nameKey: "chat",
    key: "chat",
    icon: <Icon fontSize="small">chat</Icon>,
    route: "/SuperAdmin/messager",
    component: <ChatPage />,
  },
  {
    nameKey: "infosByUser",
    key: "infosByUser",
    icon: <Icon fontSize="small">calendar_month</Icon>,
    route: "/SuperAdmin/InfosByUser/:name",
    component: <InfosByUser />,
  },
  { type: "collapse",
    nameKey: "Maps",
    key: "map",
    icon: <Icon fontSize="small">travel_explore</Icon>,
    route: "/SuperAdmin/Map",
    component: <Map/>,
  },
]

export const managerRoutes = [
  {
    type: "collapse",
    nameKey: "dashboard",
    key: "dashboard",
    icon: <Icon fontSize="small">bar_chart</Icon>,
    route: "/Manager/Dashboard",
    component: <ManagerDashboard />,
  },
  {
    type: "collapse",
    nameKey: "userProfile",
    key: "user-profile",
    icon: <Icon fontSize="small">person</Icon>,
    route: "Manager/user-profile",
    component: <UserProfile />,
  },
  {
    type: "collapse",
    nameKey: "driverManagement",
    key: "driver-management",
    icon: <Icon fontSize="small">list</Icon>,
    route: "Manager/driver-management",
    component: <DriverManagement />,
  },
  {
    type: "collapse",
    nameKey: "vehiculeManagement",
    key: "vehicule-management",
    icon: <Icon fontSize="small">local_shipping</Icon>,
    route: "Manager/vehicule-management",
    component: <VehiculeManagement />,
  },
  {
    type: "collapse",
    nameKey: "tripManagerManagement",
    key: "tripManager-management",
    icon: <Icon fontSize="small">directions_car</Icon>,
    route: "Manager/tripManager-management",
    component: <TripManagerManagement />,
  },
  {
    type: "collapse",
    nameKey: "leaveCalendar",
    key: "leaveCalendar",
    icon: <Icon fontSize="small">calendar_month</Icon>,
    route: "Manager/conge",
    component: <CongeCalendar />,
  },
  {
    nameKey: "infosByUser",
    key: "infosByUser",
    icon: <Icon fontSize="small">calendar_month</Icon>,
    route: "Manager/InfosByUser/:name",
    component: <InfosByUser />,
  },
  {
    type: "collapse",
    nameKey: "chat",
    key: "chat",
    icon: <Icon fontSize="small">chat</Icon>,
    route: "Manager/messager",
    component: <ChatPage />,
  },
];

export const driverRoutes = [
  {
    type: "collapse",
    nameKey: "dashboard",
    key: "dashboard",
    icon: <Icon fontSize="small">bar_chart</Icon>,
    route: "/Driver/Dashboard",
    component: <DriverDashboard />,
  },
  {
    type: "collapse",
    nameKey: "userProfile",
    key: "user-profile",
    icon: <Icon fontSize="small">person</Icon>,
    route: "Driver/user-profile",
    component: <UserProfile />,
  },
  {
    type: "collapse",
    nameKey: "calendar",
    key: "calendar",
    icon: <Icon fontSize="small">calendar_month</Icon>,
    route: "Driver/calander",
    component: <CalanderDriver />,
  },
  {
    type: "collapse",
    nameKey: "chat",
    key: "chat",
    icon: <Icon fontSize="small">chat</Icon>,
    route: "Driver/messager",
    component: <ChatPage />,
  },
];
