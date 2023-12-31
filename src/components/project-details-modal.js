import React from "react";
import Modal from "@mui/material/Modal";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import { Box } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

function ProjectDetailsModal({ open, handleClose, project }) {
  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="project-details-title"
      aria-describedby="project-description"
    >
      <Paper
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 400,
          maxHeight: "90vh",
          overflow: "auto",
          bgcolor: "background.paper",
          boxShadow: 24,
          p: 4,
        }}
      >
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
          }}
        >
          <CloseIcon />
        </IconButton>

        {project && (
          <>
            <Typography variant="h6" id="project-details-title">
              {project.projectName}
            </Typography>
            <Box sx={{ position: "relative", width: "100%", height: "300px" }}>
              <Image
                src={project.imageLink}
                alt={project.projectName}
                layout="fill"
                objectFit="cover"
              />
            </Box>
            <Typography id="project-description">
              {project.projectDescription}
            </Typography>
          </>
        )}
      </Paper>
    </Modal>
  );
}

export default ProjectDetailsModal;
