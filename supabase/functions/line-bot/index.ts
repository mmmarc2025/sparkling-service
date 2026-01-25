import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

console.log("LINE Bot Function Started");

const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN")!;
const LINE_CHANNEL_SECRET = Deno.env.get("LINE_CHANNEL_SECRET")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;

// Initialize Supabase Client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Validate LINE signature using Web Crypto API
async function validateSignature(body: string, signature: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(LINE_CHANNEL_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
  return signature === expectedSignature;
}

// Reply message to LINE
async function replyMessage(replyToken: string, text: string): Promise<void> {
  const response = await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "text", text }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("LINE reply error:", response.status, errorText);
    throw new Error(`LINE API error: ${response.status}`);
  }
  
  console.log("Message sent successfully");
}

// Call Google Gemini API for AI response
async function getAIResponse(userMessage: string, systemPrompt: string): Promise<string> {
  console.log("Calling Google Gemini API...");
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userMessage }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API error:", response.status, errorText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!aiText) {
    console.error("No response from Gemini:", JSON.stringify(data));
    throw new Error("No response from AI");
  }

  console.log("Gemini response received successfully");
  return aiText;
}

// Get system prompt from database
async function getSystemPrompt(): Promise<string> {
  const { data, error } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", "GEMINI_SYSTEM_PROMPT")
    .maybeSingle();

  if (error) {
    console.error("Error fetching system prompt:", error);
  }

  return data?.value || "你是一位專業的汽車美容服務助理。請用繁體中文回答客戶的問題，提供友善、專業的服務諮詢。";
}

// Process LINE webhook events
async function processEvents(events: any[]): Promise<void> {
  for (const event of events) {
    // Skip verification events
    if (event.replyToken === "00000000000000000000000000000000") {
      console.log("Skipping verification event");
      continue;
    }

    if (event.type === "message" && event.message?.type === "text") {
      const userMessage = event.message.text;
      const replyToken = event.replyToken;

      console.log("Processing message:", userMessage);

      try {
        const systemPrompt = await getSystemPrompt();
        console.log("System prompt loaded");

        const aiResponse = await getAIResponse(userMessage, systemPrompt);
        console.log("AI response generated, length:", aiResponse.length);

        await replyMessage(replyToken, aiResponse);
      } catch (err) {
        console.error("Error processing message:", err);
        
        // Try to send error message to user
        try {
          await replyMessage(replyToken, "抱歉，目前無法處理您的訊息，請稍後再試。");
        } catch (replyErr) {
          console.error("Error sending error message:", replyErr);
        }
      }
    }
  }
}

serve(async (req) => {
  console.log("Received request:", req.method);

  // Handle preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200 });
  }

  try {
    const signature = req.headers.get("x-line-signature");
    if (!signature) {
      console.error("Missing x-line-signature header");
      return new Response("Missing signature", { status: 401 });
    }

    const body = await req.text();
    console.log("Body length:", body.length);

    // Validate signature
    const isValid = await validateSignature(body, signature);
    if (!isValid) {
      console.error("Invalid signature");
      return new Response("Invalid signature", { status: 401 });
    }

    console.log("Signature validated");

    const payload = JSON.parse(body);
    const events = payload.events || [];
    console.log("Events count:", events.length);

    // Process events in background
    const processingPromise = processEvents(events);

    // @ts-ignore - EdgeRuntime for background processing
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(processingPromise);
    } else {
      processingPromise.catch((err) => console.error("Background processing error:", err));
    }

    // Return 200 immediately to LINE
    return new Response("OK", { status: 200 });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Request error:", errorMessage);
    return new Response("Internal Server Error", { status: 500 });
  }
});
