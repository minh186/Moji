import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import {
  emitNewMessage,
  updateConversationAfterCreateMessage,
} from "../utils/messageHelper.js";
import { io } from "../socket/index.js";
import { uploadMessageImageFromBuffer } from "../middlewares/uploadMiddleware.js";

// ─── Upload ảnh tin nhắn lên Cloudinary ───────────────────────────────────────
// POST /api/messages/upload-image
export const uploadMessageImage = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "Không tìm thấy file ảnh" });
    }

    const result = await uploadMessageImageFromBuffer(file.buffer);

    return res.status(200).json({
      imgUrl: result.secure_url,
      publicId: result.public_id, // giữ lại để xoá sau nếu cần
    });
  } catch (error) {
    console.error("Lỗi khi upload ảnh tin nhắn", error);
    return res.status(500).json({ message: "Lỗi upload ảnh" });
  }
};

// ─── Gửi tin nhắn trực tiếp (direct) ─────────────────────────────────────────
// POST /api/messages/direct
export const sendDirectMessage = async (req, res) => {
  try {
    const { recipientId, content, conversationId, imgUrl } = req.body;
    const senderId = req.user._id;

    // Phải có ít nhất 1 trong 2: text hoặc ảnh
    if (!content?.trim() && !imgUrl) {
      return res
        .status(400)
        .json({ message: "Tin nhắn phải có nội dung hoặc ảnh" });
    }

    // biến lưu thông tin cuộc trò chuyện
    let conversation;

    // tìm conversation trong db
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    }

    // nếu không có hoặc không tìm thấy, tạo conversation mới
    if (!conversation) {
      conversation = await Conversation.create({
        type: "direct",
        participants: [
          { userId: senderId, joinedAt: new Date() },
          { userId: recipientId, joinedAt: new Date() },
        ],
        lastMessageAt: new Date(),
        unreadCounts: new Map(),
      });
    }

    // tạo tin nhắn mới
    const message = await Message.create({
      conversationId: conversation._id,
      senderId,
      content: content?.trim() || null,
      imgUrl: imgUrl || null,
    });

    updateConversationAfterCreateMessage(conversation, message, senderId);

    // lưu lại tất cả thay đổi
    await conversation.save();

    emitNewMessage(io, conversation, message);

    return res.status(201).json({ message });
  } catch (error) {
    console.error("Lỗi xảy ra khi gửi tin nhắn trực tiếp", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// ─── Gửi tin nhắn nhóm (group) ────────────────────────────────────────────────
// POST /api/messages/group
export const sendGroupMessage = async (req, res) => {
  try {
    const { conversationId, content, imgUrl } = req.body;
    const senderId = req.user._id;
    const conversation = req.conversation;

    // Phải có ít nhất 1 trong 2: text hoặc ảnh
    if (!content?.trim() && !imgUrl) {
      return res
        .status(400)
        .json({ message: "Tin nhắn phải có nội dung hoặc ảnh" });
    }

    // tạo tin nhắn mới
    const message = await Message.create({
      conversationId,
      senderId,
      content: content?.trim() || null,
      imgUrl: imgUrl || null,
    });

    // cập nhật lại thông tin cuộc trò chuyện
    updateConversationAfterCreateMessage(conversation, message, senderId);

    // lưu lại conversation
    await conversation.save();

    emitNewMessage(io, conversation, message);

    return res.status(201).json({ message });
  } catch (error) {
    console.error("Lỗi xảy ra khi gửi tin nhắn nhóm", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
