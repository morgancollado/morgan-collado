"use client";
import React from "react";
import {
  Box,
  Dialog,
  DialogContent,
  TextField,
  Snackbar,
  Typography,
} from "@mui/material";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

const SERIF_BODY =
  "'Iowan Old Style', 'Apple Garamond', Baskerville, 'Times New Roman', Times, Georgia, serif";

const ContactSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Required"),
  message: Yup.string().required("Required"),
});

async function sendContactForm(data) {
  const endpoint = "/api";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
  if (response.ok) return await response.json();
  throw new Error("Something went wrong. Please try again.");
}

const editorialButtonSx = {
  fontFamily: "var(--font-playfair)",
  fontStyle: "italic",
  fontSize: "1rem",
  color: "primary.main",
  background: "none",
  border: "none",
  borderRadius: 0,
  cursor: "pointer",
  padding: 0,
  paddingBottom: "2px",
  borderBottom: "1px solid currentColor",
  "&:hover": { borderBottomStyle: "dashed" },
  "&:disabled": { opacity: 0.4, cursor: "not-allowed" },
};

function ContactFormDialog() {
  const [open, setOpen] = React.useState(false);
  const [formSubmitted, setFormSubmitted] = React.useState(false);
  const [formSubmitting, setFormSubmitting] = React.useState(false);
  const [formStatus, setFormStatus] = React.useState("");
  const { executeRecaptcha } = useGoogleReCaptcha();

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSubmit = React.useCallback(
    async (values) => {
      if (!executeRecaptcha) return;
      setFormSubmitting(true);
      const reCaptchaToken = await executeRecaptcha("formSubmission");
      values.reCaptchaToken = reCaptchaToken;
      sendContactForm(values).then(
        (data) => {
          setFormStatus(data.message);
          setFormSubmitted(true);
          setFormSubmitting(false);
          handleClose();
        },
        (error) => {
          setFormStatus(error.toString());
          setFormSubmitted(true);
          setFormSubmitting(false);
          handleClose();
        }
      );
    },
    [executeRecaptcha]
  );

  return (
    <>
      {/* Editorial FAB — a calling card pinned to the page corner */}
      <Box
        component="button"
        onClick={handleClickOpen}
        aria-label="Send a message"
        sx={{
          position: "fixed",
          bottom: { xs: 16, md: 24 },
          left: { xs: 16, md: 24 },
          zIndex: 1200,
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 2,
          py: 1,
          bgcolor: (t) => (t.palette.mode === "light" ? "#faf6ec" : "#0d0a14"),
          color: "primary.main",
          border: "1px solid currentColor",
          borderRadius: 0,
          fontFamily: "var(--font-playfair)",
          fontStyle: "italic",
          fontSize: "0.95rem",
          cursor: "pointer",
          boxShadow: (t) =>
            t.palette.mode === "light"
              ? "0 8px 24px -8px rgba(66,43,101,0.35)"
              : "0 8px 24px -8px rgba(0,0,0,0.6)",
          transition: "transform .2s, box-shadow .2s",
          "&:hover, &:focus-visible": {
            transform: "translateY(-2px)",
            outline: "none",
          },
        }}
      >
        <MailOutlineIcon fontSize="small" />
        Write to me
      </Box>

      <Dialog
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            bgcolor: (t) => (t.palette.mode === "light" ? "#faf6ec" : "#0d0a14"),
            color: (t) => (t.palette.mode === "light" ? "#1c1614" : "#ede6d8"),
            border: "1px solid",
            borderColor: "currentColor",
            borderRadius: 0,
            boxShadow: (t) =>
              t.palette.mode === "light"
                ? "0 30px 80px -20px rgba(66,43,101,0.4)"
                : "0 30px 80px -20px rgba(0,0,0,0.8)",
            maxWidth: 480,
            width: "100%",
            mx: 2,
          },
        }}
      >
        <DialogContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Typography
            variant="overline"
            sx={{
              letterSpacing: 4,
              color: "primary.main",
              fontFamily: "var(--font-playfair)",
              fontStyle: "italic",
              display: "block",
              mb: 1,
            }}
          >
            Correspondence
          </Typography>
          <Typography
            component="h2"
            sx={{
              fontFamily: "var(--font-playfair)",
              fontStyle: "italic",
              fontSize: "1.85rem",
              lineHeight: 1.1,
              mb: 1,
            }}
          >
            A note to the author
          </Typography>
          <Box
            sx={{
              width: "40px",
              height: "1px",
              bgcolor: "currentColor",
              opacity: 0.4,
              mb: 3,
            }}
          />
          <Typography
            sx={{
              fontFamily: SERIF_BODY,
              fontSize: "0.97rem",
              lineHeight: 1.6,
              mb: 3,
              color: (t) => (t.palette.mode === "light" ? "#5a4d3f" : "#a89c8d"),
              fontStyle: "italic",
            }}
          >
            Send a message directly. I read every letter.
          </Typography>
          <Formik
            initialValues={{ email: "", message: "" }}
            validationSchema={ContactSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched }) => (
              <Form>
                <Field
                  as={TextField}
                  autoFocus
                  margin="dense"
                  id="email"
                  name="email"
                  label="Your email"
                  type="email"
                  fullWidth
                  variant="standard"
                  error={touched.email && !!errors.email}
                  helperText={touched.email && errors.email}
                  sx={{
                    mb: 1.5,
                    "& .MuiInput-underline:before": {
                      borderBottomColor: "currentColor",
                      opacity: 0.4,
                    },
                    "& .MuiInputBase-input": { fontFamily: SERIF_BODY },
                    "& .MuiInputLabel-root": {
                      fontFamily: "var(--font-playfair)",
                      fontStyle: "italic",
                    },
                  }}
                />
                <Field
                  as={TextField}
                  margin="dense"
                  id="message"
                  name="message"
                  label="Your message"
                  type="text"
                  fullWidth
                  multiline
                  rows={4}
                  variant="standard"
                  error={touched.message && !!errors.message}
                  helperText={touched.message && errors.message}
                  sx={{
                    mb: 3,
                    "& .MuiInput-underline:before": {
                      borderBottomColor: "currentColor",
                      opacity: 0.4,
                    },
                    "& .MuiInputBase-input": { fontFamily: SERIF_BODY },
                    "& .MuiInputLabel-root": {
                      fontFamily: "var(--font-playfair)",
                      fontStyle: "italic",
                    },
                  }}
                />
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 4,
                    mt: 2,
                  }}
                >
                  <Box
                    component="button"
                    type="button"
                    onClick={handleClose}
                    sx={{
                      ...editorialButtonSx,
                      color: (t) =>
                        t.palette.mode === "light" ? "#5a4d3f" : "#a89c8d",
                    }}
                  >
                    Cancel
                  </Box>
                  <Box
                    component="button"
                    type="submit"
                    disabled={formSubmitting}
                    sx={editorialButtonSx}
                  >
                    {formSubmitting ? "Sending…" : "Send →"}
                  </Box>
                </Box>
              </Form>
            )}
          </Formik>
        </DialogContent>
      </Dialog>
      <Snackbar
        open={formSubmitted}
        autoHideDuration={6000}
        onClose={() => setFormSubmitted(false)}
        message={formStatus}
      />
    </>
  );
}

export default ContactFormDialog;
