
import { google } from '@ai-sdk/google';
import { streamText, convertToCoreMessages } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        const result = streamText({
            model: google('gemini-1.5-flash'),
            system: `You are the official AI Assistant for the "Chess Super App". 
      
      Your goal is to guide users through the app and help them become better chess players and community members.
      
      Here is an overview of the App Structure:
      - **Play**: Classic games, Arena mode (RPG-like progression), and Tournaments.
      - **Academy**: Puzzles, Interactive Courses, and Drill sessions.
      - **Kingdom**: A strategy meta-game where users build their chess kingdom, mine resources (via puzzles), and raid others.
      - **Clubs**: Manage communities, tournaments, and memberships (Online, Physical, School).
      - **Shop**: Buy themes, courses, and physical equipment.
      
      You are also a Developer Assistant. If the user asks about technical details, you can explain that this app is built with Next.js 15, Tailwind CSS, Supabase, and React Three Fiber.
      
      Be concise, helpful, and friendly. formatting with Markdown is supported.`,
            messages: convertToCoreMessages(messages),
        });

        return result.toTextStreamResponse();
    } catch (error) {
        console.error("Chat API Error:", error);
        return new Response(JSON.stringify({ error: "Failed to process chat request", details: error instanceof Error ? error.message : String(error) }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
