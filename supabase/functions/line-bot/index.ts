
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

console.log("LINE Bot Function Started (With Timezone Fix)");

const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN")!;
const LINE_CHANNEL_SECRET = Deno.env.get("LINE_CHANNEL_SECRET")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

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
  } else {
    console.log("Message sent to LINE");
  }
}

// Call Lovable AI Gateway for AI response
async function getAIResponse(userMessage: string, systemPrompt: string, history: any[] = []): Promise<string> {
  console.log("Calling Lovable AI Gateway...");

  const messages = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: userMessage }
  ];

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Lovable AI error:", response.status, errorText);
    throw new Error(`Lovable AI error: ${response.status}`);
  }

  const data = await response.json();
  const aiText = data.choices?.[0]?.message?.content;

  if (!aiText) {
    console.error("No response from Lovable AI:", JSON.stringify(data));
    throw new Error("No response from AI");
  }

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

  const basePrompt = data?.value || "你是一位專業的汽車美容服務助理。請用繁體中文回答客戶的問題，提供友善、專業的服務諮詢。";

  // Calculate Current Time for Context
  const now = new Date();
  // Adjust to Taipei Time (UTC+8) roughly for display context, or use locale string
  const taiwanTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
  const currentTimeString = taiwanTime.toLocaleString("zh-TW", { hour12: false }); // e.g. "2024/10/22 22:15:30"

  // Inject Booking Instruction with Time Context
  const bookingInstruction = `
  
  [CURRENT DATE/TIME]
  Today is: ${currentTimeString} (Asia/Taipei Time)
  
  [SYSTEM INSTRUCTION]
  When the user confirms they want to book an appointment AND you have collected:
  1. Customer Name
  2. Phone Number
  3. Service Type
  4. Reservation Time (Start Time)
  
  You MUST output a special JSON block at the very end of your response.
  
  Format:
  <<<BOOKING>>>
  {
    "customer_name": "Name",
    "phone": "Phone",
    "service_type": "Service",
    "start_time": "YYYY-MM-DDTHH:mm:ss"
  }
  <<<BOOKING>>>
  
  IMPORTANT TIMEZONE RULES:
  1. All times discussed are in Taiwan Time (UTC+8).
  2. The 'start_time' in JSON must be in ISO 8601 format WITH THE +08:00 OFFSET.
     Example: "2026-01-30T10:00:00+08:00"
     Do NOT output in UTC (Z). Always strictly append +08:00.
  3. Do NOT output this block unless all details are confirmed.
  `;

  return basePrompt + bookingInstruction;
}

// Process LINE webhook events
async function processEvents(events: any[]): Promise<void> {
  for (const event of events) {
    if (event.replyToken === "00000000000000000000000000000000") continue;

    if (event.type === "message" && event.message?.type === "text") {
      const userMessage = event.message.text;
      const replyToken = event.replyToken;
      const userId = event.source?.userId;

      console.log(`Processing from ${userId}:`, userMessage);

      try {
        const systemPrompt = await getSystemPrompt();

        let historyMessages: { role: string; content: string }[] = [];
        if (userId) {
          const { data: history } = await supabase
            .from('chat_history')
            .select('role, content')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);

          if (history) {
            historyMessages = history.reverse().map(h => ({
              role: h.role === 'user' ? 'user' : 'assistant',
              content: h.content
            }));
          }
        }

        let aiResponse = await getAIResponse(userMessage, systemPrompt, historyMessages);

        const bookingRegex = /<<<BOOKING>>>([\s\S]*?)<<<BOOKING>>>/;
        const match = aiResponse.match(bookingRegex);

        if (match) {
          const jsonString = match[1];
          try {
            const bookingData = JSON.parse(jsonString);
            console.log("Booking matched:", bookingData);

            const { error: insertError } = await supabase
              .from('bookings')
              .insert([
                {
                  customer_name: bookingData.customer_name,
                  phone: bookingData.phone,
                  service_type: bookingData.service_type,
                  start_time: bookingData.start_time,
                  status: 'PENDING'
                }
              ]);

            if (insertError) {
              console.error("Booking DB Insert Error:", insertError);
              aiResponse = aiResponse.replace(bookingRegex, "").trim() + "\n(系統: 預約建立失敗，請聯絡管理員)";
            } else {
              console.log("Booking created!");
              aiResponse = aiResponse.replace(bookingRegex, "").trim();
            }
          } catch (e) {
            console.error("JSON Parse Error:", e);
            aiResponse = aiResponse.replace(bookingRegex, "").trim();
          }
        }

        await replyMessage(replyToken, aiResponse);

        if (userId) {
          await supabase.from('chat_history').insert([
            { user_id: userId, role: 'user', content: userMessage },
            { user_id: userId, role: 'assistant', content: aiResponse }
          ]);
        }

      } catch (err) {
        console.error("Error processing:", err);
        try {
          await replyMessage(replyToken, `Error: ${err instanceof Error ? err.message : String(err)}`);
        } catch (ignored) { }
      }
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200 });

  try {
    const signature = req.headers.get("x-line-signature");
    const body = await req.text();

    // Strict validation
    const isValid = signature ? await validateSignature(body, signature) : false;
    if (!isValid) {
      console.error("Invalid signature");
    }

    let events: any[] = [];
    try {
      events = JSON.parse(body).events || [];
    } catch { }

    const processingPromise = processEvents(events);

    // @ts-ignore
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(processingPromise);
    } else {
      processingPromise.catch(console.error);
    }

    return new Response("OK", { status: 200 });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Request error:", msg);
    return new Response("Internal Server Error", { status: 500 });
  }
});
