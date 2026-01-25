
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { type WebhookEvent, messagingApi, validateSignature } from "npm:@line/bot-sdk@7.5.2";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";
import { createClient } from "npm:@supabase/supabase-js@2";

console.log("LINE Bot Function Started");

const channelAccessToken = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN")!;
const channelSecret = (Deno.env.get("LINE_CHANNEL_SECRET") || "").trim();
const geminiApiKey = Deno.env.get("GEMINI_API_KEY")!;

// Initialize LINE Client
const client = new messagingApi.MessagingApiClient({
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
      return new Response("Missing signature", { status: 401 });
    }

    const body = await req.text();

    if (!channelSecret) {
      return new Response("Server Error: Missing Channel Secret", { status: 500 });
    }

    // Validate signature
    if (!validateSignature(body, channelSecret, signature)) {
      const secretPreview = channelSecret.substring(0, 3) + "***" + channelSecret.substring(channelSecret.length - 3);
      return new Response(`Invalid signature. Used Secret: ${secretPreview}. BodyLen: ${body.length}`, { status: 401 });
    }

    const events: WebhookEvent[] = JSON.parse(body).events;

    const processingPromise = processEvents(events);

    // @ts-ignore
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(processingPromise);
    } else {
      processingPromise.catch(console.error);
    }

    return new Response("OK", { status: 200 });

  } catch (err) {
    console.error("Error processing request:", err);
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
});

async function processEvents(events: WebhookEvent[]) {
  await Promise.all(
    events.map(async (event) => {
      if (event.replyToken === '00000000000000000000000000000000') return;

      if (event.type === "message" && event.message.type === "text") {
        const userMessage = event.message.text;
        const replyToken = event.replyToken;

        try {
          let systemPrompt = "You are a helpful car wash assistant.";
          const { data: setting } = await supabase
            .from("system_settings")
            .select("value")
            .eq("key", "GEMINI_SYSTEM_PROMPT")
            .single();

          if (setting?.value) systemPrompt = setting.value;

          const model = genAI.getGenerativeModel({ model: "gemini-pro" });
          const chat = model.startChat({
            history: [
              { role: "user", parts: [{ text: `System Instruction: ${systemPrompt}` }] },
              { role: "model", parts: [{ text: "Understood." }] },
            ],
          });

          const result = await chat.sendMessage(userMessage);
          const aiResponse = result.response.text();

          await client.replyMessage({
            replyToken: replyToken,
            messages: [{ type: "text", text: aiResponse }],
          });
        } catch (innerErr) {
          console.error("Error:", innerErr);
        }
      }
    })
  );
}
