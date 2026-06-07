require('dotenv').config({ path: '.env.local' });
const { GoogleGenAI } = require('@google/genai');

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: 'Who are you?' }] }],
      config: {
        systemInstruction: 'You are a pirate.',
      }
    });
    console.log("Response:", response.text);
  } catch (e) {
    console.error("Error:", e);
  }
}

run();
