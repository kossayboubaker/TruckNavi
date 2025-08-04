/**
=========================================================
* Material Dashboard 2 React - v2.1.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2022 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com
=========================================================
*/

// prop-types is a library for typechecking of props.
import PropTypes from "prop-types";

// @mui material components
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Icon from "@mui/material/Icon";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";

// Custom styles for the SidenavCollapse
import {
  collapseItem,
  collapseIconBox,
  collapseIcon,
  collapseText,
} from "examples/Sidenav/styles/sidenavCollapse";

// Material Dashboard 2 React context
import { useMaterialUIController } from "context";

function SidenavCollapse({ icon, name, active = false, sx = {} }) {
  const [controller] = useMaterialUIController();
  const { miniSidenav, transparentSidenav, whiteSidenav, darkMode, sidenavColor } = controller;

  const ownerState = {
    active,
    transparentSidenav,
    whiteSidenav,
    darkMode,
    sidenavColor,
    miniSidenav,
  };

  return (
    <ListItem component="li" sx={{ p: 0 }}>
      <MDBox sx={(theme) => ({ ...collapseItem(theme, ownerState), ...sx })}>
        <ListItemIcon sx={(theme) => collapseIconBox(theme, ownerState)}>
          {typeof icon === "string" ? (
            <Icon sx={(theme) => collapseIcon(theme, { active })}>{icon}</Icon>
          ) : (
            icon
          )}
        </ListItemIcon>
        <ListItemText
          primary={name}
          sx={(theme) => collapseText(theme, ownerState)}
        />
      </MDBox>
    </ListItem>
  );
}

// Typechecking props for the SidenavCollapse
SidenavCollapse.propTypes = {
  icon: PropTypes.node.isRequired,
  name: PropTypes.string.isRequired,
  active: PropTypes.bool,
  sx: PropTypes.object,
};

export default SidenavCollapse;
