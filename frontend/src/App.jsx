import { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import {
  TrendingUp,
  BarChart3,
  LineChart,
  FileText,
  Edit,
  Send,
} from "lucide-react";
import Sidebar from "./components/Sidebar";

function App() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [resultsData, setResultsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [rawResponse, setRawResponse] = useState("");
  const [view, setView] = useState("report");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get("https://marketing-report-generator.onrender.com/api/report/history");
        console.log(res.data.history);
        setHistory(res.data.history);
      } catch (err) {
        console.error(err);
      }
    };

    fetchHistory();
  }, []);

  const loadFromHistory = (item) => {
    if (!item || !item.results) return;

    const formatted = item.results
      .map((r) => (typeof r.report === "string" ? r.report : null))
      .filter(Boolean)
      .join("\n\n----------------------\n\n");

    const rawData = item.results
      .map((r) => {
        if (typeof r.report === "object" && r.report.cleanedData) {
          return r.report.cleanedData.join("\n\n");
        }
        return JSON.stringify(r, null, 2);
      })
      .join("\n\n----------------------\n\n");

    setResponse(formatted);
    setRawResponse(rawData);
    setView(formatted ? "report" : "raw");
    setHasStarted(true);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    try {
      setHasStarted(true);
      setLoading(true);
      setResponse("");

      const companies = input.split(",").map((c) => c.trim());

      const res = await axios.post("https://marketing-report-generator.onrender.com/api/report", {
        companies,
      });

      setResultsData(res.data.results);

      // AI REPORT
      const formatted = res.data.results
        .map((r) => (typeof r.report === "string" ? r.report : null))
        .filter(Boolean)
        .join("\n\n----------------------\n\n");

      // RAW DATA (Tavily fallback)
      const rawData = res.data.results
        .map((r) => {
          if (typeof r.report === "object" && r.report.cleanedData) {
            return r.report.cleanedData.join("\n\n");
          }
          return JSON.stringify(r, null, 2);
        })
        .join("\n\n----------------------\n\n");

      // store both
      setResponse(formatted);
      setRawResponse(rawData);

      // auto switch if Gemini fails
      if (!formatted) setView("raw");
      else setView("report");
    } catch (error) {
      console.error(error);
      setResponse("Error fetching report");
    } finally {
      setLoading(false);
    }
  };

  const cleanTextForPDF = (text) => {
    if (typeof text !== "string") {
      text = JSON.stringify(text, null, 2);
    }

    // Replace ### headings with uppercase + decorative markers
    text = text.replace(/###\s*(.+)/g, "━━━ $1 ━━━");

    // Replace ** (bold markers) with UPPERCASE for PDF visibility
    text = text.replace(/\*\*(.+?)\*\*/g, "$1");

    // Remove single * (asterisks)
    text = text.replace(/\*/g, "");

    return text;
  };

  const formatText = (text) => {
    if (typeof text !== "string") {
      text = JSON.stringify(text, null, 2);
    }

    // Split by lines to handle headings
    const lines = text.split("\n");

    return lines.map((line, index) => {
      // Handle ###Heading (markdown style)
      if (line.trim().startsWith("###")) {
        const heading = line.replace(/^###\s*/, "").trim();
        return (
          <div
            key={index}
            className="text-xl font-bold text-white mt-4 mb-2 flex items-center gap-3"
          >
            <span className="text-gray-500">━━━</span>
            <span>{heading}</span>
            <span className="text-gray-500">━━━</span>
          </div>
        );
      }

      // Handle SWOT sections (Strengths, Weaknesses, Opportunities, Threats)
      const swotMatch = line
        .trim()
        .match(/^(Strengths|Weaknesses|Opportunities|Threats)$/i);
      if (swotMatch) {
        const swotTitle = swotMatch[1];
        const emoji = "●";
        return (
          <div
            key={index}
            className="text-lg font-bold text-white mt-5 mb-3 bg-gray-800 p-2 rounded"
          >
            <span className="mr-2">{emoji}</span>
            {swotTitle.toUpperCase()}
          </div>
        );
      }

      // Handle lines that are headers (end with colon)
      if (line.trim().endsWith(":") && line.trim().length < 50) {
        const headerText = line.trim();
        return (
          <div
            key={index}
            className="text-lg font-bold text-white mt-3 mb-2 flex items-center gap-2"
          >
            <span className="text-gray-500">┃</span>
            {headerText}
          </div>
        );
      }

      // Handle bullet points (lines starting with -, *, or numbers)
      if (line.trim().match(/^([•\-*]|\d+\.)\s+/)) {
        const content = line.trim().replace(/^([•\-*]|\d+\.)\s+/, "");
        return (
          <p key={index} className="mb-2 ml-4 text-gray-300">
            <span className="text-gray-500">• </span>
            {formatBold(content)}
          </p>
        );
      }

      // Handle bold text (**text**) and remove single asterisks
      let processedLine = line;
      const boldParts = processedLine.split(/(\*\*[^*]+\*\*)/g);

      return (
        <p key={index} className="mb-2">
          {boldParts.map((part, i) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              // Keep bold formatting
              return (
                <strong key={i} className="font-semibold text-white">
                  {part.replace(/\*\*/g, "")}
                </strong>
              );
            }
            // Remove single asterisks from regular text
            return <span key={i}>{part.replace(/\*/g, "")}</span>;
          })}
        </p>
      );
    });
  };

  // Helper function to format bold in text
  const formatBold = (text) => {
    const boldParts = text.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-white">
            {part.replace(/\*\*/g, "")}
          </strong>
        );
      }
      return <span key={i}>{part.replace(/\*/g, "")}</span>;
    });
  };

  const downloadSinglePDF = () => {
    if (!resultsData.length) return;

    const doc = new jsPDF();

    resultsData.forEach((item, index) => {
      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Marketing Report", 105, 15, { align: "center" });

      // Company Name
      doc.setFontSize(14);
      doc.text(`Company: ${item.company}`, 10, 30);

      // Line separator
      doc.setLineWidth(0.5);
      doc.line(10, 35, 200, 35);

      // Content
      const content =
        typeof item.report === "string"
          ? item.report
          : item.report.cleanedData?.join("\n\n") || "No Data";

      const cleanContent = cleanTextForPDF(content);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);

      const lines = doc.splitTextToSize(cleanContent, 180);

      let y = 45;

      lines.forEach((line) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 10, y);
        y += 7;
      });

      // Add new page for next company
      if (index !== resultsData.length - 1) {
        doc.addPage();
      }
    });

    doc.save("marketing-report.pdf");
  };

  const downloadMultiplePDFs = () => {
    if (!resultsData.length) return;

    resultsData.forEach((item) => {
      const doc = new jsPDF();

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Marketing Report", 105, 15, { align: "center" });

      // Company Name
      doc.setFontSize(14);
      doc.text(`Company: ${item.company}`, 10, 30);

      // Line
      doc.setLineWidth(0.5);
      doc.line(10, 35, 200, 35);

      // Content
      const content =
        typeof item.report === "string"
          ? item.report
          : item.report.cleanedData?.join("\n\n") || "No Data";

      const cleanContent = cleanTextForPDF(content);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);

      const lines = doc.splitTextToSize(cleanContent, 180);

      let y = 45;

      lines.forEach((line) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 10, y);
        y += 7;
      });

      doc.save(`${item.company}-report.pdf`);
    });
  };

  return (
    <div className="h-screen w-full bg-black text-white flex">
      <Sidebar history={history} loadFromHistory={loadFromHistory} />
      <div className="flex-1 flex flex-col">
        {/* BEFORE START */}
        {!hasStarted && (
          <div className="flex flex-col items-center justify-center flex-1 px-4 ">
            <div className="text-center mb-10">
              <p className="text-gray-400 text-lg mb-2">✨ Hey! There,</p>
              <h1 className="text-4xl md:text-5xl font-semibold">
                Which company's insights want?
              </h1>
            </div>

            <div className="w-full max-w-2xl bg-[#1f1f1f] rounded-3xl p-3 flex items-center gap-2">
              <input
                type="text"
                placeholder="Enter company names...seprated by comma[nike, puma]"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 bg-transparent outline-none text-lg px-2"
              />

              <button
                onClick={handleSend}
                className="bg-white text-black p-2 rounded-full hover:scale-110 cursor-pointer ease-in-out duration-150"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        )}

        {/* CHAT MODE */}
        {hasStarted && (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-8">
              <div className="max-w-4xl mx-auto">
                {loading && (
                  <div className="flex flex-col items-center mt-10">
                    <p className="text-gray-400 mb-4 animate-pulse">
                      Generating your report...
                    </p>
                    <div className="w-8 h-8 border-4 border-gray-600 border-t-white rounded-full animate-spin"></div>
                  </div>
                )}

                {!loading && (response || rawResponse) && (
                  <>
                    {/* 🔥 DOWNLOAD BUTTONS */}
                    <div className="flex gap-3 mb-6 flex-wrap">
                      <button
                        onClick={downloadSinglePDF}
                        className="bg-white text-black px-4 py-2 rounded-lg cursor-pointer hover:scale-105 transition ease-in duration-150"
                      >
                        Download Combined PDF
                      </button>

                      <button
                        onClick={downloadMultiplePDFs}
                        className="bg-gray-700 text-white px-4 py-2 rounded-lg cursor-pointer hover:scale-105 transition ease-in duration-150"
                      >
                        Download Separate PDFs
                      </button>
                    </div>
                    <div className="flex gap-3 mb-4">
                      <button
                        onClick={() => setView("report")}
                        className={`px-4 py-1 rounded ${
                          view === "report"
                            ? "bg-white text-black"
                            : "bg-gray-700"
                        }`}
                      >
                        AI Report
                      </button>

                      <button
                        onClick={() => setView("raw")}
                        className={`px-4 py-1 rounded ${
                          view === "raw" ? "bg-white text-black" : "bg-gray-700"
                        }`}
                      >
                        Raw Data
                      </button>
                    </div>

                    {/* RESPONSE */}
                    <div className="text-gray-300 text-base leading-relaxed">
                      {formatText(view === "report" ? response : rawResponse)}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* INPUT */}
            <div className="p-4 border-t border-gray-800 flex items-center justify-center">
              <div className="w-full max-w-2xl bg-[#1f1f1f] rounded-3xl p-3 flex items-center justify-center gap-2">
                <input
                  type="text"
                  placeholder="Enter company names..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="flex-1 bg-transparent outline-none text-lg px-2 "
                />

                <button
                  onClick={handleSend}
                  className="bg-white text-black p-2 rounded-full hover:scale-110 cursor-pointer ease-in-out duration-150"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
