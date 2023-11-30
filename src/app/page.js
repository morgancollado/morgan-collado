'use client'

import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import CssBaseline from '@mui/material/CssBaseline';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Link from '@mui/material/Link';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import IconButton from '@mui/material/IconButton';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';


const cards = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export default function Portfolio() {

  const [darkMode, setDarkMode] = React.useState(window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  const [showScrollToTop, setShowScrollToTop] = React.useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleEmailClick = () => {
    window.location.href = `mailto:morgan.collado@gmail.com?subject=${encodeURIComponent("Greetings")}`;
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScroll = () => {
    setShowScrollToTop(window.scrollY > 200); // Show the button when scrolled down 200px
  };

  React.useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
    },
  });
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar  position="relative">
        <Toolbar>
          <Typography variant="h6" color="inherit" noWrap sx={{ marginLeft: 'auto' }}>
            Morgan Collado
          </Typography>
          <Button onClick={toggleDarkMode} color="inherit">
            {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
          </Button>
        </Toolbar>
      </AppBar>
      <main>
        {/* Hero unit */}
        <Box
          sx={{
            bgcolor: 'background.paper',
            pt: 8,
            pb: 6,
          }}
        >
          <Container maxWidth="sm">
            <Typography
              component="h1"
              variant="h2"
              align="center"
              gutterBottom
            >
              Crafting Elegant and Purposeful Solutions
            </Typography>
            <Typography variant="h5" align="center" paragraph>
              With over 3 years of experience, I create accessible, joyful software that helps people.
            </Typography>
            <Stack
              sx={{ pt: 4 }}
              direction="row"
              spacing={2}
              justifyContent="center"
            >
              <Button variant="contained" onClick={handleEmailClick}>Get in touch</Button>
              <Button variant="outlined">About me</Button>
            </Stack>
          </Container>
        </Box>
        <Container maxWidth="md">
          {/* End hero unit */}
          <Typography variant='h5' align='center' gutterBottom>Projects</Typography>
          <Grid container spacing={4}>
            {cards.map((card) => (
              <Grid item key={card} xs={12} sm={6} md={4}>
                <Card
                  sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                >
                  <CardMedia
                    component="div"
                    sx={{
                      // 16:9
                      pt: '56.25%',
                    }}
                    image="https://source.unsplash.com/random?wallpapers"
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h5" component="h2">
                      Heading
                    </Typography>
                    <Typography>
                      This is a media card. You can use this section to describe the
                      content.
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small">View</Button>
                    <Button size="small">Edit</Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
          {showScrollToTop && (
            <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              my: 2,
            }}
          >
            <Button variant="contained" color="primary" onClick={scrollToTop}>
              Back to Top
            </Button>
          </Box>
          )}
        </Container>
      </main>
      {/* Footer */}
      <Box sx={{ p: 6, bgcolor: 'background.paper' }} component="footer">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <IconButton color="primary" href="https://github.com/morgancollado" target="_blank">
            <GitHubIcon />
          </IconButton>
          <IconButton color="primary" href="https://www.linkedin.com/in/morgancollado/" target="_blank">
            <LinkedInIcon />
          </IconButton>
        </Box>
      </Box>
      {/* End footer */}
    </ThemeProvider>
  );
}