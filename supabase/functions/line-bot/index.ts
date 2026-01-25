import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Client, validateSignature, WebhookEvent } from "npm:@line/bot-sdk@8.0.0";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";
import { createClient } from "npm:@supabase/supabase-js@2";

console.log("LINE Bot Function Started");

const channelAccessToken = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN")!;
const channelSecret = (Deno.env.get("LINE_CHANNEL_SECRET") || "").trim();
const geminiApiKey = Deno.env.get("GEMINI_API_KEY")!;

// Initialize LINE Client
const lineClient = new Client({
  channelAccessToken: channelAccessToken,
});

// Initialize Gemini
const genAI = new GoogleGenerativeAI(geminiApiKey);

// Initialize Supabase Client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  try {
    const signature = req.headers.get("x-line-signature");
    if (!signature) {
      console.error("Missing x-line-signature header");
      return new Response("Missing signature", { status: 401 });
    }

    const body = await req.text();
    console.log("Received webhook body length:", body.length);

    if (!channelSecret) {
      console.error("Missing LINE_CHANNEL_SECRET");
      return new Response("Server Error: Missing Channel Secret", { status: 500 });
    }

    // Validate signature
    const isValid = validateSignature(body, channelSecret, signature);
    if (!isValid) {
      console.error("Invalid signature");
      return new Response("Invalid signature", { status: 401 });
    }

    console.log("Signature validated successfully");

    const events: WebhookEvent[] = JSON.parse(body).events;
    console.log("Processing", events.length, "events");

    // Process events in the background
    const processingPromise = processEvents(events);

    // Use waitUntil if available for background processing
    // @ts-ignore - EdgeRuntime may not be typed
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(processingPromise);
    } else {
      processingPromise.catch((err) => console.error("Processing error:", err));
    }

    // Return 200 immediately to LINE
    return new Response("OK", { status: 200 });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Error processing request:", errorMessage);
    return new Response(`Error: ${errorMessage}`, { status: 500 });
  }
});

async function processEvents(events: WebhookEvent[]) {
  for (const event of events) {
    // Skip verification events
    if ("replyToken" in event && event.replyToken === "00000000000000000000000000000000") {
      console.log("Skipping verification event");
      continue;
    }

    if (event.type === "message" && event.message.type === "text") {
      const userMessage = event.message.text;
      const replyToken = event.replyToken;

      console.log("Processing message:", userMessage);

      try {
        // Get system prompt from database
        let systemPrompt = "You are a helpful car wash assistant.";
        const { data: setting } = await supabase
          .from("system_settings")
          .select("value")
          .eq("key", "GEMINI_SYSTEM_PROMPT")
          .single();

        if (setting?.value) {
          systemPrompt = setting.value;
        }

        console.log("Using system prompt:", systemPrompt.substring(0, 50) + "...");

        // Generate AI response
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const chat = model.startChat({
          history: [
            { role: "user", parts: [{ text: `System Instruction: ${systemPrompt}` }] },
            { role: "model", parts: [{ text: "Understood." }] },
          ],
        });

        const result = await chat.sendMessage(userMessage);
        const aiResponse = result.response.text();

        console.log("AI response generated, length:", aiResponse.length);

        // Reply to user
        await lineClient.replyMessage(replyToken, {
          type: "text",
          text: aiResponse,
        });

        console.log("Reply sent successfully");
      } catch (innerErr: unknown) {
        const errorMessage = innerErr instanceof Error ? innerErr.message : "Unknown error";
        console.error("Error processing message:", errorMessage);
      }
    }
  }
}
