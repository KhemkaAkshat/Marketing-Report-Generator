import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv"

dotenv.config()


const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

export const generateWithGemini = async (company, rawData) => {
  try {
    const prompt = `
You are a business analyst.

Create a structured marketing report for ${company}.

Format:

Company: ${company}

1. Business Model:
2. Target Audience:
3. Marketing Strategy:
4. Competitors:
5. SWOT Analysis:
   - Strengths:
   - Weaknesses:
   - Opportunities:
   - Threats:

Keep it clear and concise.

Data:
${rawData}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    });

    console.log("Data extracted", response.text)

    return response.text;
  } catch (error) {
    if (error.status === 429) {
      console.error("Gemini API Quota Exceeded - Free tier limit reached. Using Tavily data instead.");
      return "";
    }
    console.error("Gemini Error:", error);
    return "";
  }
};