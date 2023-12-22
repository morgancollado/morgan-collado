// pages/about.js
'use client'
import React from 'react';
import { Box, Container, Grid, Typography, Avatar, Button } from '@mui/material';
import Link from 'next/link';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { motion } from 'framer-motion';

const AboutMe = () => {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 1 } }, 
      };
  return (
    <motion.div 
    initial="hidden" 
    animate="visible" 
    variants={containerVariants}
  >
    <Container component="main" maxWidth="md" sx={{paddingTop: 8}}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={5}>
          {/* Placeholder for Image */}
          <Avatar
            alt="an image of Morgan"
            src="/headshot.jpeg" // Replace with your image path
            sx={{ width: 256, height: 256 }}
          />
        </Grid>
        <Grid item xs={12} md={7}>
          <Typography variant="h3" component="h1" gutterBottom>
            About Me
          </Typography>
          <Typography variant="h5" component="h2" gutterBottom>
            Hello World, My name is Morgan.
          </Typography>
          <Typography gutterBottom variant="body1">
            A tech enthusiast with a rich journey that began in the bustling corridors of Apple as tech support. 
            It was there I discovered my knack for resolving complex technical issues, which ignited a passion 
            for understanding and building the products I was supporting. Determined to dive deeper, I enrolled 
            in a coding bootcamp, embracing the challenge of self-directed learning to master the art of code.
          </Typography>
          <Typography gutterBottom variant="body1">
            Post-graduation, my skills and determination led me to a role at MyFitnessPal, a place where I have 
            spent the past three years crafting user interfaces enjoyed by millions. My time here has been a 
            blend of innovation, learning, and real-world impact, fueling my excitement for technology and its 
            possibilities.
          </Typography>
          <Typography gutterBottom variant="body1">
            As I look forward to the next phase of my career, I am eager to bring my strong technical foundation, 
            problem-solving skills, and user-centric approach to new challenges and opportunities. Let us build 
            something great together!
          </Typography>
        </Grid>
      </Grid>
      <Box mt={4} display="flex" justifyContent="flex-end">
        <Link href="/portfolio" passHref>
          <Button variant="contained" color="primary" startIcon={<ArrowBackIosNewIcon />}>
            Back
          </Button>
        </Link>
      </Box>
    </Container>
    </motion.div>
  );
};

export default AboutMe;
