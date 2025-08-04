import { useState, useEffect, useContext } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import {
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  Icon,
  Badge,
} from "@mui/material";
import { toast } from "react-toastify";

import MDBox from "components/MDBox";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import Breadcrumbs from "examples/Breadcrumbs";
import NotificationItem from "examples/Items/NotificationItem";

import axios from "axios";
import Avatar from "@mui/material/Avatar"; 

import {
  navbar,
  navbarContainer,
  navbarRow,
  navbarIconButton,
  navbarMobileMenu,
} from "examples/Navbars/DashboardNavbar/styles";

import {
  useMaterialUIController,
  setTransparentNavbar,
  setMiniSidenav,
  setOpenConfigurator,
} from "context";

import { AuthContext } from "context";
import { useSocket } from "context/SocketContext/SocketContext";
import AuthService from "services/auth-service";
import "./style.css";
import i18n from "i18next";
import { useTranslation } from "react-i18next";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";

function DashboardNavbar({ absolute = false, light = false, isMini = false }) {
  const { t } = useTranslation();

  const socket = useSocket();
  const authContext = useContext(AuthContext);
  const user = authContext.user;
  const [navbarType, setNavbarType] = useState();
  const [controller, dispatch] = useMaterialUIController();
  const { miniSidenav, transparentNavbar, fixedNavbar, openConfigurator, darkMode } = controller;

  const [openMenu, setOpenMenu] = useState(false);
  const [langAnchorEl, setLangAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [popupNotif, setPopupNotif] = useState(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const unseenCount = notifications.filter(n => !n.seen).length;
  const route = useLocation().pathname.split("/").slice(1);
  const navigate = useNavigate();
const handleLanguageMenuOpen = (event) => {
  setLangAnchorEl(event.currentTarget);
};

const handleLanguageMenuClose = () => {
  setLangAnchorEl(null);
};

const changeLanguage = (lng) => {
  i18n.changeLanguage(lng);
  handleLanguageMenuClose();
};

  useEffect(() => {
    setNavbarType(fixedNavbar ? "sticky" : "static");


    const handleTransparentNavbar = () => {
      setTransparentNavbar(dispatch, (fixedNavbar && window.scrollY === 0) || !fixedNavbar);
    };

    window.addEventListener("scroll", handleTransparentNavbar);
    handleTransparentNavbar();

    return () => window.removeEventListener("scroll", handleTransparentNavbar);
  }, [dispatch, fixedNavbar]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("http://localhost:8080/user/notifications", {
          credentials: "include",
        });
        const data = await res.json();
        setNotifications(data);
      } catch (err) {
        console.error("Erreur lors du chargement des notifications", err);
      }
    };

    fetchNotifications();
  }, []);

  useEffect(() => {
    if (!socket || !user?._id) return;

    const notifHandler = (notif) => {
      if (notif.recipient === user._id) {
        setNotifications((prev) => [notif, ...prev]);
        setPopupNotif(notif);
        setPopupVisible(true);
        setTimeout(() => setPopupVisible(false), 4500);
        setTimeout(() => setPopupNotif(null), 5000);
      }
    };

    socket.on("leave_request", notifHandler);
    socket.on("new_notification", notifHandler);
    socket.on("driver_assignment", notifHandler);

    return () => {
      socket.off("new_notification", notifHandler);
      socket.off("driver_assignment", notifHandler);
      socket.off("leave_request", notifHandler);
    };
  }, [socket, user]);

  const markAsSeen = async (notifId) => {
    try {
      await axios.put(`http://localhost:8080/user/notifications/${notifId}/seen`, {}, {
        withCredentials: true,
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === notifId ? { ...n, seen: true } : n))

      );
    } catch (err) {
      console.error("Erreur lors de la mise à jour de la notification :", err);
    }
  };

  const deleteNotification = async (notifId) => {
    try {
      await axios.delete(`http://localhost:8080/user/notifications/${notifId}`, {
        withCredentials: true,
      });
      setNotifications((prev) => prev.filter((n) => n._id !== notifId));
          // deleteNotification(notifId);  // supprime après succès

    } catch (error) {
      console.error("Erreur lors de la suppression de la notification :", error);
    }
  };

  const handleMiniSidenav = () => setMiniSidenav(dispatch, !miniSidenav);
  const handleConfiguratorOpen = () => setOpenConfigurator(dispatch, !openConfigurator);

  const handleOpenMenu = (event) => {
    setOpenMenu(event.currentTarget);
    notifications.forEach((n) => {
      if (!n.seen) markAsSeen(n._id);
    });
  };
  const handleCloseMenu = () => setOpenMenu(false);

  const handleLogOut = async () => {
    await AuthService.logout();
    authContext.logout();
    navigate("/auth/login");
  };

  const handleTripDecision = async (tripId, action, notifId) => {
    try {
      await axios.get(`http://localhost:8080/trip/validation/${tripId}?action=${action}`, {
        withCredentials: true,
      });
toast.success(t(action === "accept" ? "tripAccepted" : "tripRejected"));
      deleteNotification(notifId);
    } catch (err) {
      toast.error(t("tripError"));
    }
  };

  const handleAccept = async (token, notifId) => {
    try {
      await axios.get(`http://localhost:8080/user/validate-driver/${token}/accept`, {
        withCredentials: true,
      });
      toast.success(t("driverAccepted"));
      deleteNotification(notifId);
    } catch (error) {
      toast.error("Erreur lors de l'acceptation.");
    }
  };

  const handleRefuse = async (token, notifId) => {
    try {
      await axios.get(`http://localhost:8080/user/validate-driver/${token}/refuse`, {
        withCredentials: true,
      });
      toast.info(t("driverRejected"));
      deleteNotification(notifId);
    } catch (error) {
      toast.error("Erreur lors du refus.");
    }
  };

  const handleAcceptLeaveRequest = async (token, notifId) => {
    try {
      await axios.get(`http://localhost:8080/conge/validate/${token}/accept`, {
        withCredentials: true,
      });
      toast.success(t("leaveAccepted"));
      deleteNotification(notifId);
    } catch (error) {
      toast.error(t("leaveError"));
    }
  };

  const handleRefuseLeaveRequest = async (token, notifId) => {
    try {
      await axios.get(`http://localhost:8080/conge/validate/${token}/reject`, {
        withCredentials: true,
      });
      toast.info(t("leaveRejected"));
      deleteNotification(notifId);
    } catch (error) {
      toast.error(t("leaveError"));
    }
  };

  const renderMenu = () => (
    <Menu anchorEl={openMenu} open={Boolean(openMenu)} onClose={handleCloseMenu} sx={{ mt: 2 }}>
      {notifications.length === 0 ? (
        <NotificationItem icon={<Icon>info</Icon>} title={t("noNotification")}  />
      ) : (
        notifications.map((notif) => (
          <div key={notif._id} style={{
            padding: "12px",
            maxWidth: "340px",
            wordBreak: "break-word",
            whiteSpace: "normal",
            fontWeight: notif.seen ? "normal" : "500",
            fontSize: "0.875rem",
            color: "#333",
            fontFamily: "Arial, sans-serif",
            textTransform: "none",
            borderBottom: "1px solid #e0e0e0",
          }}>
            <NotificationItem
              icon={<Icon>notifications</Icon>}
              title={<span dangerouslySetInnerHTML={{ __html: notif.message }} />}
              date={new Date(notif.createdAt).toLocaleString()}
            />

            {notif.type === "account_validation" && notif.token && (
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
                <MDButton size="small" color="success" onClick={() => handleAccept(notif.token, notif._id)}>✅ {t("accept")}</MDButton>
                <MDButton size="small" color="error" onClick={() => handleRefuse(notif.token, notif._id)}>❌ {t("reject")}</MDButton>
              </div>
            )}

            {notif.type === "driver_assignment" && user?.role === "super_admin" && (
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
                <MDButton size="small" color="success" onClick={() => handleTripDecision(notif.relatedEntity, "accept", notif._id)}>✅ {t("accept")}</MDButton>
                <MDButton size="small" color="error" onClick={() => handleTripDecision(notif.relatedEntity, "refuse", notif._id)}>❌ {t("reject")}</MDButton>
              </div>
            )}

            {notif.type === "leave_request" && notif.token && (
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
                <MDButton size="small" color="success" onClick={() => handleAcceptLeaveRequest(notif.token, notif._id)}>✅ {t("accept")}</MDButton>
                <MDButton size="small" color="error" onClick={() => handleRefuseLeaveRequest(notif.token, notif._id)}>❌ {t("reject")}</MDButton>
              </div>
            )}
          </div>
        ))
      )}
    </Menu>
  );

  const iconsStyle = ({ palette: { dark, white, text }, functions: { rgba } }) => ({
    color: () => {
      let colorValue = light || darkMode ? white.main : dark.main;
      if (transparentNavbar && !light) {
        colorValue = darkMode ? rgba(text.main, 0.6) : text.main;
      }
      return colorValue;
    },
  });

  return (
    <DashboardLayout>
    <AppBar
      position={absolute ? "absolute" : navbarType}
      color="inherit"
      sx={(theme) => navbar(theme, { transparentNavbar, absolute, light, darkMode })}
    >
      <Toolbar sx={(theme) => navbarContainer(theme)}>
        <MDBox color="inherit" mb={{ xs: 1, md: 0 }} sx={(theme) => navbarRow(theme, { isMini })}>
        <Breadcrumbs
  icon="home"
  title={(route[route.length - 1] ?? "Dashboard").toString()}
  route={route}
  light={light}
/>

        </MDBox>

        {!isMini && (
          <MDBox sx={(theme) => navbarRow(theme, { isMini })}>
            <MDBox pr={1}><MDInput label={t("searchHere")} /></MDBox>

            <MDBox display="flex" alignItems="center" color={light ? "white" : "inherit"}>
              {/* <Link to="/authentication/sign-in/basic">
                <IconButton sx={navbarIconButton} size="small" disableRipple>
                  <Icon sx={iconsStyle}>account_circle</Icon>
                </IconButton>
              </Link> */}

                            {user ? (
  user.image ? (
    <Avatar
      src={`http://localhost:8080/uploads/${user.image}`}
      alt={`${user.FirstName} ${user.LastName}`}
      sx={{ width: 32, height: 32, ml: 1, cursor: "pointer", border: "2px solid white" }}
      onClick={() => navigate("/profile")}
    />
  ) : (
    <Icon
      sx={{ fontSize: 32, ml: 1, cursor: "pointer", color: light || darkMode ? "#fff" : "inherit" }}
      onClick={() => navigate("/profile")}
    >
      account_circle
    </Icon>
  )
) : null}

              {/* <IconButton size="small" disableRipple sx={navbarIconButton} onClick={handleConfiguratorOpen}>
                <Icon sx={iconsStyle}>settings</Icon>
              </IconButton> */}

                  <IconButton
                    size="small"
                    disableRipple
                    sx={navbarIconButton}
                    onClick={handleLanguageMenuOpen}
                  >
                    <Icon sx={iconsStyle}>language</Icon>
                  </IconButton>


                  <IconButton size="small" disableRipple sx={navbarIconButton} onClick={handleOpenMenu}>
                    <Badge badgeContent={unseenCount > 9 ? "9+" : unseenCount} color="error">
                      <Icon sx={iconsStyle}>notifications</Icon>
                    </Badge>
                  </IconButton>

                  


              {renderMenu()}
     <Menu
  anchorEl={langAnchorEl}
  open={Boolean(langAnchorEl)}
  onClose={handleLanguageMenuClose}
  sx={{ mt: 2 }}
>
  <NotificationItem
    icon={<Icon>flag</Icon>}
    title={t("french")}
    onClick={() => changeLanguage("fr")}
  />
  <NotificationItem
    icon={<Icon>flag</Icon>}
    title={t("english")}
    onClick={() => changeLanguage("en")}
  />
</Menu>

              <MDBox>
                <MDButton variant="gradient" color="info" onClick={handleLogOut}>
  {t("logout")}
                </MDButton>
              </MDBox>
            </MDBox>
          </MDBox>
        )}
      </Toolbar>

      {popupNotif && (
        <div
          className={popupVisible ? "fadein-popup" : "fadeout-popup"}
          style={{
            position: "fixed",
            top: 80,
            right: 20,
            zIndex: 1300,
            backgroundColor: "#f9f9f9",
            borderLeft: "4px solid #007bff",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            borderRadius: "6px",
            padding: "10px 16px",
            maxWidth: "320px",
          }}
        >
          <NotificationItem
            icon={<Icon>notifications</Icon>}
            title={
              <span
                style={{
                  fontSize: "0.875rem",
                  color: "#333",
                  fontFamily: "Arial, sans-serif",
                  textTransform: "none",
                  fontWeight: "400",
                }}
                dangerouslySetInnerHTML={{ __html: popupNotif.message }}
              />
            }
            date={new Date(popupNotif.createdAt).toLocaleString()}
          />
        </div>
      )}
    </AppBar>
    </DashboardLayout>
  );
}

DashboardNavbar.propTypes = {
  absolute: PropTypes.bool,
  light: PropTypes.bool,
  isMini: PropTypes.bool,
};

export default DashboardNavbar;
