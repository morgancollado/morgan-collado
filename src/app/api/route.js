import { NextResponse } from "next/server";
import sgMail from '@sendgrid/mail';

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

      sgMail.setApiKey(process.env.SENDGRID_API_KEY)
      try {


        // Email data setup
        const mailOptions = {
          from: "contactform@morgancollado.com", // sender address
          to: "morgan.collado@gmail.com", // receiver, your email
          subject: "New Message from Website", // Subject line
          text: `Email: ${email}\nMessage: ${message}`, // plain text body
          html: `<p>Email: ${email}</p><p>Message: ${message}</p>`, // HTML body
        };

        // Send email
        await sgMail.send(mailOptions);
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
      return NextResponse.json(
        { error: "reCAPTCHA verification failed" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Failed to send email: ", error);
    return NextResponse.json(
      { error: `Internal Server Error: ${error}` },
      { status: 500 }
    );
  }
}
