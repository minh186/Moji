import express from "express";
import {
  authMe,
  searchUserByUsername,
  uploadAvatar,
  updateProfile,
} from "../controllers/userController.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.get("/me", authMe);
router.get("/search", searchUserByUsername);
router.post("/uploadAvatar", upload.single("file"), uploadAvatar);

// Cập nhật thông tin cá nhân (displayName, bio, phone)
// username và email không cho phép sửa qua đây (là định danh tài khoản)
router.patch("/profile", updateProfile);

export default router;
