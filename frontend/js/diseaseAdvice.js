/**
 * diseaseAdvice.js
 * Works with ANY model label format:
 *   "Raspberry___healthy"
 *   "Healthy Raspberry Plant"
 *   "healthy raspberry"
 *   "Raspberry healthy"
 * Uses keyword-based fuzzy matching so label format changes never break advice.
 */

// ── Advice Database (keyed by plant + condition, internal only) ───────────────
const ADVICE_DB = [
    // Apple
    {
        keywords: ["apple", "scab"],
        name: "Apple Scab",
        advice: "Remove and destroy fallen leaves. Apply fungicides (e.g. captan or myclobutanil) at bud break and after rain events."
    },
    {
        keywords: ["apple", "black rot"],
        name: "Apple Black Rot",
        advice: "Prune out dead or infected wood, remove mummified fruit. Apply copper-based fungicides during the growing season."
    },
    {
        keywords: ["apple", "cedar", "rust"],
        name: "Cedar Apple Rust",
        advice: "Remove nearby cedar/juniper trees if possible. Apply fungicides (myclobutanil or mancozeb) starting at pink bud stage."
    },
    {
        keywords: ["apple", "healthy"],
        name: "Healthy Apple",
        advice: "Your apple plant looks healthy! Maintain good airflow by pruning, and water at the base to prevent leaf wetness."
    },

    // Blueberry
    {
        keywords: ["blueberry", "healthy"],
        name: "Healthy Blueberry",
        advice: "Your blueberry plant looks great! Keep soil pH between 4.5–5.5 and mulch around the base to retain moisture."
    },

    // Cherry
    {
        keywords: ["cherry", "powdery mildew"],
        name: "Cherry Powdery Mildew",
        advice: "Improve air circulation by pruning dense growth. Apply sulfur-based or potassium bicarbonate fungicides at first sign of infection."
    },
    {
        keywords: ["cherry", "healthy"],
        name: "Healthy Cherry",
        advice: "Your cherry tree looks healthy! Prune after harvest to maintain shape and remove any dead branches."
    },

    // Corn
    {
        keywords: ["corn", "gray leaf spot"],
        name: "Corn Gray Leaf Spot",
        advice: "Rotate crops and plant resistant varieties. Apply fungicides (strobilurin or triazole) at tasseling if infection is severe."
    },
    {
        keywords: ["corn", "cercospora"],
        name: "Corn Gray Leaf Spot",
        advice: "Rotate crops and plant resistant varieties. Apply fungicides (strobilurin or triazole) at tasseling if infection is severe."
    },
    {
        keywords: ["corn", "common rust"],
        name: "Corn Common Rust",
        advice: "Plant rust-resistant hybrids. Apply triazole fungicides early in infection. Ensure adequate plant spacing for airflow."
    },
    {
        keywords: ["corn", "northern", "blight"],
        name: "Corn Northern Leaf Blight",
        advice: "Use resistant varieties and rotate crops. Apply fungicides at first sign of lesions, especially before tasseling."
    },
    {
        keywords: ["corn", "healthy"],
        name: "Healthy Corn",
        advice: "Your corn plant looks excellent! Ensure consistent watering and adequate nitrogen fertilization."
    },
    {
        keywords: ["maize", "healthy"],
        name: "Healthy Corn",
        advice: "Your corn plant looks excellent! Ensure consistent watering and adequate nitrogen fertilization."
    },

    // Grape
    {
        keywords: ["grape", "black rot"],
        name: "Grape Black Rot",
        advice: "Remove all mummified berries and infected leaves. Apply fungicides (mancozeb or myclobutanil) from bud break through veraison."
    },
    {
        keywords: ["grape", "esca"],
        name: "Grape Esca (Black Measles)",
        advice: "Prune infected wood and apply wound sealants after pruning. Avoid water stress and excessive fertilization."
    },
    {
        keywords: ["grape", "measles"],
        name: "Grape Esca (Black Measles)",
        advice: "Prune infected wood and apply wound sealants after pruning. Avoid water stress and excessive fertilization."
    },
    {
        keywords: ["grape", "leaf blight"],
        name: "Grape Leaf Blight",
        advice: "Remove infected leaves and improve canopy airflow by pruning. Apply copper-based fungicides preventively."
    },
    {
        keywords: ["grape", "isariopsis"],
        name: "Grape Leaf Blight",
        advice: "Remove infected leaves and improve canopy airflow by pruning. Apply copper-based fungicides preventively."
    },
    {
        keywords: ["grape", "healthy"],
        name: "Healthy Grape",
        advice: "Your grapevine looks healthy! Maintain good canopy management and monitor for pests regularly."
    },

    // Orange
    {
        keywords: ["orange", "greening"],
        name: "Citrus Greening (HLB)",
        advice: "There is no cure for HLB. Remove and destroy infected trees to prevent spread. Control the Asian citrus psyllid vector with insecticides."
    },
    {
        keywords: ["citrus", "greening"],
        name: "Citrus Greening (HLB)",
        advice: "There is no cure for HLB. Remove and destroy infected trees to prevent spread. Control the Asian citrus psyllid vector with insecticides."
    },
    {
        keywords: ["haunglongbing"],
        name: "Citrus Greening (HLB)",
        advice: "There is no cure for HLB. Remove and destroy infected trees to prevent spread. Control the Asian citrus psyllid vector with insecticides."
    },

    // Peach
    {
        keywords: ["peach", "bacterial spot"],
        name: "Peach Bacterial Spot",
        advice: "Apply copper-based bactericides during bloom and petal fall. Avoid overhead irrigation. Plant resistant varieties when possible."
    },
    {
        keywords: ["peach", "healthy"],
        name: "Healthy Peach",
        advice: "Your peach tree is in great condition! Thin fruit clusters in spring for larger, healthier fruit."
    },

    // Pepper
    {
        keywords: ["pepper", "bacterial spot"],
        name: "Bell Pepper Bacterial Spot",
        advice: "Use disease-free seeds and transplants. Apply copper fungicides early. Avoid working with plants when wet."
    },
    {
        keywords: ["pepper", "healthy"],
        name: "Healthy Bell Pepper",
        advice: "Your pepper plant is healthy! Water consistently and apply balanced fertilizer to encourage fruit set."
    },

    // Potato
    {
        keywords: ["potato", "early blight"],
        name: "Potato Early Blight",
        advice: "Remove infected leaves promptly. Apply chlorothalonil or mancozeb fungicide every 7–10 days. Ensure good soil drainage."
    },
    {
        keywords: ["potato", "late blight"],
        name: "Potato Late Blight",
        advice: "This is the pathogen that caused the Irish famine. Destroy infected plants immediately. Apply systemic fungicides (e.g. metalaxyl). Avoid overhead watering."
    },
    {
        keywords: ["potato", "healthy"],
        name: "Healthy Potato",
        advice: "Your potato plant looks healthy! Hill soil around stems and water deeply but infrequently."
    },

    // Raspberry
    {
        keywords: ["raspberry", "healthy"],
        name: "Healthy Raspberry",
        advice: "Your raspberry canes look great! Prune out old canes after fruiting to encourage new growth."
    },

    // Soybean
    {
        keywords: ["soybean", "healthy"],
        name: "Healthy Soybean",
        advice: "Your soybean plant is healthy! Monitor for aphids and spider mites during dry, hot weather."
    },

    // Squash
    {
        keywords: ["squash", "powdery mildew"],
        name: "Squash Powdery Mildew",
        advice: "Apply neem oil, potassium bicarbonate, or sulfur-based fungicides. Remove heavily infected leaves and improve air circulation."
    },

    // Strawberry
    {
        keywords: ["strawberry", "leaf scorch"],
        name: "Strawberry Leaf Scorch",
        advice: "Remove infected leaves and avoid overhead watering. Apply captan or thiram fungicides. Rotate planting beds every 3 years."
    },
    {
        keywords: ["strawberry", "healthy"],
        name: "Healthy Strawberry",
        advice: "Your strawberry plant is thriving! Mulch with straw to keep fruit off the soil and conserve moisture."
    },

    // Tomato
    {
        keywords: ["tomato", "bacterial spot"],
        name: "Tomato Bacterial Spot",
        advice: "Use copper fungicides and remove infected leaves immediately. Avoid working with plants when wet. Use disease-free seeds."
    },
    {
        keywords: ["tomato", "early blight"],
        name: "Tomato Early Blight",
        advice: "Remove lower infected leaves. Apply chlorothalonil or mancozeb every 7–10 days. Mulch around the base to prevent soil splash."
    },
    {
        keywords: ["tomato", "late blight"],
        name: "Tomato Late Blight",
        advice: "Remove and destroy infected plant material immediately. Apply systemic fungicides (metalaxyl-based). Avoid wetting foliage when watering."
    },
    {
        keywords: ["tomato", "leaf mold"],
        name: "Tomato Leaf Mold",
        advice: "Increase airflow and reduce humidity in greenhouses. Apply fungicides (chlorothalonil or copper). Remove infected leaves."
    },
    {
        keywords: ["tomato", "septoria"],
        name: "Tomato Septoria Leaf Spot",
        advice: "Remove infected leaves from the bottom up. Apply copper or mancozeb fungicides. Avoid overhead irrigation."
    },
    {
        keywords: ["tomato", "spider mite"],
        name: "Tomato Spider Mites",
        advice: "Spray plants with water to dislodge mites. Apply insecticidal soap or neem oil. Introduce predatory mites for biological control."
    },
    {
        keywords: ["tomato", "target spot"],
        name: "Tomato Target Spot",
        advice: "Improve plant spacing and airflow. Apply fungicides (azoxystrobin or chlorothalonil). Remove infected debris promptly."
    },
    {
        keywords: ["tomato", "yellow leaf curl"],
        name: "Tomato Yellow Leaf Curl Virus",
        advice: "There is no cure. Remove infected plants immediately. Control whitefly vectors with insecticides or reflective mulches. Use resistant varieties."
    },
    {
        keywords: ["tomato", "mosaic"],
        name: "Tomato Mosaic Virus",
        advice: "No cure available. Remove and destroy infected plants. Wash hands and tools after handling. Control aphid vectors. Use resistant varieties."
    },
    {
        keywords: ["tomato", "healthy"],
        name: "Healthy Tomato",
        advice: "Your tomato plant looks fantastic! Keep watering consistently and stake tall plants for support."
    }
];

