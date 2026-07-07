import type { ChatMessage as ChatMessageType } from "@/stores/coach";
import { ChatMessage } from "./ChatMessage";

export function MessageList({
  messages,
  streaming,
}: {
  messages: ChatMessageType[];
  streaming: boolean;
}) {
  return (
    <div className="flex flex-col gap-6 py-4">
      {messages.map((m, i) => (
        <ChatMessage
          key={m.id}
          message={m}
          isStreaming={streaming}
          isLast={i === messages.length - 1}
        />
      ))}
    </div>
  );
}
