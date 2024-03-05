import React from "react";
import Box from "@mui/material/Box";
import PortfolioButton from "./portfolio-button";

const Footer = () => {
  return (
    <Box sx={{ p: 10, ml: 12, bgcolor: "background.paper", display: 'flex', alignItems: 'center', justifyContent: 'center' }} component="footer">
      <PortfolioButton />
    </Box>
  );
};

export default Footer;
