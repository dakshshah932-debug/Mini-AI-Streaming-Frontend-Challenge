import { useState, useRef, useEffect } from "react";

function App() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [tools, setTools] = useState([]);
  const chatEndRef = useRef(null);
  const [terminate, setterminate] = useState(false);
  const terminateRef = useRef(terminate);

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
      console.log("Available tools:", data);
      setTools(data.tools || []);
    } catch (err) {
      console.error("Failed to fetch tools:", err);
    }
  }

  async function handleTerminate() {
    setterminate(true);
    console.log("Terminate clicked");
    setLoading(false);
    setMessages((prev) => [
      ...prev,
      { type: "tool", text: "❌ Request terminated by user.", timestamp: new Date() },
    ]);
  }

  async function handleSend() {
    if (!input.trim()) return;
    setterminate(false);
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
      if (terminateRef.current) {
        console.log("Terminated manually");
        break;
      }
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
    <div className="flex bg-gradient-to-b from-gray-900 via-gray-800 to-yellow-900 min-h-screen">
    
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="title text-6xl sm:text-8xl font-extrabold mb-6 flex justify-center items-center">
          <span className="text-gray-500">&lt;</span>
          <span className="bg-gradient-to-r from-gray-500 to-yellow-400 bg-clip-text text-transparent animate-text-gradient">
            CHATBOT
          </span>
          <span className="text-yellow-400">/&gt;</span>
        </div>

        
        <div className="w-full max-w-2xl flex flex-col bg-gray-900 shadow-lg rounded-2xl h-[80vh]">
          
          <div
            className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-yellow-400 scrollbar-track-gray-900"
            style={{ scrollbarWidth: "thin", scrollbarColor: "#facc15 #1f2937" }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${
                  msg.type === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`px-4 py-2 rounded-lg max-w-[80%] break-words shadow-sm ${
                    msg.type === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : msg.type === "ai"
                      ? "bg-gray-800 text-gray-200 rounded-bl-none"
                      : "bg-yellow-500 text-black rounded-lg"
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-xs text-gray-400 mt-1">
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          
          <div className="flex border-t border-gray-700 p-3 justify-center items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-700 rounded-lg bg-gray-800 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {!loading ? (
              <button
                onClick={handleSend}
                type="button"
                className="ml-3 mt-2 text-black cursor-pointer bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 hover:bg-gradient-to-br shadow-lg shadow-yellow-500/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2.5 transition-colors duration-300 focus:outline-none"
              >
                Send
              </button>
            ) : (
              <button
                onClick={handleTerminate}
                type="button"
                className="ml-4 py-2.5 px-5 me-2 text-sm font-medium text-gray-900 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-700 hover:text-yellow-400 inline-flex items-center transition-all duration-300"
              >
                <svg
                  aria-hidden="true"
                  role="status"
                  className="inline w-4 h-4 me-3 text-yellow-400 animate-spin"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50..."
                    fill="currentColor"
                  />
                </svg>
                Loading...
              </button>
            )}
          </div>
        </div>
      </div>

      
         <div className="w-64 bg-gray-900 text-gray-200 p-4 rounded-l-2xl shadow-inner border-l border-yellow-400 flex flex-col justify-start">
        <h2 className="text-xl font-bold text-yellow-400 mb-3 text-center">
          🧰 Available Tools
        </h2>
        <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-yellow-400 scrollbar-track-gray-800">
          {tools && tools.length > 0 ? (
            tools.map((tool, i) => (
              
              <div
                key={i}
                className="bg-gray-800 px-3 py-2 rounded-lg hover:bg-gray-700 transition"
              >
                {tool.name || `Tool ${i + 1}`}
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400 text-center">No tools found</p>
          )}
        



        </div>
      </div>

    </div>
  );
}

export default App;
