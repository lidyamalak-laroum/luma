// ===================== REQUIREMENTS =====================
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const multer = require("multer");
const { spawn } = require("child_process");

const app = express();
const PORT = 5000;

// ===================== MIDDLEWARE =====================
app.use(cors()); // (Dev) allow all
app.use(express.json());

const upload = multer({ dest: "uploads/" });

// ===================== IN-MEMORY CODES =====================
// Key = uid, Value = code
const verificationCodes = {};

// ===================== NODEMAILER =====================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "luma.app1111@gmail.com",
    pass: "ugsi xika mwtw odnf" // Gmail App Password
  }
});

// (Optional) quick check in terminal when server starts
transporter.verify((err) => {
  if (err) console.error("Nodemailer verify failed:", err);
  else console.log("Nodemailer ready ✅");
});

// ===================== SEND VERIFICATION CODE =====================
// expects: { uid, email }
app.post("/api/send-code", async (req, res) => {
  try {
    const { uid, email } = req.body;

    if (!uid || !email) {
      return res.status(400).json({
        success: false,
        message: "uid and email are required"
      });
    }

    // 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    verificationCodes[uid] = code;

    const mailOptions = {
      from: "luma.app1111@gmail.com",
      to: email,
      subject: "LUMA Verification Code",
      text: `Your verification code is: ${code}`
    };

    await transporter.sendMail(mailOptions);

    console.log(`✅ Code sent to ${email} (uid=${uid}): ${code}`);

    return res.json({
      success: true,
      message: "Code sent successfully"
    });
  } catch (error) {
    console.error("❌ /api/send-code error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send email"
    });
  }
});

// ===================== VERIFY CODE =====================
// expects: { uid, code }
app.post("/api/verify-code", (req, res) => {
  const { uid, code } = req.body;

  if (!uid || !code) {
    return res.status(400).json({
      success: false,
      message: "uid and code are required"
    });
  }

  const savedCode = verificationCodes[uid];

  if (!savedCode) {
    return res.status(400).json({
      success: false,
      message: "No code found for this user (try re-registering / resend code)"
    });
  }

  if (savedCode === code) {
    delete verificationCodes[uid]; // cleanup after success
    return res.json({
      success: true,
      message: "Verified"
    });
  }

  return res.status(400).json({
    success: false,
    message: "Invalid code"
  });
});

// ===================== IMAGE SCAN (ML MODEL) =====================
// expects: multipart/form-data with field name: "image"
app.post("/api/scan", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image uploaded"
      });
    }

    const imagePath = req.file.path;
    const py = spawn("python", ["model.py", imagePath]);

    let stdout = "";
    let stderr = "";

    py.stdout.on("data", (data) => (stdout += data.toString()));
    py.stderr.on("data", (data) => (stderr += data.toString()));

    py.on("close", () => {
      try {
        if (stderr) console.error("🐍 Python stderr:", stderr);

        // model.py should print JSON string
        const parsed = JSON.parse(stdout);

        // Frontend expects something like: { diagnosis, advice, healthy } OR raw model output
        // We'll support both by normalizing:
        const prediction = parsed.prediction ?? parsed;

        return res.json({
          success: true,
          ...prediction
        });
      } catch (e) {
        console.error("❌ JSON parse error:", e);
        return res.status(500).json({
          success: false,
          message: "Model failed to return valid JSON",
          raw: stdout
        });
      }
    });
  } catch (error) {
    console.error("❌ /api/scan server error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ===================== HEALTH CHECK =====================
app.get("/", (req, res) => {
  res.send("LUMA Backend is running");
});

// ===================== START =====================
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


