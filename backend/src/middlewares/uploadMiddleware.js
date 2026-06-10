import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

// ─── Avatar upload (1MB, crop 200×200) ────────────────────────────────────────
export const upload = multer({
  storage: multer.memoryStorage(), // lưu file trên ram thay vì ổ cứng
  limits: {
    fileSize: 1024 * 1024 * 1, // 1MB
  },
});

export const uploadImageFromBuffer = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "moji_chat/avatars",
        resource_type: "image",
        transformation: [{ width: 200, height: 200, crop: "fill" }],
        ...options,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      },
    );

    uploadStream.end(buffer);
  });
};

// ─── Message image upload (5MB, giữ tỉ lệ gốc, tối đa 1280px) ───────────────
export const uploadMessage = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024 * 5, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const ALLOWED_MIME = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (ALLOWED_MIME.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận ảnh JPG, PNG, GIF, WebP"), false);
    }
  },
});

export const uploadMessageImageFromBuffer = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "moji_chat/messages",
        resource_type: "image",
        // Giữ nguyên tỉ lệ gốc, chỉ giới hạn kích thước tối đa
        transformation: [
          { width: 1280, height: 1280, crop: "limit", quality: "auto:good" },
        ],
        ...options,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );
    uploadStream.end(buffer);
  });
};
