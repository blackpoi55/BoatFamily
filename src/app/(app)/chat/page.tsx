import { requireUser } from "@/lib/auth";
import { loadInitialMessages } from "@/app/actions/chat";
import { ChatRoom } from "@/components/chat/chat-room";

export default async function ChatPage() {
  const me = await requireUser();
  const initialMessages = await loadInitialMessages(50);

  return <ChatRoom initialMessages={initialMessages} currentUserId={me.id} />;
}
