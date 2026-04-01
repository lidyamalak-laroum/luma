const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS // Gmail App Password
  }
});

// Verify connection when server starts
transporter.verify((err) => {
  if (err) console.error("Nodemailer verify failed:", err);
  else console.log("Nodemailer ready ✅");
});

module.exports = transporter;
