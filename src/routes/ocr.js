import { Router } from "express";
import multer from "multer";
import { createWorker } from "tesseract.js";
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

function parseMenuText(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const priceMatch = line.match(/(?:rs\.?|inr|₹|\$)?\s*(\d{2,5})(?:\.\d{1,2})?/i);
      if (!priceMatch) return null;
      const price = Number(priceMatch[1]);
      const name = line.replace(priceMatch[0], "").replace(/[.\-–—]+$/, "").trim();
      if (!name || name.length < 3) return null;
      return {
        name,
        category: "Imported",
        price,
        veg: !/chicken|mutton|fish|egg|prawn|beef/i.test(name),
        description: "",
      };
    })
    .filter(Boolean);
}

export const ocrRouter = Router();

ocrRouter.post("/menu", upload.single("menu"), asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "Menu image is required");

  const worker = await createWorker("eng");
  try {
    const result = await worker.recognize(req.file.buffer);
    const items = parseMenuText(result.data.text);
    res.json({
      sourceName: req.file.originalname,
      confidence: result.data.confidence / 100,
      rawText: result.data.text,
      items,
    });
  } finally {
    await worker.terminate();
  }
}));
