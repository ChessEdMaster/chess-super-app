
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

export interface Message {
    id: string;
    role: "user" | "assistant" | "system" | "data";
    content: string;
}

export function ChatMessage({ message }: { message: Message }) {
    const isUser = message.role === "user";

    return (
        <div
            className={cn(
                "flex w-full items-start gap-4 p-4",
                isUser ? "flex-row-reverse" : "flex-row"
            )}
        >
            <div
                className={cn(
                    "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow",
                    isUser ? "bg-background" : "bg-primary text-primary-foreground"
                )}
            >
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            <div
                className={cn(
                    "flex-1 space-y-2 overflow-hidden px-1",
                    isUser ? "text-right" : "text-left"
                )}
            >
                <div className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0">
                    {/* Simple text rendering for now, could be Markdown later */}
                    <p className="whitespace-pre-wrap text-sm leading-6 text-foreground/90">
                        {message.content}
                    </p>
                </div>
            </div>
        </div>
    );
}
