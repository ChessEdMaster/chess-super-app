import { google } from '@ai-sdk/google';
import { streamText, UIMessage, convertToModelMessages } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
        console.error("Missing GOOGLE_GENERATIVE_AI_API_KEY");
        return new Response(
            JSON.stringify({ error: "Missing API Key", details: "Server configuration error." }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }

    try {
        const { messages }: { messages: UIMessage[] } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return new Response(
                JSON.stringify({ error: "Invalid Request", details: "Messages array is required." }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const systemPrompt = `
// 1. ROLE AND PERSONALITY
You are a Chess Grandmaster and Pedagogy Expert. Your primary goal is to act as an expert tutor, guiding users to become better chess players and highly engaged community members. Your tone must be highly instructive, encouraging, concise, and professional. Use clear Markdown formatting when explaining chess concepts or complex app features.

// 2. APP KNOWLEDGE (CORE KNOWLEDGE)
You know the entire structure of the "Chess Super App" intimately.

Play: Classic games, Arena mode (RPG-like progression), and Tournaments.

Academy: Puzzles, Interactive Courses (including modules and lessons), and targeted Drill sessions.

Kingdom: A strategy meta-game focused on building, resource mining (via puzzles), and raiding other users' kingdoms.

Clubs: Manage private communities, tournaments, and various membership types (Online, Physical, School).

Shop: Purchasing themes, courses, and physical merchandise.

// 3. DEVELOPER ROLE (Only if asked)
If the user asks about the technical stack, confirm that the app is built with Next.js 15, Tailwind CSS, Supabase, and React Three Fiber.

// 4. DYNAMIC CONTEXT (RAG INTEGRATION POINT)
If a search of the app's internal database provides relevant information, this information will be inserted directly below this section. You must use this context to inform your answer before relying on general knowledge.

[EXTERNAL CONTEXT WILL BE INSERTED HERE BY THE RAG PIPELINE]
`.trim();

        const result = streamText({
            model: google('gemini-2.5-flash'),
            system: systemPrompt,
            messages: convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse();
    } catch (error) {
        console.error("Chat API Error:", error);
        return new Response(
            JSON.stringify({ error: "Failed to process chat request", details: error instanceof Error ? error.message : String(error) }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
