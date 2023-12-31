import React from "react";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

function ProjectCard({ project, handleOpen }) {
  return (
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
  );
}

export default ProjectCard;
