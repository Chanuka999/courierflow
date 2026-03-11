import fs from "fs";
import path from "path";
import multer from "multer";

const isVercel = process.env.VERCEL === "1";
const uploadsRoot = isVercel
  ? path.join("/tmp", "uploads", "proofs")
  : path.resolve("src", "uploads", "proofs");

const ensureUploadsDir = () => {
  if (!fs.existsSync(uploadsRoot)) {
    fs.mkdirSync(uploadsRoot, { recursive: true });
  }
};

try {
  ensureUploadsDir();
} catch (error) {
  // On read-only filesystems, avoid crashing during module initialization.
  console.error("Upload directory initialization failed", error.message);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      ensureUploadsDir();
      cb(null, uploadsRoot);
    } catch (error) {
      cb(error);
    }
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
