import mongoose from "mongoose";
import chatModel from "../models/chat.model.js";
import { generateWithGemini } from "../services/geminiServices.js";
import { fetchCompanyData } from "../services/tavilyServices.js";

const MAX_COMPANIES = 10;

const buildResults = async (companies) => {
  const results = [];

  for (const company of companies) {
    const rawData = await fetchCompanyData(company);
    const report = await generateWithGemini(company, rawData);

    if (!report) {
      results.push({ company, report: rawData });
    } else {
      results.push({ company, report });
    }

    await new Promise((res) => setTimeout(res, 2000));
  }

  return results;
};

const formatAssistantContent = (results) =>
  results
    .map((result) => {
      if (typeof result.report === "string" && result.report.trim()) {
        return result.report;
      }

      if (result.report?.cleanedData?.length) {
        return result.report.cleanedData.join("\n\n");
      }

      return JSON.stringify(result.report, null, 2);
    })
    .join("\n\n----------------------\n\n");

const normalizeCompanies = (body) => {
  if (typeof body.input === "string") {
    return body.input
      .split(",")
      .map((company) => company.trim())
      .filter(Boolean);
  }

  if (Array.isArray(body.companies)) {
    return body.companies.map((company) => company.trim()).filter(Boolean);
  }

  return [];
};

export const generateReport = async (req, res) => {
  try {
    const { chatId } = req.body;
    const companies = normalizeCompanies(req.body);

    if (!companies || companies.length === 0)
      return res.status(400).json({ message: "No companies provided" });
    if (companies.length > MAX_COMPANIES)
      return res
        .status(400)
        .json({ message: `Max ${MAX_COMPANIES} companies allowed` });

    let chat = null;
    if (chatId) {
      if (!mongoose.Types.ObjectId.isValid(chatId)) {
        return res.status(400).json({ message: "Invalid chat id" });
      }

      chat = await chatModel.findById(chatId);
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }
    }

    const userContent = companies.join(", ");
    const results = await buildResults(companies);
    const assistantContent = formatAssistantContent(results);

    if (!chat) {
      chat = await chatModel.create({
        title: userContent,
        messages: [
          {
            role: "user",
            content: userContent,
          },
          {
            role: "assistant",
            content: assistantContent,
            results,
          },
        ],
      });
    } else {
      chat.messages.push(
        {
          role: "user",
          content: userContent,
        },
        {
          role: "assistant",
          content: assistantContent,
          results,
        },
      );
      await chat.save();
    }

    res.status(200).json({
      message: "Report created",
      chatId: chat._id,
      title: chat.title,
      results,
      messages: chat.messages,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getHistory = async (req, res) => {
  try {
    const history = await chatModel
      .find({}, { title: 1, updatedAt: 1 })
      .sort({ updatedAt: -1 })
      .limit(50);

    const mappedHistory = history.map((chat) => ({
      chatId: chat._id,
      title: chat.title,
      updatedAt: chat.updatedAt,
    }));

    res.status(200).json({ message: "History fetched", history: mappedHistory });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getChatById = async (req, res) => {
  try {
    const { chatId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: "Invalid chat id" });
    }

    const chat = await chatModel.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    res.status(200).json({
      message: "Chat fetched",
      chat: {
        chatId: chat._id,
        title: chat.title,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        messages: chat.messages,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
