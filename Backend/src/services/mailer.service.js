const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
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
