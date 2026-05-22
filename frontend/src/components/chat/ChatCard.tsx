import { Card } from "@/components/ui/card";
import { formatOnlineTime, cn } from "@/lib/utils";
import { MoreHorizontal } from "lucide-react";
import type React from "react";

interface ChatCardProps {
  convoId: string;
  name: string;
  timestamp?: Date;
  isActive: boolean; // cho biết hộp chat có đang được lựa chọn không
  onSelect: (id: string) => void; // hàm xử lý khi người dùng click
  unreadCount?: number; // số tin nhắn chưa đọc
  leftSection: React.ReactNode; // avatar
  subtitle: React.ReactNode; // review của tin nhắn cuối hoặc số lượng thành viên trong nhóm
}

const ChatCard = ({
  convoId,
  name,
  timestamp,
  isActive,
  onSelect,
  unreadCount,
  leftSection,
  subtitle,
}: ChatCardProps) => {
  return (
    <Card
      key={convoId}
      className={cn(
        "border-none p-3 cursor-pointer transition-smooth glass hover:bg-muted/30",
        isActive &&
          "ring-2 ring-primary/50 bg-gradient-to-tr from-primary-glow/10 to-primary-foreground",
      )}
      onClick={() => onSelect(convoId)} // cập nhật conversation nào đang active để hiển thị nội dung chat tương ứng
    >
      <div className="flex items-center gap-3">
        {/* Bên trái - phần avatar */}
        <div className="relative">{leftSection}</div>

        {/* Bên phải - phần nội dung văn bản */}
        <div className="flex-1 min-w-0">
          {/* Dòng đầu hiện tên và thời gian */}
          <div className="flex items-center justify-between mb-1">
            {/* Tên cuộc hội thoại hoặc tên người chat */}
            <h3
              className={cn(
                "font-semibold text-sm truncate",
                unreadCount && unreadCount > 0 && "text-foreground",
              )}
            >
              {name}
            </h3>

            <span className="text-xs text-muted-foreground">
              {timestamp ? formatOnlineTime(timestamp) : ""}
            </span>
          </div>

          {/* Hiển thị subtitle và dấu ... */}
          <div className="flex items-center justify-between">
            {/* subtitle */}
            <div className="flex items-center gap-1 flex-1 min-w-0">
              {subtitle}
            </div>
            {/* icon ... */}
            <MoreHorizontal className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 hover:size-5 transition-smooth" />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ChatCard;
