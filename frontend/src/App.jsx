import { useState } from "react";
import axios from "axios";
import {
  TrendingUp,
  BarChart3,
  LineChart,
  FileText,
  Edit,
  Send,
} from "lucide-react";

function App() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    try {
      setHasStarted(true);
      setLoading(true);
      setResponse("");

      const companies = input.split(",").map((c) => c.trim());

      const res = await axios.post("http://localhost:5000/api/report", {
        companies,
      });

      // ✅ Gemini success case
      const formatted = res.data.results
        .map((r) => {
          if (typeof r.report === "string") return r.report;
          return null;
        })
        .filter(Boolean)
        .join("\n\n----------------------\n\n");

      // ✅ Tavily fallback case
      const rawData = res.data.results
        .map((r) => {
          if (typeof r.report === "object" && r.report.cleanedData) {
            return r.report.cleanedData.join("\n\n");
          }
          return JSON.stringify(r, null, 2);
        })
        .join("\n\n----------------------\n\n");

      const finalOutput = formatted || rawData;

      setResponse(
        typeof finalOutput === "string"
          ? finalOutput
          : JSON.stringify(finalOutput, null, 2)
      );
    } catch (error) {
      console.error(error);
      setResponse("Error fetching report");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Bold formatter
  const formatText = (text) => {
    if (typeof text !== "string") {
      text = JSON.stringify(text, null, 2);
    }

    const parts = text.split(/(\*\*.*?\*\*)/g);

    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-semibold text-white">
            {part.replace(/\*\*/g, "")}
          </strong>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="h-screen w-full bg-black text-white flex flex-col">
      
      {/* BEFORE START */}
      {!hasStarted && (
        <div className="flex flex-col items-center justify-center flex-1 px-4 animate-fadeIn">
          <div className="text-center mb-10">
            <p className="text-gray-400 text-lg mb-2">✨ Hi Akshat</p>
            <h1 className="text-4xl md:text-5xl font-semibold">
              Where should we start?
            </h1>
          </div>

          {/* Input */}
          <div className="w-full max-w-2xl bg-[#1f1f1f] rounded-3xl p-3 flex items-center gap-2 shadow-lg">
            <input
              type="text"
              placeholder="Enter company names (e.g. Apple, Nike)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1 bg-transparent outline-none text-lg placeholder-gray-400 px-2 text-white"
            />

            <button
              onClick={handleSend}
              className="bg-white text-black p-2 rounded-full hover:scale-105 transition"
            >
              <Send size={18} />
            </button>
          </div>

          {/* Suggestions */}
          <div className="flex flex-wrap justify-center gap-3 mt-8 max-w-2xl animate-fadeIn">
            <button className="flex items-center gap-2 bg-[#1f1f1f] px-4 py-2 rounded-full">
              <TrendingUp size={16} />
              Analyze Apple
            </button>

            <button className="flex items-center gap-2 bg-[#1f1f1f] px-4 py-2 rounded-full">
              <BarChart3 size={16} />
              Compare Nike vs Adidas
            </button>

            <button className="flex items-center gap-2 bg-[#1f1f1f] px-4 py-2 rounded-full">
              <LineChart size={16} />
              Marketing Strategy Tesla
            </button>

            <button className="flex items-center gap-2 bg-[#1f1f1f] px-4 py-2 rounded-full">
              <FileText size={16} />
              Generate Full Report
            </button>

            <button className="flex items-center gap-2 bg-[#1f1f1f] px-4 py-2 rounded-full">
              <Edit size={16} />
              Custom Query
            </button>
          </div>
        </div>
      )}

      {/* CHAT MODE */}
      {hasStarted && (
        <>
          {/* Response */}
          <div className="flex-1 overflow-y-auto px-6 py-8 bg-black">
            <div className="max-w-4xl mx-auto w-full">
              {loading && (
                <div className="flex flex-col items-center justify-center mt-10">
                  <p className="text-gray-400 mb-4 animate-pulse">
                    Generating your report...
                  </p>
                  <div className="w-8 h-8 border-4 border-gray-600 border-t-white rounded-full animate-spin"></div>
                </div>
              )}

              {!loading && response && (
                <div className="text-gray-300 text-base leading-relaxed">
                  {response.split("\n").map((line, i) => (
                    <p key={i} className="mb-2">
                      {formatText(line)}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Input */}
          <div className="pt-6 pb-4 px-4 bg-black border-t border-gray-800">
            <div className="max-w-2xl mx-auto w-full bg-[#1f1f1f] rounded-3xl p-3 flex items-center gap-2 shadow-lg">
              <input
                type="text"
                placeholder="Ask more..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 bg-transparent outline-none text-lg placeholder-gray-400 px-2 text-white"
              />

              <button
                onClick={handleSend}
                disabled={loading}
                className={`p-2 rounded-full transition ${
                  loading
                    ? "bg-gray-500 cursor-not-allowed"
                    : "bg-white text-black hover:scale-105"
                }`}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;