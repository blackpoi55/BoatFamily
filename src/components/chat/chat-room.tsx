"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { isSameDay } from "date-fns";
import { MessageCircle } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { deleteMessage, type ChatMessage } from "@/app/actions/chat";
import { confirm as swalConfirm } from "@/lib/swal";
import { MessageBubble, DayDivider, ImageLightbox } from "./message-bubble";
import { ChatInput } from "./chat-input";

type Props = {
  initialMessages: ChatMessage[];
  currentUserId: string;
};

const CHANNEL = "family:chat";

export function ChatRoom({ initialMessages, currentUserId }: Props) {
  const t = useTranslations("chat");
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase.channel(CHANNEL);

    channel
      .on("broadcast", { event: "message" }, ({ payload }) => {
        const msg = payload as ChatMessage;
        setMessages((prev) =>
          prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
        );
      })
      .on("broadcast", { event: "delete" }, ({ payload }) => {
        const { id } = payload as { id: string };
        setMessages((prev) => prev.filter((m) => m.id !== id));
      })
      .on("broadcast", { event: "clear" }, () => {
        setMessages([]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (isAtBottomRef.current) {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const onDelete = async (msg: ChatMessage) => {
    const ok = await swalConfirm({
      title: "ลบข้อความ?",
      confirmText: "ลบ",
      danger: true,
    });
    if (!ok) return;
    const result = await deleteMessage(msg.id);
    if (result.ok) {
      setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    }
  };

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col min-h-0">
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-stone-500">
          <MessageCircle className="size-12 text-stone-300" />
          <p className="text-sm">{t("noMessages")}</p>
        </div>
        <ChatInput replyTo={replyTo} onClearReply={() => setReplyTo(null)} />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto px-3 py-2"
      >
        <div className="flex flex-col gap-1.5">
          {messages.map((msg, i) => {
            const prev = messages[i - 1];
            const next = messages[i + 1];
            const isOwn = msg.senderId === currentUserId;

            const showDayDivider =
              !prev || !isSameDay(new Date(prev.createdAt), new Date(msg.createdAt));

            const showAvatar =
              !next ||
              next.senderId !== msg.senderId ||
              !isSameDay(new Date(next.createdAt), new Date(msg.createdAt));

            const showName =
              !isOwn &&
              (!prev ||
                prev.senderId !== msg.senderId ||
                !isSameDay(new Date(prev.createdAt), new Date(msg.createdAt)));

            return (
              <div key={msg.id}>
                {showDayDivider && <DayDivider date={msg.createdAt} />}
                <MessageBubble
                  message={msg}
                  isOwn={isOwn}
                  showAvatar={showAvatar}
                  showName={showName}
                  onReply={setReplyTo}
                  onDelete={isOwn ? onDelete : undefined}
                  onOpenImage={setLightbox}
                />
              </div>
            );
          })}
        </div>
      </div>
      <ChatInput replyTo={replyTo} onClearReply={() => setReplyTo(null)} />
      <ImageLightbox url={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}
