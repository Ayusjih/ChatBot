/**
 * gemini.js — Gemini API helper
 *
 * Creates the Google GenAI client once and exports a single function
 * that sends the full conversation history and returns the bot's reply.
 */

import { GoogleGenAI } from "@google/genai";

// ── Model name (change this to switch models) ──────────────────────
const MODEL_NAME = "gemini-3.8-flash";

// ── Read the API key from the environment variable ─────────────────
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// ── Create the GenAI client (only if we have a key) ────────────────
let ai = null;
if (API_KEY && API_KEY !== "your_api_key_here") {
  ai = new GoogleGenAI({ apiKey: API_KEY });
}

/**
 * sendMessageToGemini
 *
 * Accepts the full conversation history (an array of { role, text } objects)
 * and sends it to the Gemini API using the stateless Interactions pattern.
 *
 * @param {Array<{role: string, text: string}>} history
 *   Each item has `role` ("user" or "model") and `text` (the message content).
 * @returns {Promise<string>} The model's reply text.
 */
export async function sendMessageToGemini(history) {
  // If there's no valid API key, throw a helpful error
  if (!ai) {
    throw new Error(
      "Gemini API key is missing or still set to the placeholder. " +
        "Add your real key to the .env file as VITE_GEMINI_API_KEY."
    );
  }

  // Build the input array that the Interactions API expects.
  // Each entry is either a user_input or a model step.
  const input = history.map((msg) => ({
    type: msg.role === "user" ? "user_input" : "model",
    content: [{ type: "text", text: msg.text }],
  }));

  // Call the Gemini API (stateless mode — we manage history ourselves)
  const interaction = await ai.interactions.create({
    model: MODEL_NAME,
    store: false,
    input,
  });

  // Return the model's text reply
  return interaction.output_text;
}
