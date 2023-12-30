import nodemailer from "nodemailer";
import { google } from "googleapis";
import { NextResponse } from "next/server";

const OAuth2 = google.auth.OAuth2;

export async function POST(req) {
  // Destructure the email and message from the request body
  const { email, message, reCaptchaToken } = await req.json();

  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  // Google reCAPTCHA verification URL
  const verifyUrl = `https://www.google.com/recaptcha/api/siteverify`;

  try {
    const recaptchaResponse = await fetch(verifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `secret=${secretKey}&response=${reCaptchaToken}`,
    });

    const recaptchaData = await recaptchaResponse.json();

    if (recaptchaData.success) {
      // Create a new OAuth2 client with your credentials
      const oauth2Client = new OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        "https://developers.google.com/oauthplayground" // Redirect URL
      );

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
        return NextResponse.json(
          { message: "Message sent successfully!" },
          { status: 200 }
        );
      } catch (error) {
        console.error("Failed to send email: ", error);
        return NextResponse.json(
          { error: `Internal Server Error: ${error}` },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json({ error: "reCAPTCHA verification failed" }, { status: 400 });
    }
  } catch (error) {
    console.error("Failed to send email: ", error);
    return NextResponse.json(
      { error: `Internal Server Error: ${error}` },
      { status: 500 }
    );
  }
}
