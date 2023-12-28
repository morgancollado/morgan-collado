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
} from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";

const ContactSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Required"),
  message: Yup.string().required("Required"),
});

async function sendContactForm(data) {
  // Placeholder for your API endpoint
  console.log(data)
  const endpoint = "/api";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(data),
  });
  console.log(response.json(), "response")
  return response.json(); // or handle errors accordingly
}

function ContactFormDialog() {
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <>
      <Fab
        color="primary"
        aria-label="chat"
        onClick={handleClickOpen}
        style={{ position: "fixed", bottom: 16, right: 16 }}
      >
        <ChatIcon />
      </Fab>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Contact Me</DialogTitle>
        <Formik
          initialValues={{ email: "", message: "" }}
          validationSchema={ContactSchema}
          onSubmit={(values, { setSubmitting }) => {
            sendContactForm(values).then(
              (data) => {
                // Handle success response
                setSubmitting(false);
                handleClose(); // Close the dialog upon success
              },
              (error) => {
                // Handle errors here if you like
                setSubmitting(false);
              }
            );
          }}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form>
              <DialogContent>
                <DialogContentText>
                  Send me a message directly or email me at
                  morgan.collado@gmail.com!
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
                <Button type="submit" disabled={isSubmitting}>
                  Send
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </>
  );
}

export default ContactFormDialog;
