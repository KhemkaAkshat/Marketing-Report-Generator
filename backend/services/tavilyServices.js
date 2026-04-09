import { tavily } from "@tavily/core";
import dotenv from "dotenv";

dotenv.config();

const client = tavily({
  apiKey: process.env.TAVILY_API_KEY,
});

export const fetchCompanyData = async (company) => {
  try {
    const response = await client.search(
      `${company} marketing strategy business model competitors`,
      {
        searchDepth: "advanced",
        maxResults: 5,
      },
    );

    const cleanedData = response.results
      .slice(0, 1)
      .map((r) => r.content)
    //   .join("\n");   
    //   console.log(cleanedData)
    return { message: "Extracted data from tavily", cleanedData };
  } catch (error) {
    console.log("Tavily Error: ", error);
    return "";
  }
};
