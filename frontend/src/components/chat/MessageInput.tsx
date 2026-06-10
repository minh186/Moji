import { useAuthStore } from "@/stores/useAuthStore";
import type { Conversation } from "@/types/chat";
import React, { useRef, useState } from "react";
import { Button } from "../ui/button";
import { ImagePlus, Send, X, Loader2 } from "lucide-react";
import { Input } from "../ui/input";
import EmojiPicker from "./EmojiPicker";
import { useChatStore } from "@/stores/useChatStore";
import { chatService } from "@/services/chatService";
import { toast } from "sonner";

// ─── Giới hạn file ảnh ─────────────────────────────────────────────────────
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const MessageInput = ({ selectedConvo }: { selectedConvo: Conversation }) => {
  const { user } = useAuthStore();
  const { sendDirectMessage, sendGroupMessage } = useChatStore();

  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  // ── Chọn ảnh ──────────────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_MIME.includes(file.type)) {
      toast.error("Chỉ hỗ trợ ảnh JPG, PNG, GIF, WebP");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error(`Ảnh không được vượt quá ${MAX_FILE_SIZE_MB}MB`);
      return;
    }

    // Xoá preview cũ nếu có
    if (imagePreview) URL.revokeObjectURL(imagePreview);

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));

    // Reset input để có thể chọn lại cùng file
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Xoá ảnh đã chọn ───────────────────────────────────────────────────────
  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  };

  // ── Gửi tin nhắn ──────────────────────────────────────────────────────────
  const sendMessage = async () => {
    const trimmedText = text.trim();
    if (!trimmedText && !imageFile) return;

    const currText = trimmedText;
    setText("");

    let imgUrl: string | undefined;

    // Upload ảnh trước nếu có
    if (imageFile) {
      try {
        setUploading(true);
        imgUrl = await chatService.uploadMessageImage(imageFile);
        removeImage();
      } catch {
        toast.error("Lỗi upload ảnh. Hãy thử lại!");
        // Khôi phục text nếu upload thất bại
        setText(currText);
        return;
      } finally {
        setUploading(false);
      }
    }

    // Gửi message (text và/hoặc imgUrl)
    try {
      if (selectedConvo.type === "direct") {
        const otherUser = selectedConvo.participants.find(
          (p) => p._id !== user._id,
        );
        if (!otherUser) return;
        await sendDirectMessage(otherUser._id, currText, imgUrl);
      } else {
        await sendGroupMessage(selectedConvo._id, currText, imgUrl);
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi xảy ra khi gửi tin nhắn. Bạn hãy thử lại!");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  const canSend = (!!text.trim() || !!imageFile) && !uploading;

  return (
    <div className="flex flex-col p-3 bg-background gap-2 min-h-[56px]">
      {/* ── Preview ảnh đã chọn ── */}
      {imagePreview && (
        <div className="relative w-24 h-24 self-start">
          <img
            src={imagePreview}
            alt="Ảnh xem trước"
            className="w-24 h-24 object-cover rounded-lg border border-border shadow-sm"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 size-5 rounded-full p-0"
            onClick={removeImage}
            title="Xoá ảnh"
          >
            <X className="size-3" />
          </Button>
        </div>
      )}

      {/* ── Input row ── */}
      <div className="flex items-center gap-2">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_MIME.join(",")}
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Nút chọn ảnh */}
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-primary/10 transition-smooth shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Gửi ảnh"
        >
          <ImagePlus className="size-4" />
        </Button>

        {/* Text input */}
        <div className="flex-1 relative">
          <Input
            onKeyPress={handleKeyPress}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={uploading ? "Đang tải ảnh lên..." : "Soạn tin nhắn..."}
            disabled={uploading}
            className="pr-10 h-9 bg-white border-border/50 focus:border-primary/50 transition-smooth"
          />

          {/* Emoji picker */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="size-8 hover:bg-primary/10 transition-smooth"
            >
              <div>
                <EmojiPicker
                  onChange={(emoji: string) => setText(`${text}${emoji}`)}
                />
              </div>
            </Button>
          </div>
        </div>

        {/* Nút gửi */}
        <Button
          onClick={sendMessage}
          className="bg-gradient-chat hover:shadow-glow transition-smooth hover:scale-105 shrink-0"
          disabled={!canSend}
          title="Gửi"
        >
          {uploading ? (
            <Loader2 className="size-4 text-white animate-spin" />
          ) : (
            <Send className="size-4 text-white" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;