/**
 * Fuzzy keyword-based lookup.
 * Converts the label to lowercase and checks how many keywords from each
 * entry are present. The entry with the most matches wins.
 *
 * Works with any label format:
 *   "Raspberry___healthy"        → matches ["raspberry","healthy"]
 *   "Healthy Raspberry Plant"    → matches ["raspberry","healthy"]
 *   "Tomato___Early_blight"      → matches ["tomato","early blight"]
 *
 * @param {string} classLabel
 * @returns {{ name: string, advice: string }}
 */
export function getAdvice(classLabel) {
    if (!classLabel) {
        return { name: "Unknown", advice: "No specific advice available. Consult a local agronomist for guidance." };
    }

    // Normalise: lowercase, replace underscores/dashes with spaces
    const normalised = classLabel.toLowerCase().replace(/[_\-]+/g, " ");

    let bestMatch = null;
    let bestScore = 0;

    for (const entry of ADVICE_DB) {
        // Count how many keywords from this entry appear in the label
        const score = entry.keywords.filter(kw => normalised.includes(kw)).length;

        // Only count as a match if ALL keywords matched (avoids partial false positives)
        if (score === entry.keywords.length && score > bestScore) {
            bestScore = score;
            bestMatch = entry;
        }
    }

    if (bestMatch) {
        console.log(`✅ Advice matched: "${classLabel}" → "${bestMatch.name}"`);
        return { name: bestMatch.name, advice: bestMatch.advice };
    }

    // Friendly fallback — at minimum show the label cleanly
    console.warn(`⚠️ No advice match for: "${classLabel}"`);
    const friendlyName = classLabel
        .replace(/___/g, " – ")
        .replace(/[_\-]+/g, " ")
        .replace(/\b\w/g, c => c.toUpperCase());

    return {
        name: friendlyName,
        advice: "No specific advice available. Consult a local agronomist for guidance."
    };
}