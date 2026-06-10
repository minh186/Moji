import express from "express";

import {
  uploadMessageImage,
  sendDirectMessage,
  sendGroupMessage,
} from "../controllers/messageController.js";
import {
  checkFriendship,
  checkGroupMembership,
} from "../middlewares/friendMiddleware.js";
import { uploadMessage } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// Upload ảnh lên Cloudinary, trả về imgUrl để dùng khi gửi message
// (route này được bảo vệ bởi protectedRoute ở server.js)
router.post("/upload-image", uploadMessage.single("image"), uploadMessageImage);

router.post("/direct", checkFriendship, sendDirectMessage);
router.post("/group", checkGroupMembership, sendGroupMessage);

export default router;
