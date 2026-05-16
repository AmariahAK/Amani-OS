import { useEffect, useRef } from "react";
import { useAppStore } from "../../store/appStore";
import { messagesToChatTurns, mergeAssistantTurn, turnHasContent } from "../../utils/chatTurns";
import { getMessageText } from "../../utils/exchanges";
import { stripInternalDocumentContext } from "../../utils/messageDisplay";
import { MessageBubble } from "./MessageBubble";
import { AssistantTurnBubble } from "./AssistantTurnBubble";
import { WelcomeScreen } from "./WelcomeScreen";
import { ErrorBanner } from "./ErrorBanner";
import type { AgentMessage } from "@mariozechner/pi-agent-core";

export function ChatArea() {
  const messages = useAppStore((s) => s.messages);
  const streaming = useAppStore((s) => s.streaming);
  const streamPhase = useAppStore((s) => s.streamPhase);
  const activeTool = useAppStore((s) => s.activeTool);
  const editUserMessage = useAppStore((s) => s.editUserMessage);
  const showToast = useAppStore((s) => s.showToast);
  const sessionAttachments = useAppStore((s) => s.sessionAttachments);
  const bottomRef = useRef<HTMLDivElement>(null);

  const turns = messagesToChatTurns(messages, 20);
  const showWelcome = messages.length === 0 && !streaming;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming, streamPhase, activeTool]);

  const findMessageIndex = (msg: AgentMessage) => messages.indexOf(msg);

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(label);
    } catch {
      showToast("Could not copy");
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {showWelcome ? (
        <WelcomeScreen />
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
          {turns.map((turn, turnIndex) => {
            if (!turnHasContent(turn) && !(streaming && turnIndex === turns.length - 1)) {
              return null;
            }

            const isLastTurn = turnIndex === turns.length - 1;
            const inProgress = streaming && isLastTurn;
            const merged = mergeAssistantTurn(turn.assistants);
            const phase =
              streamPhase === "idle" ? "streaming" : (streamPhase as "streaming" | "tools" | "continuing");

            return (
              <div key={turn.id}>
                {turn.user && (
                  <MessageBubble
                    message={turn.user}
                    role="user"
                    sessionAttachments={sessionAttachments}
                    onEdit={(newText) => {
                      const idx = findMessageIndex(turn.user!);
                      if (idx >= 0) void editUserMessage(idx, newText);
                    }}
                    onCopy={() => {
                      const visible = stripInternalDocumentContext(getMessageText(turn.user!));
                      void copyText(visible, "Copied message");
                    }}
                  />
                )}
                {(turn.assistants.length > 0 || inProgress) && (
                  <AssistantTurnBubble
                    content={merged}
                    inProgress={inProgress}
                    streamPhase={phase}
                    activeToolLabel={activeTool}
                    onCopy={() => {
                      const copyContent = [merged.text, merged.thinking].filter(Boolean).join("\n\n");
                      void copyText(copyContent || "No content", "Copied response");
                    }}
                  />
                )}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}

      <div className="shrink-0 px-4 pb-2 md:px-8">
        <ErrorBanner />
      </div>
    </div>
  );
}
