"use client";

import * as React from "react";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { motion } from "framer-motion";
import Link from "next/link";
import ProjectDetailsModal from "@/components/project-details-modal";
import ContactFormDialog from "@/components/contact-form-dialog";
import { animateScroll } from "react-scroll";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import ThemeContext from "@/context/theme-context";
import ProjectCard from "@/components/project-card";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const myFitnessPalProjects = [
  {
    id: 1,
    projectName: "Food Details Page",
    projectDescription: "The logged out food details page for MyFitnessPal",
    imageLink: "/food-details.png",
  },
  {
    id: 2,
    projectName: "Onboarding flow for MFP",
    projectDescription:
      "A revamped onboarding flow for MyFitnessPal that resulted in 80% more signups",
    imageLink: "/onboarding.png",
  },
  {
    id: 3,
    projectName: "Diet and fitness edit page",
    projectDescription:
      "The page customers use to edit their diet and fitness profile for MyFitnessPal including 16 different fields with their own validation logic",
    imageLink: "/diet-fitness-profile.png",
  },
  {
    id: 4,
    projectName: "Premium landing page",
    projectDescription:
      "The premium upsell page that customers would use to begin their premium journey for MyFitnessPal",
    imageLink: "/premium.png",
  },
  {
    id: 5,
    projectName: "Accessibility audit",
    projectDescription:
      "A complete audit of MyFitnessPal's NextJS app. The completion of this project ensured that the product was built with accessibility best practices",
    imageLink: "/accessibility-audit.png",
  },
];

const colladoCodeWorksProjects = [
  {
    id: 1,
    projectName: "morgancollado.com",
    projectDescription: "This very portfolio site. Projectception!",
    imageLink: "/portfolio-screencap.png",
  },
  {
    id: 1,
    projectName: "Trans History Quiz app",
    projectDescription: "A simple quiz game written in Swift",
    imageLink: "/trans-pride-flag.png",
  },
];

export default function Portfolio() {
  const [open, setOpen] = React.useState(false);
  const [selectedProject, setSelectedProject] = React.useState(null);

  const { mode } = React.useContext(ThemeContext);

  const handleOpen = (project) => {
    setSelectedProject(project);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 1 } },
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants}>
      <main>
        {/* Hero unit */}
        <Box
          sx={{
            bgcolor: "background.paper",
            pt: 3,
            pb: 6,
          }}
        >
          <Container maxWidth="sm">
            <Typography component="h1" variant="h2" align="center" gutterBottom>
              Crafting Elegant and Purposeful Solutions
            </Typography>
            <Typography variant="h5" align="center" paragraph>
              With over 3 years of experience, I create accessible, intuitive
              software that helps people.
            </Typography>
            <Stack
              sx={{ pt: 4 }}
              direction="row"
              spacing={2}
              justifyContent="center"
            >
              <Link href="/about">
                <Button variant="outlined">
                  <Typography>About me</Typography>
                </Button>
              </Link>
            </Stack>
          </Container>
        </Box>
        <Container maxWidth="md">
          {/* End hero unit */}
          <Typography variant="h5" align="center" gutterBottom>
            Projects
          </Typography>
          <Box sx={{ padding: 1 }}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">MyFitnessPal Projects</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={4}>
                  {myFitnessPalProjects.map((project) => (
                    <Grid item key={project.id} xs={12} sm={6} md={4}>
                      <ProjectCard
                        key={project.id}
                        project={project}
                        handleOpen={handleOpen}
                      />
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Box>
          <Box sx={{ padding: 1 }}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Collado CodeWorks Projects</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={4}>
                  {colladoCodeWorksProjects.map((project) => (
                    <Grid item key={project.id} xs={12} sm={6} md={4}>
                      <ProjectCard
                        key={project.id}
                        project={project}
                        handleOpen={handleOpen}
                      />
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Box>
          <ProjectDetailsModal
            open={open}
            handleClose={handleClose}
            project={selectedProject}
          />
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              my: 2,
            }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={() =>
                animateScroll.scrollToTop({ duration: 500, smooth: true })
              }
            >
              Back to Top
            </Button>
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
      </main>
    </motion.div>
  );
}
