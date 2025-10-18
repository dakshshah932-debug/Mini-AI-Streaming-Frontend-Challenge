import { useState, useRef, useEffect } from "react";
import { Bot } from "lucide-react";

function App() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [tools, setTools] = useState([]);
  const [terminate, setTerminate] = useState(false);
  const terminateRef = useRef(terminate);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    terminateRef.current = terminate;
  }, [terminate]);

  useEffect(() => {
    fetchTools();
  }, []);

  async function fetchTools() {
    try {
      const res = await fetch("https://intern-test-frontend-mbcr.onrender.com/tools");
      const data = await res.json();
      setTools(data.tools || []);
    } catch (err) {
      console.error("Failed to fetch tools:", err);
    }
  }

  async function handleTerminate() {
    setTerminate(true);
    setLoading(false);
    setMessages((prev) => [
      ...prev,
      { type: "tool", text: "❌ Request terminated by user.", timestamp: new Date() },
    ]);
  }

  async function handleSend() {
    if (!input.trim()) return;
    setTerminate(false);
    setLoading(true);
    const newMsg = { type: "user", text: input, timestamp: new Date() };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    await fetchAIResponse(input);
    setLoading(false);
  }

  async function fetchAIResponse(text) {
    const response = await fetch("https://intern-test-frontend-mbcr.onrender.com/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let aiText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (terminateRef.current) break;
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter(Boolean);

      for (let line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.type === "text") {
            aiText += data.content;
            setMessages((prev) => {
              const updated = [...prev];
              if (updated[updated.length - 1]?.type === "ai") {
                updated[updated.length - 1] = {
                  type: "ai",
                  text: aiText,
                  timestamp: new Date(),
                };
              } else {
                updated.push({ type: "ai", text: aiText, timestamp: new Date() });
              }
              return updated;
            });
          } else if (data.type === "tool_call") {
            setMessages((prev) => [
              ...prev,
              {
                type: "tool",
                text: `🧰 Using ${data.tool.name} (${data.tool.status})`,
                timestamp: new Date(),
              },
            ]);
          } else if (data.type === "tool_result") {
            setMessages((prev) => [
              ...prev,
              {
                type: "tool",
                text: `✅ Result: ${JSON.stringify(data.tool.result)}`,
                timestamp: new Date(),
              },
            ]);
          }
        } catch (err) {
          console.error("Parse error:", line);
        }
      }
    }
  }

  return (
    <div className="flex h-screen bg-[#0d1117] text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-800 bg-[#0d1117] p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-6">
          <div className="bg-yellow-500 p-2 rounded-md">
            <Bot className="w-6 h-6 text-gray-900" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">AI Assistant</h1>
            <p className="text-xs text-gray-400">Always here to help</p>
          </div>
        </div>

        <h2 className="text-yellow-400 font-semibold mb-3 text-center">🧰 Tools</h2>
        <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-yellow-500 scrollbar-track-gray-900">
          {tools.length > 0 ? (
            tools.map((tool, i) => (
              <div
                key={i}
                className="bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg transition text-sm"
              >
                {tool.name || `Tool ${i + 1}`}
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm text-center">No tools found</p>
          )}
        </div>
      </aside>

      {/* Chat Section */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-800 p-4 flex-shrink-0">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-400 to-yellow-400 bg-clip-text text-transparent text-center">
            AI Assistant
          </h1>
        </div>
   
        {/* Messages container */}
        <div className="flex-1 p-6 flex flex-col gap-4 messages-scrollbar min-h-[80vh]">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm ${
                  msg.type === "user"
                    ? "bg-yellow-500 text-gray-900 rounded-br-none"
                    : msg.type === "ai"
                    ? "bg-gray-800 text-gray-100 rounded-bl-none"
                    : "bg-gray-700 text-yellow-400"
                }`}
              >
                {msg.text}
                <div className="text-xs text-gray-400 mt-1 text-right">
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input (sticky bottom) */}
        <div className="border-t border-gray-800 p-4 flex-shrink-0 flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-transparent border border-gray-700 rounded-lg px-4 py-2 text-sm placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 outline-none"
          />
          {!loading ? (
            <button
              onClick={handleSend}
              className="bg-yellow-500 cursor-pointer hover:bg-yellow-400 text-gray-900 font-medium px-5 py-2 rounded-lg transition"
            >
              Send
            </button>
          ) : (
            <button
              onClick={handleTerminate}
              className="bg-gray-800 cursor-pointer border border-gray-700 text-yellow-400 font-medium px-5 py-2 rounded-lg flex items-center gap-2"
            >
              <svg
                className="w-4 h-4 animate-spin text-yellow-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              Stop
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
