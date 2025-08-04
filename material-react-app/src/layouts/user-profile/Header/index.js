import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import React from "react";

// MUI components
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import PhotoCamera from "@mui/icons-material/PhotoCamera";

// Custom components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDAvatar from "components/MDAvatar";

// Default images
import defaultImage from "assets/images/bruce-mars.jpg";
import backgroundImage from "assets/images/bg-profile.jpeg";

function Header({ name, children }) {
  const [previewImage, setPreviewImage] = useState(defaultImage);
  const fileInputRef = useRef(null);

useEffect(() => {
  const storedImage = localStorage.getItem("adminImage");

  if (storedImage) {
    const imageUrl = `http://localhost:8080/uploads/${storedImage}`;
    console.log("Image URL construite :", imageUrl);

    // Essaie de charger l’image pour confirmer qu’elle existe
    // fetch(imageUrl)
    //   .then((res) => {
    //     if (!res.ok) throw new Error("Image introuvable");
    //     setPreviewImage(imageUrl);
    //   })
    //   .catch((err) => {
    //     console.error("Erreur lors du chargement de l’image :", err);
    //     setPreviewImage(imageUrl);
    //   });
    if (imageUrl) {
      setPreviewImage(imageUrl)
    }else{
      setPreviewImage(defaultImage)
    }
  }
}, []);


  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    const token = localStorage.getItem("token");

    if (!token || !file) {
      console.error("Token ou fichier manquant");
      return;
    }

    const formData = new FormData();
    formData.append("image", file); // Clé "image" pour Multer

    try {
      const response = await fetch("http://localhost:8080/admin/update-profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();
      console.log("Mise à jour réussie :", result);

      if (result?.admin?.image) {
        const imageFilename = result.admin.image;
        const fullImageUrl = `http://localhost:8080/uploads/${imageFilename}`;

        localStorage.setItem("adminImage", imageFilename);
        setPreviewImage(fullImageUrl);
      }
    } catch (error) {
      console.error("Échec de la mise à jour :", error);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <MDBox position="relative" mb={5}>
      <MDBox
        display="flex"
        alignItems="center"
        position="relative"
        minHeight="18.75rem"
        borderRadius="xl"
        sx={(theme) => {
          const {
            functions: { rgba, linearGradient },
            palette: { gradients },
          } = theme;

          return {
            backgroundImage: `${linearGradient(
              rgba(gradients.info.main, 0.6),
              rgba(gradients.info.state, 0.6)
            )}, url(${backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "50%",
            overflow: "hidden",
          };
        }}
      />
      <Card sx={{ position: "relative", mt: -8, mx: 3, py: 2, px: 2 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item sx={{ position: "relative", width: "fit-content" }}>
            <MDAvatar
              src={previewImage}
              alt="profile"
              size="xl"
              shadow="sm"
              sx={{ cursor: "pointer" }}
              onClick={triggerFileInput}
            />
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageChange}
              style={{ display: "none" }}
            />
            <IconButton
              onClick={triggerFileInput}
              sx={{
                position: "absolute",
                bottom: 4,
                right: 4,
                backgroundColor: "#ffffffcc",
                borderRadius: "50%",
                padding: "4px",
                "&:hover": { backgroundColor: "#f0f0f0" },
              }}
              size="small"
            >
              <PhotoCamera fontSize="small" />
            </IconButton>
          </Grid>
          <Grid item>
            <MDBox height="100%" mt={0.5} lineHeight={1}>
              <MDTypography variant="h5" fontWeight="medium">
                {name}
              </MDTypography>
            </MDBox>
          </Grid>
        </Grid>
        {children}
      </Card>
    </MDBox>
  );
}

Header.propTypes = {
  name: PropTypes.string.isRequired,
  children: PropTypes.node,
};

Header.defaultProps = {
  children: "",
};

export default Header;
