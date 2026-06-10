import { cn, formatMessageTime } from "@/lib/utils";
import type { Conversation, Message, Participant } from "@/types/chat";
import UserAvatar from "./UserAvatar";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { useState } from "react";

interface MessageItemProps {
  message: Message;
  index: number;
  messages: Message[];
  selectedConvo: Conversation;
  lastMessageStatus: "delivered" | "seen";
}

// ─── Lightbox đơn giản để xem ảnh full-size ──────────────────────────────────
const ImageLightbox = ({
  src,
  onClose,
}: {
  src: string;
  onClose: () => void;
}) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
    onClick={onClose}
  >
    <img
      src={src}
      alt="Ảnh phóng to"
      className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    />
  </div>
);

const MessageItem = ({
  message,
  index,
  messages,
  selectedConvo,
  lastMessageStatus,
}: MessageItemProps) => {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // Lấy phần tin nhắn trước
  const prev = index + 1 < messages.length ? messages[index + 1] : undefined;

  const isShowTime =
    index === 0 ||
    new Date(message.createdAt).getTime() -
      new Date(prev?.createdAt || 0).getTime() >
      300000; // nếu 2 tin nhắn gửi cách nhau 5 phút

  // tạo cờ để quyết định có tách nhóm tin nhắn không
  const isGroupBreak = isShowTime || message.senderId !== prev?.senderId;

  // lấy thông tin người gửi hiện tại để hiển thị tên và avatar
  const participant = selectedConvo.participants.find(
    (p: Participant) => p._id.toString() === message.senderId.toString(),
  );

  // Xác định loại nội dung
  const hasText = !!message.content;
  const hasImage = !!message.imgUrl;
  const isImageOnly = hasImage && !hasText;

  return (
    <>
      {/* Lightbox */}
      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}

      {/* Timestamp */}
      {isShowTime && (
        <span className="flex justify-center text-xs text-muted-foreground px-1">
          {formatMessageTime(new Date(message.createdAt))}
        </span>
      )}

      <div
        className={cn(
          "flex gap-2 message-bounce mt-1",
          message.isOwn ? "justify-end" : "justify-start",
        )}
      >
        {/* avatar (nếu là tin nhắn của người khác mới cần hiện avatar) */}
        {!message.isOwn && (
          <div className="w-8 shrink-0">
            {isGroupBreak && (
              <UserAvatar
                type="chat"
                name={participant?.displayName ?? "Moji"}
                avatarUrl={participant?.avatarUrl ?? undefined}
              />
            )}
          </div>
        )}

        {/* tin nhắn */}
        <div
          className={cn(
            "max-w-xs lg:max-w-md space-y-1 flex flex-col",
            message.isOwn ? "items-end" : "items-start",
          )}
        >
          <Card
            className={cn(
              message.isOwn
                ? "chat-bubble-sent border-0"
                : "chat-bubble-received",
              // Bỏ padding nếu chỉ có ảnh để ảnh sát viền bubble
              isImageOnly ? "p-0 overflow-hidden" : "p-3",
            )}
          >
            {/* Ảnh (nếu có) */}
            {hasImage && (
              <img
                src={message.imgUrl!}
                alt="Ảnh tin nhắn"
                className={cn(
                  "cursor-pointer object-contain hover:opacity-90 transition-opacity",
                  // Ảnh kèm text thì có margin dưới, rounded khác
                  isImageOnly
                    ? "rounded-[inherit] max-w-full block"
                    : "rounded-md mb-2 max-w-full block",
                )}
                style={{ maxWidth: 280, maxHeight: 320 }}
                onClick={() => setLightboxSrc(message.imgUrl!)}
                loading="lazy"
              />
            )}

            {/* Text (nếu có) */}
            {hasText && (
              <p className="text-sm leading-relaxed break-words">
                {message.content}
              </p>
            )}
          </Card>

          {/* seen/ delivered */}
          {message.isOwn && message._id === selectedConvo.lastMessage?._id && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs px-1.5 py-0.5 h-4 border-0",
                lastMessageStatus === "seen"
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {lastMessageStatus}
            </Badge>
          )}
        </div>
      </div>
    </>
  );
};

export default MessageItem;
