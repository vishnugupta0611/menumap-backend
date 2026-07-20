import { Router } from "express";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(new ApiError(415, "Only image uploads are supported"));
    return cb(null, true);
  },
});

export const ocrRouter = Router();

ocrRouter.post("/menu", upload.single("menu"), asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "Menu image is required");

  if (!process.env.GEMINI_API_KEY) {
    throw new ApiError(500, "Gemini API key is not configured");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  // Using the latest gemini-3.5-flash model for 2026
  const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

  const prompt = `Extract the menu items from this image. 
Return ONLY a valid JSON array where each object has the following keys:
- "name" (string)
- "category" (string, default to "General" if unclear)
- "price" (number)
- "veg" (boolean, true if vegetarian, false if non-vegetarian)
- "description" (string, brief description if any, otherwise empty string)

Ensure the output is strictly a JSON array without any markdown formatting (no \`\`\`json). If you cannot extract any items, return [].`;

  const imagePart = {
    inlineData: {
      data: req.file.buffer.toString("base64"),
      mimeType: req.file.mimetype,
    },
  };

  try {
    const result = await model.generateContent([prompt, imagePart]);
    let text = result.response.text().trim();
    
    // Clean up potential markdown formatting if Gemini still includes it
    if (text.startsWith("\`\`\`json")) {
      text = text.replace(/^\`\`\`json/, "").replace(/\`\`\`$/, "").trim();
    } else if (text.startsWith("\`\`\`")) {
      text = text.replace(/^\`\`\`/, "").replace(/\`\`\`$/, "").trim();
    }

    let items = [];
    try {
      items = JSON.parse(text);
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", text);
      throw new ApiError(500, "Failed to parse menu items from image. The AI did not return a valid format.");
    }

    if (!Array.isArray(items)) {
      items = [];
    }

    res.json({
      sourceName: req.file.originalname,
      confidence: 0.95, // Gemini doesn't return confidence, mock high confidence
      rawText: JSON.stringify(items, null, 2),
      items,
    });
  } catch (error) {
    console.error("Gemini Vision API error:", error);
    throw new ApiError(500, "Image analysis failed");
  }
}));
