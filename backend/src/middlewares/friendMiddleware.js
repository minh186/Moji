import Conversation from "../models/Conversation.js";
import Friend from "../models/Friend.js";

// hàm hoán đổi a và b nếu a>b
const pair = (a, b) => (a < b ? [a, b] : [b, a]);

export const checkFriendship = async (req, res, next) => {
  try {
    // id của user đang đăng nhập
    const me = req.user._id.toString();

    const recipientId = req.body?.recipientId ?? null;

    const memberIds = req.body?.memberIds ?? [];

    if (!recipientId && memberIds.length === 0) {
      return res
        .status(400)
        .json({ message: "Cần cung cấp recipientId hoặc memberIds" });
    }

    if (recipientId) {
      // sắp xếp thứ tự userA và userB 1 cách nhất quán trước khi truy vấn
      const [userA, userB] = pair(me, recipientId);

      // kiểm tra userA và userB có phải bạn bè không
      const isFriend = await Friend.findOne({ userA, userB });

      if (!isFriend) {
        return res
          .status(403)
          .json({ message: "Bạn chưa kết bạn với người này" });
      }

      return next(); // middleware cho request đi tiếp
    }

    // -> chat nhóm
    // kiểm tra các thành viên được thêm vào nhóm có phải là bạn của người tạo không
    const friendChecks = memberIds.map(async (memberId) => {
      // chuẩn hóa thứ tự 2 user trước khi truy vấn
      const [userA, userB] = pair(me, memberId);

      // kiểm tra mối quan hệ bạn bè
      const friend = await Friend.findOne({ userA, userB });
      return friend ? null : memberId;
    });

    const results = await Promise.all(friendChecks);
    const notFriends = results.filter(Boolean);

    if (notFriends.length > 0) {
      return res
        .status(403)
        .json({ message: "Bạn chỉ có thể thêm bạn bè vào nhóm.", notFriends });
    }

    next();
  } catch (error) {
    console.error("Lỗi xảy ra khi checkFriendship", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const checkGroupMembership = async (req, res, next) => {
  try {
    const { conversationId } = req.body;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy cuộc trò chuyện" });
    }

    // kiểm tra user có phải thành viên của nhóm không
    const isMember = conversation.participants.some(
      (p) => p.userId.toString() === userId.toString(),
    );

    if (!isMember) {
      return res.status(403).json({ message: "Bạn không ở trong group này." });
    }

    req.conversation = conversation;

    next();
  } catch (error) {
    console.error("Lỗi checkGroupMembership", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
