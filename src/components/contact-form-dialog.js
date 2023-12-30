import React from "react";
import {
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  TextField,
  DialogActions,
  Button,
  Snackbar
} from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

const ContactSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Required"),
  message: Yup.string().required("Required"),
});

async function sendContactForm(data) {
    const endpoint = "/api";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    });
  
    // Ensure the response is okay to parse
    if (response.ok) {
      const responseData = await response.json(); // Wait for the JSON response
      return responseData;
    } else {
      // Handle HTTP errors here
      throw new Error("Something went wrong. Please try again.");
    }
  }
  

function ContactFormDialog() {
  const [open, setOpen] = React.useState(false);
  const [formSubmitted, setFormSubmitted] = React.useState(false);
  const [formSubmitting, setFormSubmitting] = React.useState(false)
  const [formStatus, setFormStatus] = React.useState('')
  const { executeRecaptcha } = useGoogleReCaptcha();

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = React.useCallback( async (values) => {
    if (!executeRecaptcha) {
        return
    }
    setFormSubmitting(true)
    const reCaptchaToken = await executeRecaptcha('formSubmission')
    values.reCaptchaToken = reCaptchaToken;
    sendContactForm(values).then(
      (data) => {
        setFormStatus(data.message)
        setFormSubmitted(true)
        setFormSubmitting(false)
        handleClose()
      },
      (error) => {
        setFormStatus(error.toString())
        setFormSubmitted(true)
        setFormSubmitting(false)
        handleClose()
      }
    );
  }, [executeRecaptcha])

  return (
    <>
      <Fab
        color="primary"
        aria-label="chat"
        onClick={handleClickOpen}
        style={{ position: "fixed", bottom: 16, left: 16 }}
      >
        <ChatIcon />
      </Fab>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Contact Me</DialogTitle>
        <Formik
          initialValues={{ email: "", message: "" }}
          validationSchema={ContactSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form>
              <DialogContent>
                <DialogContentText>
                  Send me a message directly
                </DialogContentText>
                <Field
                  as={TextField}
                  autoFocus
                  margin="dense"
                  id="email"
                  name="email"
                  label="Your Email"
                  type="email"
                  fullWidth
                  variant="standard"
                  error={touched.email && !!errors.email}
                  helperText={touched.email && errors.email}
                />
                <Field
                  as={TextField}
                  margin="dense"
                  id="message"
                  name="message"
                  label="Your Message"
                  type="text"
                  fullWidth
                  multiline
                  rows={4}
                  variant="standard"
                  error={touched.message && !!errors.message}
                  helperText={touched.message && errors.message}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button type="submit" disabled={formSubmitting}>
                  Send
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
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
