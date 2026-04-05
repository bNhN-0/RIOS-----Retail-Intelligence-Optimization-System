import "server-only";

import Groq from "groq-sdk";

export function hasGroqApiKey() {
  return Boolean(process.env.GROQ_API_KEY);
}

export function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new Groq({ apiKey });
}
