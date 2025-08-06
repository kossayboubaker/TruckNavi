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
import { useTranslation } from "react-i18next";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";

// Material Dashboard 2 React example components
import DefaultNavbar from "examples/Navbars/DefaultNavbar";
import PageLayout from "examples/LayoutContainers/PageLayout";

// Authentication pages components
import Footer from "layouts/authentication/components/Footer";
import { Typography, List, ListItem, ListItemText } from "@mui/material";
import { useLocation } from "react-router-dom";

function BasicLayout({ image, children }) {
  const { pathname } = useLocation();
  const { t } = useTranslation();

  // Styles ultra-responsifs pour toutes les tailles d'écran
  const responsiveStyles = {
    height: "100vh",
    minHeight: "100vh",
    maxHeight: "100vh",
    overflow: "hidden", // Supprimer le scroll
    position: "fixed",
    width: "100%",
    top: 0,
    left: 0,
    // Adaptation pour micro-écrans
    '@media (max-width: 100px)': {
      fontSize: '8px',
      padding: '2px',
    },
    // Adaptation pour très petits écrans
    '@media (max-width: 250px)': {
      fontSize: '10px',
      padding: '4px',
    },
    // Adaptation pour 4K et plus
    '@media (min-width: 2560px)': {
      fontSize: '18px',
      padding: '32px',
    },
  };

  return (
    <PageLayout className="auth-page">
      <DefaultNavbar
        // action={{
        //   type: "external",
        //   route: "https://creative-tim.com/product/material-dashboard-react-nodejs",
        //   label: "free download",
        //   color: "dark",
        // }}
      />
      <MDBox sx={responsiveStyles} display="flex" flexDirection="column" className="auth-page">
        <MDBox
          position="absolute"
          width="100%"
          height="100vh"
          minHeight="100vh"
          maxHeight="100vh"
          paddingTop={{ xs: "1em", sm: "2em", md: "3em", lg: "3em" }}
          sx={{
            backgroundImage: ({ functions: { linearGradient, rgba }, palette: { gradients } }) =>
              image &&
              `${linearGradient(
                rgba(gradients.dark.main, 0.6),
                rgba(gradients.dark.state, 0.6)
              )}, url(${image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            overflow: "hidden",
            // Ultra-responsivité
            '@media (max-width: 100px)': {
              paddingTop: '4px',
              fontSize: '6px',
            },
            '@media (min-width: 100px) and (max-width: 250px)': {
              paddingTop: '8px',
              fontSize: '8px',
            },
            '@media (min-width: 2560px)': {
              paddingTop: '4em',
              fontSize: '20px',
            },
          }}
        >
          <MDBox
            position="relative"
            height="100%"
            maxHeight="100vh"
            display="flex"
            flexDirection="column"
            width="100%"
            justifyContent="center"
            overflow="hidden"
            paddingTop={{ xs: "2em", sm: "4em", md: "6em", lg: "7em" }}
            paddingBottom={{ xs: "1em", sm: "2em", md: "3em", lg: "5em" }}
            sx={{
              // Micro-écrans (<100px)
              '@media (max-width: 100px)': {
                paddingTop: '8px',
                paddingBottom: '4px',
              },
              // Tiny écrans (100-250px)
              '@media (min-width: 100px) and (max-width: 250px)': {
                paddingTop: '16px',
                paddingBottom: '8px',
              },
              // 4K et plus
              '@media (min-width: 2560px)': {
                paddingTop: '10em',
                paddingBottom: '8em',
              },
            }}
          >
            <MDBox paddingBottom="3rem" sx={{ textAlign: "center" }}>
              {pathname === "/auth/login" && (
                <MDBox display="flex" width="100%" justifyContent="center" sx={{ zIndex: "99" }}>
                  <MDBox
                    display="flex"
                    flexDirection="column"
                    justifyContent="center"
                    alignItems="center"
                    padding="1.5rem"
                    width="80%"
                  >
                    <Typography variant="h3" style={{ color: "white" }}>
            {t("layout.title")}
                    </Typography>
                    <Typography variant="body2" style={{ color: "white" }} margin="0.5rem 0">
                     
                    </Typography>
                    <MDBox
                      display="flex"
                      flexDirection="column"
                      justifyContent="center"
                      alignItems="center"
                      marginBottom="0.5rem"
                    >
                      <Typography variant="body2" fontWeight="700" style={{ color: "white" }}>
              {t("layout.helper1")}
                      </Typography>
                      <List dense={true}>
                        <ListItem>
                          <ListItemText
                            disableTypography
                            primary={
                              <Typography
                                variant="body2"
                                fontWeight="400"
                                style={{ color: "white" }}
                              >
                                                     {t("layout.helper2")}

                              </Typography>
                            }
                          />
                        </ListItem>
                      </List>
                    </MDBox>
                  </MDBox>
                </MDBox>
              )}
              <MDBox px={1} width="100%" mx="auto" paddingTop="1rem">
                <Grid container spacing={1} justifyContent="center" alignItems="center">
                  <Grid item xs={11} sm={9} md={5} lg={4} xl={3}>
                    {children}
                  </Grid>
                </Grid>
              </MDBox>
            </MDBox>
          </MDBox>
          {/* <Footer light /> */}
        </MDBox>
      </MDBox>
    </PageLayout>
  );
}

// Typechecking props for the BasicLayout
BasicLayout.propTypes = {
  image: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default BasicLayout;
