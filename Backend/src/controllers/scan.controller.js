/**
 * scan.controller.js
 * Sends the uploaded image to the Hugging Face Inference API
 * and returns the top disease prediction to the frontend.
 *
 * HF model: linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification
 * HF API returns: [{ label: "Tomato___Bacterial_spot", score: 0.99 }, ...]
 *
 * Frontend (home.js) expects:
 *   result.predictions[0].class  ← primary path
 *   result.class                  ← fallback
 */

const fetch = require("node-fetch");
const fs = require("fs");

const HF_API_URL =
    "https://router.huggingface.co/hf-inference/models/linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification";


exports.scan = async (req, res) => {
    // ── 1. Validate upload ────────────────────────────────────────────────────
    if (!req.file) {
        return res.status(400).json({ success: false, message: "No image uploaded" });
    }

    const apiKey = process.env.HF_API_KEY;
    if (!apiKey) {
        fs.unlink(req.file.path, () => { });
        return res.status(500).json({ success: false, message: "HF_API_KEY is not set in .env" });
    }

    let imageBuffer;
    try {
        imageBuffer = fs.readFileSync(req.file.path);
    } catch (readErr) {
        return res.status(500).json({ success: false, message: "Failed to read uploaded file" });
    } finally {
        fs.unlink(req.file.path, () => { });
    }

    // ── 2. Call Hugging Face Inference API ───────────────────────────────────
    let hfResponse;
    try {
        hfResponse = await fetch(HF_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": req.file.mimetype || "image/jpeg"
            },
            body: imageBuffer
        });
    } catch (netErr) {
        console.error("❌ Network error calling HF API:", netErr.message);
        return res.status(502).json({ success: false, message: "Could not reach Hugging Face API" });
    }

    // ── 3. Handle HF-level errors ────────────────────────────────────────────
    if (!hfResponse.ok) {
        const errText = await hfResponse.text().catch(() => "");
        console.error(`❌ HF API ${hfResponse.status}:`, errText);

        if (hfResponse.status === 503) {
            return res.status(503).json({
                success: false,
                message: "Model is loading. Please wait a moment and try again.",
                retryAfter: 20
            });
        }

        // ✅ ADDED: Specific 410 guard in case of any other stale URLs
        if (hfResponse.status === 410) {
            return res.status(502).json({
                success: false,
                message: "HuggingFace API endpoint is outdated. Check HF_API_URL in scan.controller.js."
            });
        }

        return res.status(502).json({
            success: false,
            message: `Hugging Face API error: ${hfResponse.status}`,
            detail: errText.slice(0, 200)
        });
    }

    // ── 4. Parse predictions ─────────────────────────────────────────────────
    let predictions;
    try {
        predictions = await hfResponse.json();
    } catch (parseErr) {
        console.error("❌ Failed to parse HF response as JSON:", parseErr.message);
        return res.status(502).json({ success: false, message: "Invalid response from Hugging Face API" });
    }

    if (!Array.isArray(predictions) || predictions.length === 0) {
        console.error("❌ Unexpected HF payload shape:", predictions);
        return res.status(502).json({ success: false, message: "Unexpected response shape from Hugging Face" });
    }

    const top = predictions[0];
    const classLabel = top.label;
    const confidence = top.score;

    console.log(`✅ HF prediction: "${classLabel}" (${(confidence * 100).toFixed(1)}%)`);

    return res.json({
        success: true,
        class: classLabel,
        confidence,
        predictions: predictions.map((p) => ({
            class: p.label,
            score: p.score
        }))
    });
};
