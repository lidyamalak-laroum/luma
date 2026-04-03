const transporter = require("../services/mailer.service");

// In-memory code store: { uid -> code }
const verificationCodes = {};

// POST /api/send-code
// Body: { uid, email }
exports.sendCode = async (req, res) => {
    try {
        const { uid, email } = req.body;

        if (!uid || !email) {
            return res.status(400).json({ success: false, message: "uid and email are required" });
        }

        const code = Math.floor(1000 + Math.random() * 9000).toString();
        verificationCodes[uid] = code;

        const mailOptions = {
            from: "luma.app1111@gmail.com",
            to: email,
            subject: "LUMA Verification Code",
            text: `Your verification code is: ${code}`
        };

        await transporter.sendMail(mailOptions);
        console.log(`Code sent to ${email} (uid=${uid}): ${code}`);

        return res.json({ success: true, message: "Code sent successfully" });
    } catch (error) {
        console.error(" /api/send-code error:", error);
        return res.status(500).json({ success: false, message: "Failed to send email" });
    }
};

// POST /api/verify-code
// Body: { uid, code }
exports.verifyCode = (req, res) => {
    const { uid, code } = req.body;

    if (!uid || !code) {
        return res.status(400).json({ success: false, message: "uid and code are required" });
    }

    const savedCode = verificationCodes[uid];

    if (!savedCode) {
        return res.status(400).json({
            success: false,
            message: "No code found for this user (try re-registering / resend code)"
        });
    }

    if (savedCode === code) {
        delete verificationCodes[uid];
        return res.json({ success: true, message: "Verified" });
    }

    return res.status(400).json({ success: false, message: "Invalid code" });
};
