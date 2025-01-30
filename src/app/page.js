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
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import ThemeContext from "@/context/theme-context";
import ProjectCard from "@/components/project-card";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import BackToTop from "@/components/back-to-top";
import IconButton from "@mui/material/IconButton";
import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";

const myFitnessPalProjects = [
  {
    id: 1,
    projectName: "Food Details Page",
    projectDescription: "The logged out food details page for a popular fitness app",
    projectDetail: "Let's talk about revamping the Food Details page for a popular fitness app.",
    imageLink: "/food-details.png",
    blogLink: "/blog/food-details",
  },
  {
    id: 2,
    projectName: "Onboarding flow for a popular fitness app",
    projectDescription:
      "A revamped onboarding flow for a popular fitness app that resulted in 80% more signups",
    projectDetail: "I was tasked with creating a new onboarding flow for prospective users",
    imageLink: "/onboarding.png",
    blogLink: "/blog/onboarding"
  },
  {
    id: 3,
    projectName: "Diet and fitness edit page",
    projectDescription:
      "The page customers use to edit their diet and fitness profile for a popular fitness app",
    projectDetail: "This included 16 different fields with their own validation logic and extending a Ruby on Rails API",
    imageLink: "/diet-fitness-profile.png",
    blogLink: "/blog/rails-api-extension"
  },
  {
    id: 4,
    projectName: "Premium landing page",
    projectDescription:
      "The premium upsell page that customers would use to begin their premium journey for a popular fitness app",
    projectDetail: "I had the opportunity to work on the premium landing page for a popular fitness app",
    imageLink: "/premium.png",
    blogLink: "/blog/crafting-premium"
  },
  {
    id: 5,
    projectName: "Accessibility audit",
    projectDescription:
      "A complete audit of a popular fitness app's NextJS app. The completion of this project ensured that the product was built with accessibility best practices",
    projectDetail: "Creating an accessible digital environment is not just an option; it's a responsibility",
    imageLink: "/accessibility-audit.png",
    blogLink: "/blog/enhancing-accessibility"
  },
];

const colladoCodeWorksProjects = [
  {
    id: 6,
    projectName: "morgancollado.com",
    projectDescription: "This very portfolio site. Projectception!",
    projectDetail: "Learn more about what I used to build this nifty piece of software.",
    imageLink: "/portfolio-screencap.png",
    blogLink: "/blog/building-portfolio"
  },
  {
    id: 7,
    projectName: "Trans History Quiz app",
    projectDescription: "A simple quiz game written in Swift",
    projectDetail: "Coming soon to an iOS device near you!",
    imageLink: "/trans-pride-flag.png",
  },
];

const everlyHealth = [
  {
  id: 8,
  projectName: "AdHoc Reminders",
  projectDescription: "Sending reminders whenever we wanted.",
  projectDetail: "Sending reminders outside of the initial build was tedious and required engineering work. Here is how I built a tool to make sending messages delightful.",
  imageLink: "/reminder.jpg",
  blogLink: "/blog/adhoc-reminders",
},
{
  id: 9,
  projectName: "Campaign Generation Tool",
  projectDescription: "Campaigns for every program.",
  projectDetail: "Creating campaigns was a manual process. Lets discuss the tool I built to make creating campaigns easy peezy.",
  imageLink: "/campaigns.jpg",
  blogLink: "/blog/campaign-generation",
},
{
  id: 10,
  projectName: "Batch creation of result test types",
  projectDescription: "Creating test types in bulk.",
  projectDetail: "Creating test types one by one required repetitive use of a form. I created a service that took a spread sheet of data and created objects accordingly, saving time and lessening mistakes.",
  imageLink: "/tests.jpg",
}
]

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
            pb: 2,
          }}
        >
          <Container maxWidth="sm">
            <Typography component="h1" variant="h3" align="center" gutterBottom>
              Morgan Collado
            </Typography>
            <Typography component="h2" variant="h6" align="center" paragraph>
              I create accessible software that improve lives.
            </Typography>
            <Stack
              sx={{ pt: 2 }}
              direction="row"
              spacing={2}
              justifyContent="center"
            >
              <Link href="/about">
                <Button variant="outlined">
                  <Typography>About me</Typography>
                </Button>
              </Link>
              <Button variant="outlined" component="a" href="/resume.pdf" download="MorganColladoResume.pdf">
                <Typography>Resume</Typography>
              </Button>
            </Stack>
          </Container>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "center", pb: 1}}>
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
        <Container maxWidth="md">
          {/* End hero unit */}
          <Typography variant="h5" align="center" gutterBottom>
            Projects
          </Typography>
          <Box sx={{ padding: 1 }}>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Medical Diagnostics Company Projects</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={4}>
                  {everlyHealth.map((project) => (
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
            <Accordion >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Popular Fitness App Projects</Typography>
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
          <BackToTop />
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
