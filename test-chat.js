require('dotenv').config({ path: '.env.local' });
const { GoogleGenAI } = require('@google/genai');

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  try {
    const history = [
      { role: 'user', parts: [{ text: '안녕' }] },
      { role: 'model', parts: [{ text: '안녕하세요! EV 도우미입니다.' }] }
    ];
    
    history.push({ role: 'user', parts: [{ text: '내 이름은 홍길동이야.' }] });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: history,
      config: {
        systemInstruction: 'You are a helpful EV Assistant for Jeju Island.',
      }
    });
    console.log("Response 1:", response.text);

    history.push({ role: 'model', parts: [{ text: response.text }] });
    history.push({ role: 'user', parts: [{ text: '내 이름이 뭐라고 했지?' }] });

    const response2 = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: history,
      config: {
        systemInstruction: 'You are a helpful EV Assistant for Jeju Island.',
      }
    });
    console.log("Response 2:", response2.text);

  } catch (e) {
    console.error("Error:", e);
  }
}

run();
