import nodemailer from "nodemailer";
import { google } from "googleapis";

const OAuth2 = google.auth.OAuth2;

export async function POST(req, res) {

  // Destructure the email and message from the request body
  const { email, message } = await req.json();

  console.log(email, message)

  // Create a new OAuth2 client with your credentials
  const oauth2Client = new OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground" // Redirect URL
  );
  console.log(process.env.GOOGLE_CLIENT_ID, 'id')
  
  console.log(process.env.GOOGLE_CLIENT_SECRET, 'secret ')
  console.log(process.env.GOOGLE_REFRESH_TOKEN, 'refresh token')
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  try {
    const accessToken = await oauth2Client.getAccessToken();
    // Create reusable transporter object using SMTP transport
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.EMAIL_USER,
        accessToken: accessToken.token,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      },
    });
    console.log(transporter)

    // Email data setup
    const mailOptions = {
      from: email, // sender address
      to: "morgan.collado@gmail.com", // receiver, your email
      subject: "New Message from Website", // Subject line
      text: `Email: ${email}\nMessage: ${message}`, // plain text body
      html: `<p>Email: ${email}</p><p>Message: ${message}</p>`, // HTML body
    };

    // Send email
    const result = await transporter.sendMail(mailOptions);
    console.log("Message Sent: %s", result.messageId);
    res.status(200).json({ message: "Message sent successfully!" });
  } catch (error) {
    console.error("Failed to send email: ", error);
    res.status(500).json({ error: "Failed to send message" });
  }
}
