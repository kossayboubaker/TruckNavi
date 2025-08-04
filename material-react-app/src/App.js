import { useState, useEffect, useMemo, useContext, useRef } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Helmet } from "react-helmet";
import { toast } from "react-toastify";

import rtlPlugin from "stylis-plugin-rtl";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";

import { superAdminRoutes, managerRoutes, driverRoutes } from "routes";
import { useMaterialUIController, setMiniSidenav } from "context";
import { setupAxiosInterceptors } from "./services/interceptor";

import Sidenav from "examples/Sidenav";
import Configurator from "examples/Configurator";
import ProtectedRoute from "examples/ProtectedRoute";

import Login from "auth/login";
import Register from "auth/register";
import ForgotPassword from "auth/forgot-password";
import ResetPassword from "auth/reset-password";
import GoogleCallback from "auth/login/GoogleCallback";

import UserProfile from "layouts/user-profile";
import ProfileCompany from "layouts/company-profil";
import UpdateProfile from "layouts/user-profile/index";
import SuperAdminDashboard from "layouts/dashboards/SuperAdminDashboard";
import ManagerDashboard from "layouts/dashboards/ManagerDashboard";
import DriverDashboard from "layouts/dashboards/DriverDashboard";

import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import ChatbotWidget from "layouts/Chatbot/chatbot";

import { AuthContext } from "context";

import theme from "assets/theme";
import themeRTL from "assets/theme/theme-rtl";
import themeDark from "assets/theme-dark";
import themeDarkRTL from "assets/theme-dark/theme-rtl";

const getRoleBasedRoutes = (role, disabled = false) => {
  switch (role) {
    case "super_admin":
      return superAdminRoutes.map((route) =>
        route.key === "user-profile" || route.key === "company-profile"
          ? { ...route, disabled: false }
          : { ...route, disabled }
      );
    case "manager":
      return managerRoutes.map((route) =>
        route.key === "user-profile"
          ? { ...route, disabled: false }
          : { ...route, disabled }
      );
    case "driver":
      return driverRoutes.map((route) =>
        route.key === "user-profile"
          ? { ...route, disabled: false }
          : { ...route, disabled }
      );
    default:
      return [];
  }
};

