import historyModel from "../models/history.model.js";
import { generateWithGemini } from "../services/geminiServices.js";
import { fetchCompanyData } from "../services/tavilyServices.js";

export const generateReport = async (req, res) => {
  try {
    const { companies } = req.body;

    if (!companies || companies.length === 0)
      return res.status(400).json({ message: "No companies provided" });
    if (companies.length > 10)
      return res.status(400).json({ message: "Max 10 companies allowed" });
    // const results = await Promise.all(
    //   companies.map(async (company) => {
    //     try {
    //       const rawData = await fetchCompanyData(company);
    //       const report = await generateWithGemini(company, rawData);

    //       return { company, report };
    //     } catch (error) {
    //       return { company, report: "Error generating report" };
    //     }
    //   }),
    // );

    const results = [];

    for (let company of companies) {
      const rawData = await fetchCompanyData(company);
      const report = await generateWithGemini(company, rawData);

      if (!report) {
        results.push({ company, report: rawData });
      } else {
        results.push({ company, report });
      }
      await new Promise((res) => setTimeout(res, 2000));
    }
    await historyModel.create({
      query: companies.join(", "),
      results,
    });

    res.status(200).json({ message: "Report created ", results });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getHistory = async (req, res)=>{
  try {
    const history = await historyModel
  .find()
  .sort({ createdAt: -1 })
  .limit(10);
    res.status(200).json({message:"History fetched", history})
    
  } catch (error) {
    console.log(error)
    res.status(500).json({message:"Internal server error"})
  }
}