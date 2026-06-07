import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Next.js Edge runtime is optional, but Serverless function is default
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { message, history, context } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured.' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    // System prompt setup
    let systemPrompt = `You are a helpful EV (Electric Vehicle) Assistant for Jeju Island. 
You answer questions about EV charging, provide recommendations, and use the provided context about nearby stations.
Keep your answers concise, friendly, and formatted in Markdown.\n`;

    if (context && context.length > 0) {
      systemPrompt += `\nHere are the nearest charging stations to the user:\n`;
      context.forEach((station: any, index: number) => {
        systemPrompt += `${index + 1}. ${station.name} (${station.address}) - Distance: ${station.distance}km\n`;
      });
      systemPrompt += `Use this information if the user asks for nearby stations.\n`;
    }

    // Format chat history
    let formattedContents: any[] = [];
    if (history && Array.isArray(history)) {
      formattedContents = history
        .filter((h: any) => h.id !== '1') // Skip the initial hardcoded greeting to maintain valid user-model sequence
        .map((h: any) => ({
          role: h.role,
          parts: [{ text: h.text }]
        }));
    }

    // Add the current user message
    formattedContents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: formattedContents,
      config: {
        systemInstruction: systemPrompt,
      }
    });

    return NextResponse.json({
      reply: response.text
    });

  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}
