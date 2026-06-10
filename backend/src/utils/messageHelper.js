export const updateConversationAfterCreateMessage = (
  conversation,
  message,
  senderId,
) => {
  // Nếu là ảnh-only thì hiển thị emoji ảnh ở sidebar
  const lastMessageContent =
    message.content || (message.imgUrl ? "📷 Đã gửi một ảnh" : "");

  conversation.set({
    // khi tin nhắn gửi đi, reset trạng thái đã xem
    seenBy: [],
    // cập nhật thông tin
    lastMessageAt: message.createdAt,
    lastMessage: {
      _id: message._id,
      content: message.content,
      senderId,
      createdAt: message.createdAt,
    },
  });

  // xử lý số tin nhắn chưa đọc của mỗi người
  // khi có tin nhắn mới, tin nhắn chưa đọc của người gửi = 0, của người nhận +1
  conversation.participants.forEach((p) => {
    const memberId = p.userId.toString();
    const isSender = memberId === senderId.toString();
    const prevCount = conversation.unreadCounts.get(memberId) || 0;
    conversation.unreadCounts.set(memberId, isSender ? 0 : prevCount + 1);
  });
};

// Emit event "new-message" tới tất cả thành viên trong conversation
export const emitNewMessage = (io, conversation, message) => {
  io.to(conversation._id.toString()).emit("new-message", {
    message,
    conversation: {
      _id: conversation._id,
      lastMessage: conversation.lastMessage,
      lastMessageAt: conversation.lastMessageAt,
    },
    unreadCounts: conversation.unreadCounts,
  });
};
