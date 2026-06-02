"use client";

import { useRef, useEffect, useState, useTransition } from "react";
import { Send, MessageSquare } from "lucide-react";
import { toast } from "sonner";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sendMessageToAdminAction } from "@/lib/vendor/actions";

type Message = {
  id: string;
  body: string;
  createdAt: Date;
  readAt: Date | null;
  sender: { id: string; name: string; image: string | null; role: string };
};

export function VendorMessagesView({
  messages,
  vendorUserId,
  adminName,
  adminImage,
}: {
  messages: Message[];
  vendorUserId: string;
  adminName: string;
  adminImage: string | null;
}) {
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function handleSend() {
    if (!body.trim()) return;
    startTransition(async () => {
      const r = await sendMessageToAdminAction(body.trim());
      if (r.success) {
        toast.success("Message sent to admin");
        setBody("");
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-zinc-950">Messages</h2>
        <p className="mt-0.5 text-sm text-zinc-400">
          Direct communication channel with ZainStore Admin.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Avatar name={adminName} image={adminImage} size="sm" />
            <div>
              <CardTitle>{adminName}</CardTitle>
              <p className="text-xs text-zinc-400">ZainStore Admin · Usually responds within 24 hours</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Message thread */}
          <div className="flex h-[460px] flex-col gap-4 overflow-y-auto bg-zinc-50/50 p-5">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-zinc-400">
                <MessageSquare size={36} className="opacity-20" />
                <p className="text-sm">No messages yet.</p>
                <p className="text-xs text-zinc-300">Send a message to the admin below.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender.id === vendorUserId;
                return (
                  <div key={msg.id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                    <Avatar
                      name={msg.sender.name}
                      image={msg.sender.image}
                      size="sm"
                      className="shrink-0"
                    />
                    <div className={`max-w-[72%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                      <div
                        className={`rounded-2xl px-4 py-2.5 ${
                          isMe
                            ? "rounded-tr-sm bg-brand-500 text-white"
                            : "rounded-tl-sm bg-white border border-zinc-200 text-zinc-800"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.body}</p>
                      </div>
                      <p className={`mt-1 text-xs ${isMe ? "text-zinc-400" : "text-zinc-400"}`}>
                        {new Date(msg.createdAt).toLocaleString("en-PK", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {isMe && msg.readAt && (
                          <span className="ml-1 text-brand-500">· Read</span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Compose */}
          <div className="border-t border-zinc-100 p-4">
            <div className="flex gap-3">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Type your message to admin…"
                rows={3}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSend();
                }}
                className="flex-1 resize-none rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
              <Button
                onClick={handleSend}
                disabled={isPending || !body.trim()}
                className="self-end gap-2"
              >
                <Send size={15} />
                Send
              </Button>
            </div>
            <p className="mt-1.5 text-xs text-zinc-400">Ctrl+Enter to send</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
