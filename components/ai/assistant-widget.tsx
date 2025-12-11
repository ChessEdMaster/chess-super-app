
"use client";

import { useChat } from "@ai-sdk/react";
import { Bot, X, Send } from "lucide-react";
import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatMessage } from "./chat-message";
import { AnimatePresence, motion } from "framer-motion";
import { useUIStore } from "@/lib/store/ui-store";

export function AssistantWidget() {
    const { isAssistantOpen, setAssistantOpen } = useUIStore();
    const scrollRef = useRef<HTMLDivElement>(null);

    const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
        api: '/api/chat',
        onError: (err) => {
            console.error("Chat Error:", err);
        },
    });

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isAssistantOpen, isLoading]);

    return (
        <AnimatePresence>
            {isAssistantOpen && (
                <div className="fixed top-20 right-4 z-50 flex flex-col items-end gap-2">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Card className="w-[380px] h-[calc(100vh-6rem)] max-h-[600px] flex flex-col shadow-2xl border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 border-b">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-primary/10 rounded-full">
                                        <Bot className="w-5 h-5 text-primary" />
                                    </div>
                                    <CardTitle className="text-base font-medium">Chess Guide</CardTitle>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setAssistantOpen(false)} className="h-8 w-8">
                                    <X className="w-4 h-4" />
                                </Button>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-auto p-0 scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent">
                                {(!messages || messages.length === 0) ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground space-y-2">
                                        <Bot className="w-12 h-12 opacity-20" />
                                        <p className="text-sm">Hi! I'm your Chess Assistant.</p>
                                        <p className="text-xs">Ask me about the game, features, or how to build this app!</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4 p-4">
                                        {messages.map((m) => (
                                            <ChatMessage key={m.id} message={m} />
                                        ))}
                                        {isLoading && (
                                            <div className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground">
                                                <span className="animate-pulse">Thinking...</span>
                                            </div>
                                        )}
                                        <div ref={scrollRef} />
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="flex flex-col p-4 border-t gap-2 items-stretch">
                                {error && (
                                    <div className="p-2 bg-destructive/10 text-destructive text-xs rounded border border-destructive/20 break-words mb-2">
                                        Error: {error.message || "Something went wrong. check your API Key."}
                                    </div>
                                )}
                                <form onSubmit={handleSubmit} className="flex w-full gap-2">
                                    <Input
                                        value={input}
                                        onChange={handleInputChange}
                                        placeholder="Ask something..."
                                        className="flex-1"
                                    />
                                    <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </form>
                            </CardFooter>
                        </Card>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
