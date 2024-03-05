// pages/about.js
"use client";
import React from "react";
import {
  Box,
  Container,
  Grid,
  Typography,
  Avatar,
  Button,
} from "@mui/material";
import Link from "next/link";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ContactFormDialog from "@/components/contact-form-dialog";
import { motion } from "framer-motion";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import ThemeContext from "@/context/theme-context";


const AboutMe = () => {

  const { mode } = React.useContext(ThemeContext)
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 1 } },
  };
  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants}>
      <Container component="main" maxWidth="md" sx={{ paddingTop: 8 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <Avatar
              alt="an image of Morgan"
              src="/headshot.jpeg"
              sx={{ width: 256, height: 256 }}
            />
          </Grid>
          <Grid item xs={12} md={7}>
            <Typography variant="h5" component="h1" gutterBottom>
            Crafting Elegant and Purposeful Solutions
            </Typography>
            <Typography variant="h6" component="h2" gutterBottom>
              Hello World, My name is Morgan.
            </Typography>
            <Typography gutterBottom variant="body1">
              A poet turned software engineer with a rich journey that started at Apple as tech support. I discovered there my
              knack for resolving complex technical issues, which ignited a
              passion for understanding and building the products I was
              supporting. Determined to dive deeper, I enrolled in a coding
              bootcamp, embracing the challenge of self-directed learning to
              master the art of code.
            </Typography>
            <Typography gutterBottom variant="body1">
              Post-graduation, my skills and determination led me to a role at
              a popular fitness app, a place where I have spent the past three years
              crafting user interfaces enjoyed by millions. My time here has
              been a blend of innovation, learning, and real-world impact,
              fueling my excitement for technology and its possibilities.
            </Typography>
            <Typography gutterBottom variant="body1">
              As I look forward to the next phase of my career, I am eager to
              bring my strong technical foundation, problem-solving skills, and
              user-centric approach to new challenges and opportunities. Click on the contact form below to get in touch and let us build something great together!
            </Typography>
            
          </Grid>
        </Grid>
        <Box mt={4} display="flex" justifyContent="flex-end">
          <Link href="/" passHref>
            <Button
              variant="contained"
              color="primary"
              startIcon={<ArrowBackIosNewIcon />}
            >
              Back
            </Button>
          </Link>
        </Box>
        <GoogleReCaptchaProvider
            reCaptchaKey="6Lc3SUApAAAAAEq5BVpE_XqS5YA89KdPog1hQJVk"
            container={{
              parameters: {
                theme: `${mode}`,
              },
            }}
          >
            <ContactFormDialog />
          </GoogleReCaptchaProvider>
      </Container>
    </motion.div>
  );
};

export default AboutMe;
