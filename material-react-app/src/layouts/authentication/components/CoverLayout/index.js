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

// prop-types is a library for typechecking of props
import PropTypes from "prop-types";

// @mui material components
import Grid from "@mui/material/Grid";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
// import MDTypography from "components/MDTypography";

// Material Dashboard 2 React example components
import DefaultNavbar from "examples/Navbars/DefaultNavbar";
import PageLayout from "examples/LayoutContainers/PageLayout";

// Authentication layout components
import Footer from "layouts/authentication/components/Footer";

function CoverLayout({ coverHeight = "35vh", image, children }) {
  // Styles ultra-responsifs pour suppression du scroll
  const layoutStyles = {
    height: "100vh",
    minHeight: "100vh",
    maxHeight: "100vh",
    overflow: "hidden",
    position: "fixed",
    width: "100%",
    top: 0,
    left: 0,
  };

  return (
    <PageLayout sx={layoutStyles}>
      <DefaultNavbar
        // action={{
        //   type: "external",
        //   route: "https://creative-tim.com/product/material-dashboard-react-nodejs",
        // }}
        // transparent
        // light
      />
      <MDBox
        width={{ xs: "calc(100% - 8px)", sm: "calc(100% - 1rem)", md: "calc(100% - 2rem)" }}
        minHeight={coverHeight}
        borderRadius={{ xs: "lg", sm: "xl" }}
        mx={{ xs: 1, sm: 1, md: 2 }}
        my={{ xs: 1, sm: 1, md: 2 }}
        pt={{ xs: 2, sm: 4, md: 6 }}
        pb={{ xs: 8, sm: 16, md: 28 }}
        sx={{
          backgroundImage: ({ functions: { linearGradient, rgba }, palette: { gradients } }) =>
            image &&
            `${linearGradient(
              rgba(gradients.dark.main, 0.4),
              rgba(gradients.dark.state, 0.4)
            )}, url(${image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          // Ultra-responsivité
          '@media (max-width: 100px)': {
            width: 'calc(100% - 4px)',
            margin: '2px',
            padding: '4px',
            borderRadius: '4px',
          },
          '@media (min-width: 100px) and (max-width: 250px)': {
            width: 'calc(100% - 8px)',
            margin: '4px',
            padding: '8px',
            borderRadius: '8px',
          },
          '@media (min-width: 2560px)': {
            width: 'calc(100% - 4rem)',
            margin: '32px',
            padding: '48px',
            borderRadius: '24px',
          },
        }}
      />
      <MDBox
        mt={{ xs: -6, sm: -12, md: -18, lg: -20 }}
        px={{ xs: 0.5, sm: 1 }}
        width={{ xs: "calc(100% - 8px)", sm: "calc(100% - 1rem)", md: "calc(100% - 2rem)" }}
        mx="auto"
        sx={{
          // Micro-écrans
          '@media (max-width: 100px)': {
            marginTop: '-16px',
            padding: '2px',
            width: 'calc(100% - 4px)',
          },
          // Tiny écrans
          '@media (min-width: 100px) and (max-width: 250px)': {
            marginTop: '-24px',
            padding: '4px',
            width: 'calc(100% - 8px)',
          },
          // 4K et plus
          '@media (min-width: 2560px)': {
            marginTop: '-32px',
            padding: '16px',
            width: 'calc(100% - 4rem)',
          },
        }}
      >
        <Grid container spacing={{ xs: 0.5, sm: 1 }} justifyContent="center">
          <Grid item xs={12} sm={11} md={9} lg={5} xl={4}>
            {children}
          </Grid>
        </Grid>
      </MDBox>
    </PageLayout>
  );
}

// Default props now handled by JavaScript default parameters

// Typechecking props for the CoverLayout
CoverLayout.propTypes = {
  coverHeight: PropTypes.string,
  image: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default CoverLayout;
