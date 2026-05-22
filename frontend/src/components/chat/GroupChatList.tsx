import { useChatStore } from "@/stores/useChatStore";
import GroupChatCard from "./GroupChatCard";

const GroupChatList = () => {
  const { conversations } = useChatStore();

  if (!conversations) return;

  const groupChats = conversations.filter((convo) => convo.type === "group");

  // Trả về container chứa toàn bộ danh sách nhóm
  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-2">
      {groupChats.map((convo) => (
        <GroupChatCard convo={convo} key={convo._id} />
      ))}
    </div>
  );
};

export default GroupChatList;