export default function App() {
  const [companyInfo, setCompanyInfo] = useState(null);
  const [userRoutes, setUserRoutes] = useState([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [rtlCache, setRtlCache] = useState(null);
  const [isDemo, setIsDemo] = useState(false);

  const { pathname } = useLocation();
  const navigate = useNavigate();

  const authContext = useContext(AuthContext);
  const { setUser, setIsAuthenticated, isAuthenticated } = authContext;

  const [controller, dispatch] = useMaterialUIController();
  const {
    direction,
    layout,
    sidenavColor,
    transparentSidenav,
    whiteSidenav,
    darkMode,
  } = controller;

  const alertsShownRef = useRef({ profile: false, company: false, password: false });

  useEffect(() => {
      console.log("Début vérification de l'utilisateur");

    fetch("http://localhost:8080/user/auto-login", { credentials: "include" })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Not authenticated");
      })
      .then((data) => {
        const { user, company, mustChangePassword, profileIncomplete, companyIncomplete } = data;
        setUser(user);
        setIsAuthenticated(true);
        setCompanyInfo(company);

        if (user.role === "super_admin") {
          const disabled = profileIncomplete || companyIncomplete;
          setUserRoutes(getRoleBasedRoutes(user.role, disabled));
          if (profileIncomplete && !alertsShownRef.current.profile) {
            toast.warn("Veuillez compléter votre profil utilisateur pour accéder au tableau de bord.");
            alertsShownRef.current.profile = true;
          }
          if (companyIncomplete && !alertsShownRef.current.company) {
            toast.warn("Veuillez compléter le profil de votre entreprise pour accéder au tableau de bord.");
            alertsShownRef.current.company = true;
          }
          if (profileIncomplete) navigate("/SuperAdmin/user-profile");
          else if (companyIncomplete) navigate("/SuperAdmin/company-profile");
        } else if (user.role === "manager" || user.role === "driver") {
          const disabled = mustChangePassword || profileIncomplete;
          setUserRoutes(getRoleBasedRoutes(user.role, disabled));
          if (profileIncomplete && !alertsShownRef.current.profile) {
            toast.warn("Veuillez compléter votre profil utilisateur.");
            alertsShownRef.current.profile = true;
          }
          if (mustChangePassword && !alertsShownRef.current.password) {
            toast.warn("Veuillez mettre à jour votre mot de passe pour accéder au tableau de bord.");
            alertsShownRef.current.password = true;
          }
          if (mustChangePassword || profileIncomplete) navigate("/update-profile");
        }

        setLoadingRoutes(false);
      })
      .catch(() => {
        const path = window.location.pathname;
        const isPublic = ["/auth/reset-password", "/auth/register", "/auth/forgot-password"].some((p) => path.startsWith(p));
        setUser(null);
        setUserRoutes([]);
        setIsAuthenticated(false);
        setLoadingRoutes(false);
        if (!isPublic) navigate("/auth/login");
      });
  }, [setUser, setIsAuthenticated, navigate]);

  useEffect(() => {
    setIsDemo(process.env.REACT_APP_IS_DEMO === "true");
  }, []);

  useMemo(() => {
    const cacheRtl = createCache({ key: "rtl", stylisPlugins: [rtlPlugin] });
    setRtlCache(cacheRtl);
  }, []);

  useEffect(() => {
    document.body.setAttribute("dir", direction);
  }, [direction]);

  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
  }, [pathname]);

  setupAxiosInterceptors(() => {
    authContext.logout();
    navigate("/auth/login");
  });

  const getRoutes = (allRoutes) =>
    allRoutes.flatMap((route) =>
      route.collapse ? getRoutes(route.collapse) : route.route && route.type !== "auth"
        ? [<Route exact path={route.route} element={<ProtectedRoute isAuthenticated={isAuthenticated}>{route.component}</ProtectedRoute>} key={route.key} />]
        : []
    );

  const renderRoutes = loadingRoutes ? <div></div> : (
    <Routes>
      <Route path="/auth/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/auth/register" element={<Register />} />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/reset-password" element={<ResetPassword />} />
      <Route path="/auth/google/callback" element={<GoogleCallback />} />
      <Route path="/user-profile" element={<ProtectedRoute isAuthenticated={isAuthenticated}><UserProfile /></ProtectedRoute>} />
      <Route path="/company-profile" element={<ProtectedRoute isAuthenticated={isAuthenticated}><ProfileCompany /></ProtectedRoute>} />
      <Route path="/update-profile" element={<ProtectedRoute isAuthenticated={isAuthenticated}><UpdateProfile /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Navigate to={authContext.user?.role === "super_admin" ? "/dashboard/superadmin" : authContext.user?.role === "manager" ? "/dashboard/manager" : "/dashboard/driver"} /></ProtectedRoute>} />
      <Route path="/dashboard/superadmin" element={<ProtectedRoute isAuthenticated={isAuthenticated}><SuperAdminDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/manager" element={<ProtectedRoute isAuthenticated={isAuthenticated}><ManagerDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/driver" element={<ProtectedRoute isAuthenticated={isAuthenticated}><DriverDashboard /></ProtectedRoute>} />
      {getRoutes(userRoutes)}
      <Route path="*" element={<Navigate to="/auth/login" />} />
    </Routes>
  );
const publicPaths = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
];
const isMapRoute = pathname === "/SuperAdmin/Map";
const isPublicPath = publicPaths.includes(pathname);

const AppContent = (
  <>
    {!isMapRoute && !isPublicPath && layout === "dashboard" && !loadingRoutes && <DashboardNavbar />}
    {!isMapRoute && !isPublicPath && layout === "dashboard" && !loadingRoutes && (
      <Sidenav
        color={sidenavColor}
        brand={
          companyInfo?.image_campany
            ? `http://localhost:8080/uploads/${companyInfo.image_campany}`
            : null
        }
        brandName={companyInfo?.company_name || ""}
        routes={userRoutes}
        onMouseEnter={() => setMiniSidenav(dispatch, false)}
        onMouseLeave={() => setMiniSidenav(dispatch, true)}
      />
    )}
    {!isMapRoute && !isPublicPath && layout === "dashboard" && !loadingRoutes && <Configurator />}

    <main
      style={{
        marginTop: isMapRoute ? "0px" : "80px",
        paddingBottom: isMapRoute ? "0px" : "80px",
        paddingInline: isMapRoute ? "0px" : "1rem",
      }}
    >
      {renderRoutes}
    </main>

    {!isMapRoute && !isPublicPath && layout === "dashboard" && !loadingRoutes && <Footer />}

    {isAuthenticated && !isPublicPath && !isMapRoute && (
      <ChatbotWidget user={authContext.user} />
    )}
  </>
);


  return (
    <>
      {isDemo && <Helmet>{/* Meta demo si nécessaire */}</Helmet>}
      {direction === "rtl" ? (
        <CacheProvider value={rtlCache}>
          <ThemeProvider theme={darkMode ? themeDarkRTL : themeRTL}>
            <CssBaseline />
            {AppContent}
          </ThemeProvider>
        </CacheProvider>
      ) : (
        <ThemeProvider theme={darkMode ? themeDark : theme}>
          <CssBaseline />
          {AppContent}
        </ThemeProvider>
      )}
    </>
  );
}
