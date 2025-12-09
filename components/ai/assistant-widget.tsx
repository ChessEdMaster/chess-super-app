
"use client";

import { useChat } from "@ai-sdk/react";
import { Bot, MessageSquare, X, Send } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatMessage } from "./chat-message";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

export function AssistantWidget() {
    const [isOpen, setIsOpen] = useState(false);

    // cast to any to verify runtime behavior of the new SDK version
    const chatHelpers = useChat({
        // api: '/api/chat', // Default is often /api/chat, let's rely on default or explicit if needed
        onError: (err) => console.error("Chat Error:", err)
    }) as any;

    // Destructure based on inspection of type definitions: uses sendMessage and status
    const { messages = [], sendMessage, status, error } = chatHelpers;
    const isLoading = status === 'streaming' || status === 'submitted';

    const [localInput, setLocalInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    useEffect(() => {
        // Debug logging to verify what we actually get
        console.log("Chat Helpers Object:", chatHelpers);
    }, [chatHelpers]);

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!localInput.trim()) return;

        // Manually send user message using sendMessage if available
        if (typeof sendMessage === 'function') {
            await sendMessage({
                role: 'user',
                content: localInput
            });
        } else if (typeof chatHelpers.append === 'function') {
            // Fallback to append if looking at wrong types
            await chatHelpers.append({
                role: 'user',
                content: localInput
            });
        } else {
            console.error("No sendMessage or append function found in useChat result", chatHelpers);
        }

        setLocalInput("");
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Card className="w-[380px] h-[600px] flex flex-col shadow-2xl border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 border-b">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-primary/10 rounded-full">
                                        <Bot className="w-5 h-5 text-primary" />
                                    </div>
                                    <CardTitle className="text-base font-medium">Chess Guide</CardTitle>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
                                    <X className="w-4 h-4" />
                                </Button>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-auto p-0 space-y-4">
                                {(!messages || messages.length === 0) ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground space-y-2">
                                        <Bot className="w-12 h-12 opacity-20" />
                                        <p className="text-sm">Hi! I'm your Chess Assistant.</p>
                                        <p className="text-xs">Ask me about the game, features, or how to build this app!</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2 p-4">
                                        {messages.map((m: any) => (
                                            <ChatMessage key={m.id} message={m} />
                                        ))}
                                        {isLoading && (
                                            <div className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground">
                                                <span className="animate-pulse">Thinking...</span>
                                            </div>
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="p-4 border-t">
                                <form onSubmit={handleFormSubmit} className="flex w-full gap-2">
                                    <Input
                                        value={localInput}
                                        onChange={(e) => setLocalInput(e.target.value)}
                                        placeholder="Ask something..."
                                        className="flex-1"
                                    />
                                    <Button type="submit" size="icon" disabled={!localInput || !localInput.trim()}>
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </form>

                                {error && (
                                    <div className="absolute bottom-16 left-4 right-4 p-2 bg-destructive/10 text-destructive text-xs rounded border border-destructive/20">
                                        An error occurred. Check browser console or API key.
                                    </div>
                                )}
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <Button
                onClick={() => setIsOpen(!isOpen)}
                size="lg"
                className={cn(
                    "h-14 w-14 rounded-full shadow-xl transition-all duration-300 hover:scale-105",
                    isOpen ? "rotate-90 bg-destructive hover:bg-destructive/90 text-white" : "bg-primary text-primary-foreground animate-bounce-subtle"
                )}
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
            </Button>
        </div >
    );
}
