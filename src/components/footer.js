import React from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";

const Footer = () => {
  return (
    <Box sx={{ p: 6, bgcolor: "background.paper" }} component="footer">
      <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
        <IconButton
          color="primary"
          href="https://github.com/morgancollado"
          target="_blank"
        >
          <GitHubIcon />
        </IconButton>
        <IconButton
          color="primary"
          href="https://www.linkedin.com/in/morgancollado/"
          target="_blank"
        >
          <LinkedInIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default Footer;
