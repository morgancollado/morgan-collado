"use client";

import * as React from "react";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import { motion } from "framer-motion";
import Link from "next/link";
import ProjectDetailsModal from "@/components/project-details-modal";
import ContactFormDialog from "@/components/contact-form-dialog";

const projects = [
  {
    id: 1,
    projectName: "Trans History Quiz app",
    projectDescription: "A simple quiz game written in Swift",
    imageLink: "/trans-pride-flag.png",
  },
  {
    id: 2,
    projectName: "Food Details Page",
    projectDescription: "The logged out food details page for MyFitnessPal",
    imageLink: "/trans-pride-flag.png",
  },
  {
    id: 3,
    projectName: "Onboarding flow for MFP",
    projectDescription:
      "A revamped onboarding flow for MyFitnessPal that resulted in 80% more signups",
    imageLink: "/trans-pride-flag.png",
  },
  {
    id: 4,
    projectName: "Diet and fitness edit page",
    projectDescription:
      "The page customers use to edit their diet and fitness profile for MyFitnessPal including 16 different fields with their own validation logic",
    imageLink: "/trans-pride-flag.png",
  },
  {
    id: 5,
    projectName: "Premium landing page",
    projectDescription:
      "The premium upsell page that customers would use to begin their premium journey for MyFitnessPal",
    imageLink: "/trans-pride-flag.png",
  },
  {
    id: 6,
    projectName: "Accessibility audit",
    projectDescription:
      "A complete audit of MyFitnessPal's NextJS app. The completion of this project ensured that the product was built with accessibility best practices",
    imageLink:
      "/trans-pride-flag.png",
  },
];

export default function Portfolio() {
  const [showScrollToTop, setShowScrollToTop] = React.useState(false);

  const [open, setOpen] = React.useState(false);
  const [selectedProject, setSelectedProject] = React.useState(null);

  const handleOpen = (project) => {
    setSelectedProject(project);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const scrollToTop = () => {
    if (typeof window === 'undefined') {
     return
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };


  React.useEffect(() => {

    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 200); // Show the button when scrolled down 200px
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

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
          <Grid container spacing={4}>
            {projects.map((project) => (
              <Grid item key={project.id} xs={12} sm={6} md={4}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <CardMedia
                    component="div"
                    sx={{
                      // 16:9
                      pt: "56.25%",
                    }}
                    image={project.imageLink}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h5" component="h2">
                      {project.projectName}
                    </Typography>
                    <Typography>{project.projectDescription}</Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => handleOpen(project)}>
                      View
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
          <ProjectDetailsModal
            open={open}
            handleClose={handleClose}
            project={selectedProject}
          />
          {showScrollToTop && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                my: 2,
              }}
            >
              <Button variant="contained" color="primary" onClick={scrollToTop}>
                Back to Top
              </Button>
            </Box>
          )}
          {showScrollToTop && <ContactFormDialog />}
        </Container>
      </main>
      {/* Footer */}
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
      {/* End footer */}
    </motion.div>
  );
}
