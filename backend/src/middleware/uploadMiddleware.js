import fs from "fs";
import path from "path";
import multer from "multer";

const uploadsRoot = path.resolve("src", "uploads", "proofs");

if (!fs.existsSync(uploadsRoot)) {
  fs.mkdirSync(uploadsRoot, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsRoot);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname || "").toLowerCase();
    const safeExtension = extension || ".jpg";
    cb(
      null,
      `proof-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExtension}`,
    );
  },
});

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    cb(new Error("Only image uploads are allowed"));
    return;
  }

  cb(null, true);
};

export const uploadProofImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});
