const ContactUs = require("../models/contactUsModel");
const nodemailer = require("nodemailer");

// Function to create a query
const createQuery = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    const newQuery = new ContactUs({
      name,
      email,
      subject,
      message,
    });

    await newQuery.save();

    res.status(201).json({ message: "Query created successfully" });

    sendEmailNotification(name, email, subject, message);
  } catch (error) {
    console.error("Error creating query:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Function to send email notification
const sendEmailNotification = async (name, email, subject, message) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.EMAILUSER,
        pass: process.env.EMAILPASSWORD,
      },
    });

    // Email message options
    const mailOptions = {
      from: process.env.EMAILUSER,
      to: email,
      subject: "Thank you for contacting us",
      html: `
        <html>
          <body style="font-family: Arial, sans-serif;">
            <h2>Dear ${name},</h2>
            <p>Thank you for contacting us. We have received your message regarding '${subject}' and appreciate your interest in our services.</p>
            <p>Your message:</p>
            <blockquote>${message}</blockquote>
            <p>We will review your message and get back to you as soon as possible. If you have any further questions or concerns, feel free to reach out to us.</p>
            <p>Best regards,</p>
            <p>The Support Team</p>
          </body>
        </html>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    console.log("Email notification sent successfully");
  } catch (error) {
    console.error("Error sending email notification:", error);
  }
};

module.exports = { createQuery };
