import { useEffect, useRef, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import { Menu, Send, X } from "lucide-react";
import Sidebar from "./components/Sidebar";

const API_BASE = "https://marketing-report-generator.onrender.com/api/report";

const getSearchChatId = () =>
  new URLSearchParams(window.location.search).get("chatId");

const setSearchChatId = (chatId) => {
  const url = new URL(window.location.href);

  if (chatId) {
    url.searchParams.set("chatId", chatId);
  } else {
    url.searchParams.delete("chatId");
  }

  window.history.pushState({}, "", url);
};

const getRawTextFromResults = (results = []) =>
  results
    .map((result) => {
      if (typeof result.report === "object" && result.report?.cleanedData) {
        return result.report.cleanedData.join("\n\n");
      }

      return JSON.stringify(result, null, 2);
    })
    .join("\n\n----------------------\n\n");

function App() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [activeChatId, setActiveChatId] = useState(() => getSearchChatId());
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(() => Boolean(getSearchChatId()));
  const [messageViews, setMessageViews] = useState({});
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const handleMediaChange = (event) => {
      if (event.matches) {
        setIsMobileSidebarOpen(false);
      }
    };

    handleMediaChange(mediaQuery);
    mediaQuery.addEventListener("change", handleMediaChange);
    return () => mediaQuery.removeEventListener("change", handleMediaChange);
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const nextChatId = getSearchChatId();
      setActiveChatId(nextChatId);
      setMessageViews({});
      setHasStarted(Boolean(nextChatId));
      if (!nextChatId) {
        setMessages([]);
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${API_BASE}/history`);
        setHistory(res.data.history || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchHistory();
  }, []);

  useEffect(() => {
    const fetchChat = async () => {
      if (!activeChatId) return;

      try {
        setLoading(true);
        setMessageViews({});
        const res = await axios.get(`${API_BASE}/history/${activeChatId}`);
        setMessages(res.data.chat?.messages || []);
        setHasStarted(true);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchChat();
  }, [activeChatId]);

  const upsertHistoryItem = (chatId, title, updatedAt = new Date().toISOString()) => {
    setHistory((currentHistory) => {
      const nextHistory = currentHistory.filter((item) => item.chatId !== chatId);
      return [{ chatId, title, updatedAt }, ...nextHistory];
    });
  };

  const startNewChat = () => {
    setIsMobileSidebarOpen(false);
    setActiveChatId(null);
    setMessages([]);
    setInput("");
    setLoading(false);
    setHasStarted(false);
    setMessageViews({});
    setSearchChatId(null);
  };

  const loadFromHistory = (item) => {
    if (!item?.chatId) return;

    setIsMobileSidebarOpen(false);
    setMessageViews({});
    setActiveChatId(item.chatId);
    setHasStarted(true);
    setSearchChatId(item.chatId);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const nextInput = input.trim();

    try {
      setHasStarted(true);
      setLoading(true);

      const res = await axios.post(API_BASE, {
        chatId: activeChatId || undefined,
        input: nextInput,
      });

      const nextChatId = res.data.chatId;
      const nextMessages = res.data.messages || [];

      setMessages(nextMessages);
      setInput("");
      setActiveChatId(nextChatId);
      setSearchChatId(nextChatId);
      upsertHistoryItem(nextChatId, res.data.title);
    } catch (error) {
      console.error(error);
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: "assistant",
          content: "Error fetching report",
          results: [],
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const cleanTextForPDF = (text) => {
    if (typeof text !== "string") {
      text = JSON.stringify(text, null, 2);
    }

    text = text.replace(/###\s*(.+)/g, "━━━ $1 ━━━");
    text = text.replace(/\*\*(.+?)\*\*/g, "$1");
    text = text.replace(/\*/g, "");

    return text;
  };

  const formatText = (text) => {
    if (typeof text !== "string") {
      text = JSON.stringify(text, null, 2);
    }

    const lines = text.split("\n");

    return lines.map((line, index) => {
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

      const swotMatch = line
        .trim()
        .match(/^(Strengths|Weaknesses|Opportunities|Threats)$/i);
      if (swotMatch) {
        const swotTitle = swotMatch[1];
        return (
          <div
            key={index}
            className="text-lg font-bold text-white mt-5 mb-3 bg-gray-800 p-2 rounded"
          >
            <span className="mr-2">●</span>
            {swotTitle.toUpperCase()}
          </div>
        );
      }

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

      if (line.trim().match(/^([•\-*]|\d+\.)\s+/)) {
        const content = line.trim().replace(/^([•\-*]|\d+\.)\s+/, "");
        return (
          <p key={index} className="mb-2 ml-4 text-gray-300">
            <span className="text-gray-500">• </span>
            {formatBold(content)}
          </p>
        );
      }

      const boldParts = line.split(/(\*\*[^*]+\*\*)/g);

      return (
        <p key={index} className="mb-2">
          {boldParts.map((part, i) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong key={i} className="font-semibold text-white">
                  {part.replace(/\*\*/g, "")}
                </strong>
              );
            }

            return <span key={i}>{part.replace(/\*/g, "")}</span>;
          })}
        </p>
      );
    });
  };

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

  const downloadSinglePDF = (results) => {
    if (!results?.length) return;

    const doc = new jsPDF();

    results.forEach((item, index) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Marketing Report", 105, 15, { align: "center" });

      doc.setFontSize(14);
      doc.text(`Company: ${item.company}`, 10, 30);

      doc.setLineWidth(0.5);
      doc.line(10, 35, 200, 35);

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

      if (index !== results.length - 1) {
        doc.addPage();
      }
    });

    doc.save("marketing-report.pdf");
  };

  const downloadMultiplePDFs = (results) => {
    if (!results?.length) return;

    results.forEach((item) => {
      const doc = new jsPDF();

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Marketing Report", 105, 15, { align: "center" });

      doc.setFontSize(14);
      doc.text(`Company: ${item.company}`, 10, 30);

      doc.setLineWidth(0.5);
      doc.line(10, 35, 200, 35);

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

  const toggleMessageView = (messageIndex, nextView) => {
    setMessageViews((currentViews) => ({
      ...currentViews,
      [messageIndex]: nextView,
    }));
  };

  const renderAssistantMessage = (message, messageIndex) => {
    const currentView =
      messageViews[messageIndex] ||
      (message.content?.trim() ? "report" : "raw");
    const rawResponse = getRawTextFromResults(message.results);
    const renderedText = currentView === "report" ? message.content : rawResponse;

    return (
      <div key={messageIndex} className="bg-[#111111] border border-gray-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-gray-500">
            {message.createdAt
              ? new Date(message.createdAt).toLocaleString()
              : ""}
          </p>
        </div>

        {!!message.results?.length && (
          <>
            <div className="flex gap-3 mb-4 flex-wrap">
              <button
                onClick={() => downloadSinglePDF(message.results)}
                className="bg-white text-black px-4 py-2 rounded-lg cursor-pointer hover:scale-105 transition ease-in duration-150"
              >
                Download Combined PDF
              </button>

              <button
                onClick={() => downloadMultiplePDFs(message.results)}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg cursor-pointer hover:scale-105 transition ease-in duration-150"
              >
                Download Separate PDFs
              </button>
            </div>

            <div className="flex gap-3 mb-4">
              <button
                onClick={() => toggleMessageView(messageIndex, "report")}
                className={`px-4 py-1 rounded ${
                  currentView === "report" ? "bg-white text-black" : "bg-gray-700"
                }`}
              >
                AI Report
              </button>

              <button
                onClick={() => toggleMessageView(messageIndex, "raw")}
                className={`px-4 py-1 rounded ${
                  currentView === "raw" ? "bg-white text-black" : "bg-gray-700"
                }`}
              >
                Raw Data
              </button>
            </div>
          </>
        )}

        <div className="text-gray-300 text-base leading-relaxed">
          {formatText(renderedText || "No response available")}
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-black text-white lg:h-screen lg:flex-row">
      <Sidebar
        history={history}
        activeChatId={activeChatId}
        loadFromHistory={loadFromHistory}
        startNewChat={startNewChat}
        isMobileOpen={isMobileSidebarOpen}
        closeMobileSidebar={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col lg:min-h-0">
        <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3 lg:hidden">
          <button
            aria-label={isMobileSidebarOpen ? "Close chat history" : "Open chat history"}
            onClick={() => setIsMobileSidebarOpen((current) => !current)}
            className="rounded-lg border border-gray-700 p-2 text-gray-200"
          >
            {isMobileSidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <p className="text-sm font-medium text-gray-300">Marketing Reports</p>

          <button
            onClick={startNewChat}
            className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-black"
          >
            New
          </button>
        </div>

        {!hasStarted && (
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6">
            <div className="mb-8 text-center sm:mb-10">
              <p className="mb-2 text-base text-gray-400 sm:text-lg">✨ Hey! There,</p>
              <h1 className="text-3xl font-semibold sm:text-4xl md:text-5xl">
                Which company's insights want?
              </h1>
            </div>

            <div className="flex w-full max-w-2xl items-center gap-2 rounded-3xl bg-[#1f1f1f] p-3">
              <input
                type="text"
                placeholder="Enter company names...seprated by comma[nike, puma]"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 bg-transparent px-2 text-base outline-none sm:text-lg"
              />

              <button
                onClick={handleSend}
                className="cursor-pointer rounded-full bg-white p-2 text-black duration-150 ease-in-out hover:scale-110"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        )}

        {hasStarted && (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 lg:min-h-0">
              <div className="mx-auto max-w-4xl space-y-4 sm:space-y-6">
                {!messages.length && !loading && (
                  <div className="text-center text-gray-500 mt-10">
                    Start this chat by entering company names below.
                  </div>
                )}

                {messages.map((message, index) => {
                  if (message.role === "user") {
                    return (
                      <div
                        key={index}
                        className="ml-auto w-full max-w-2xl rounded-2xl bg-[#1f1f1f] px-4 py-4 sm:px-5"
                      >
                        <p className="text-white">{message.content}</p>
                      </div>
                    );
                  }

                  return renderAssistantMessage(message, index);
                })}

                {loading && (
                  <div className="flex flex-col items-center mt-10">
                    <p className="text-gray-400 mb-4 animate-pulse">
                      Generating your report...
                    </p>
                    <div className="w-8 h-8 border-4 border-gray-600 border-t-white rounded-full animate-spin"></div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="border-t border-gray-800 p-4">
              <div className="mx-auto flex w-full max-w-2xl items-center justify-center gap-2 rounded-3xl bg-[#1f1f1f] p-3">
                <input
                  type="text"
                  placeholder="Enter company names..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="flex-1 bg-transparent px-2 text-base outline-none sm:text-lg"
                />

                <button
                  onClick={handleSend}
                  className="cursor-pointer rounded-full bg-white p-2 text-black duration-150 ease-in-out hover:scale-110"
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
