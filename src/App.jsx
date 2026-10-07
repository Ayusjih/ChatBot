/**
 * App.jsx — Main chat component
 *
 * A simple chat UI that talks to Google Gemini.
 * Keeps the full conversation history so the bot remembers context.
 */

import { useState, useRef, useEffect } from "react";
import { sendMessageToGemini } from "./gemini";
import "./App.css";

// ── Check whether the API key is configured ────────────────────────
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const isKeyMissing = !API_KEY || API_KEY === "your_api_key_here";

function App() {
  // ── State ────────────────────────────────────────────────────────
  const [messages, setMessages] = useState([]); // { role, text }
  const [input, setInput] = useState(""); // current input value
  const [loading, setLoading] = useState(false); // waiting for API?

  // Ref to the bottom of the message list (for auto-scroll)
  const messagesEndRef = useRef(null);
  // Ref to the textarea (for focus management)
  const inputRef = useRef(null);

  // ── Auto-scroll to the latest message whenever messages change ───
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── Send a message ───────────────────────────────────────────────
  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    // Add the user's message to the conversation
    const userMessage = { role: "user", text: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      // Send the full history so Gemini remembers context
      const reply = await sendMessageToGemini(updatedMessages);

      // Add the bot's reply
      setMessages((prev) => [...prev, { role: "model", text: reply }]);
    } catch (error) {
      // Show the error as a chat message so the user knows what happened
      const errorText =
        error?.message || "Something went wrong. Please try again.";
      setMessages((prev) => [...prev, { role: "error", text: errorText }]);
    } finally {
      setLoading(false);
      // Put focus back on the input
      inputRef.current?.focus();
    }
  }

  // ── Handle keyboard shortcuts in the input box ───────────────────
  function handleKeyDown(e) {
    // Enter sends the message; Shift+Enter adds a new line
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // ── Clear the conversation ───────────────────────────────────────
  function handleClear() {
    setMessages([]);
    setInput("");
    inputRef.current?.focus();
  }

  // ── If the API key is missing, show a helpful setup message ──────
  if (isKeyMissing) {
    return (
      <div className="app">
        <header className="header">
          <h1>Gemini ChatBot</h1>
        </header>
        <div className="missing-key">
          <h2>⚠️ API Key Not Found</h2>
          <p>
            To use this chatbot you need a Google Gemini API key.
          </p>
          <ol>
            <li>
              Go to{" "}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
              >
                Google AI Studio
              </a>{" "}
              and create a free API key.
            </li>
            <li>
              Open the <code>.env</code> file in the project root.
            </li>
            <li>
              Replace <code>your_api_key_here</code> with your real key.
            </li>
            <li>
              Restart the dev server (<code>npm run dev</code>).
            </li>
          </ol>
        </div>
      </div>
    );
  }

  // ── Main chat UI ─────────────────────────────────────────────────
  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1>Gemini ChatBot</h1>
        {messages.length > 0 && (
          <button className="clear-btn" onClick={handleClear}>
            Clear chat
          </button>
        )}
      </header>

      {/* Message area */}
      <main className="messages">
        {messages.length === 0 && (
          <p className="empty-hint">
            Say hello to start a conversation with Gemini!
          </p>
        )}

        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <div className="bubble">
              {/* Show the message text, preserving line breaks */}
              {msg.text.split("\n").map((line, i) => (
                <span key={i}>
                  {line}
                  {i < msg.text.split("\n").length - 1 && <br />}
                </span>
              ))}
            </div>
          </div>
        ))}

        {/* Typing indicator while waiting for a response */}
        {loading && (
          <div className="message model">
            <div className="bubble typing">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        )}

        {/* Invisible element we scroll to */}
        <div ref={messagesEndRef} />
      </main>

      {/* Input area */}
      <footer className="input-area">
        <textarea
          ref={inputRef}
          className="input-box"
          rows={1}
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button
          className="send-btn"
          onClick={handleSend}
          disabled={loading || !input.trim()}
        >
          {loading ? "..." : "Send"}
        </button>
      </footer>
    </div>
  );
}

export default App;
