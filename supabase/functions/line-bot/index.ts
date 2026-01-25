
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

console.log("LINE Bot Function Started (With Store Location)");

const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN")!;
const LINE_CHANNEL_SECRET = Deno.env.get("LINE_CHANNEL_SECRET")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Validate LINE signature
async function validateSignature(body: string, signature: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(LINE_CHANNEL_SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
  return signature === expectedSignature;
}

// Reply message to LINE
async function replyMessage(replyToken: string, text: string): Promise<void> {
  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ replyToken, messages: [{ type: "text", text }] }),
  });
}

// Calculate distance (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Call AI Gateway
async function getAIResponse(userMessage: string, systemPrompt: string, history: any[] = []): Promise<string> {
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

  if (!response.ok) throw new Error(`AI error: ${response.status}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content || "抱歉，我無法處理您的請求。";
}

// Build system prompt with all context
async function getSystemPrompt(): Promise<string> {
  const { data } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", "GEMINI_SYSTEM_PROMPT")
    .maybeSingle();

  const basePrompt = data?.value || "你是一位專業的汽車美容服務助理。請用繁體中文回答客戶的問題，提供友善、專業的服務諮詢。";

  // Fetch Services
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('id', { ascending: true });

  let serviceMenuText = "\n[SERVICE MENU & PRICING]\n";
  if (services && services.length > 0) {
    services.forEach((svc: any, index: number) => {
      if (svc.category === 'TIERED') {
        serviceMenuText += `${index + 1}. ${svc.name}: Small ${svc.price_small} / Medium ${svc.price_medium} / Large ${svc.price_large}\n`;
      } else {
        serviceMenuText += `${index + 1}. ${svc.name}: $${svc.price_flat}\n`;
      }
    });
  }

  // Fetch Stores
  const { data: stores } = await supabase
    .from('stores')
    .select('*')
    .eq('is_active', true);

  let storeListText = "\n[STORE LOCATIONS]\n";
  if (stores && stores.length > 0) {
    stores.forEach((store: any, index: number) => {
      storeListText += `${index + 1}. ${store.name} - ${store.address}\n`;
    });
  }

  // Time context
  const now = new Date();
  const taiwanTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
  const currentTimeString = taiwanTime.toLocaleString("zh-TW", { hour12: false });

  const bookingInstruction = `
  ${serviceMenuText}
  ${storeListText}

  [CURRENT DATE/TIME]
  Today is: ${currentTimeString} (Asia/Taipei Time)
  
  [BOOKING FLOW INSTRUCTION]
  When the user wants to book, you MUST collect these 5 items:
  1. Customer Name
  2. Phone Number
  3. Service Type
  4. Reservation Time
  5. **Store Location** - Ask the user "請問您想預約哪一家店呢？您可以傳送您的位置，我幫您找最近的店家！" 
     Then, if user sends their location (you will receive a message like "[LOCATION: lat, lng - nearest store: ...]"), use that nearest store.
     If user specifies a store name directly, use that.
  
  Once ALL 5 items are confirmed, output the booking JSON:
  <<<BOOKING>>>
  {
    "customer_name": "Name",
    "phone": "Phone",
    "service_type": "Service",
    "start_time": "YYYY-MM-DDTHH:mm:ss+08:00",
    "store_name": "Store Name"
  }
  <<<BOOKING>>>
  
  IMPORTANT TIMEZONE: Always use +08:00 offset.
  `;

  return basePrompt + bookingInstruction;
}

// Process events
async function processEvents(events: any[]): Promise<void> {
  for (const event of events) {
    if (event.replyToken === "00000000000000000000000000000000") continue;

    const replyToken = event.replyToken;
    const userId = event.source?.userId;

    // Handle LOCATION message
    if (event.type === "message" && event.message?.type === "location") {
      const userLat = event.message.latitude;
      const userLng = event.message.longitude;
      console.log(`Received location from ${userId}: ${userLat}, ${userLng}`);

      try {
        // Find nearest store
        const { data: stores } = await supabase.from('stores').select('*').eq('is_active', true);

        if (!stores || stores.length === 0) {
          await replyMessage(replyToken, "抱歉，目前沒有可用的店家資訊。");
          return;
        }

        let nearestStore = stores[0];
        let minDistance = calculateDistance(userLat, userLng, stores[0].lat, stores[0].lng);

        stores.forEach((store: any) => {
          const dist = calculateDistance(userLat, userLng, store.lat, store.lng);
          if (dist < minDistance) {
            minDistance = dist;
            nearestStore = store;
          }
        });

        const distanceKm = minDistance.toFixed(2);
        const responseText = `📍 您最近的店家是：\n\n**${nearestStore.name}**\n📌 ${nearestStore.address}\n🚗 距離約 ${distanceKm} 公里\n\n請問要幫您預約這家店嗎？`;

        await replyMessage(replyToken, responseText);

        // Save to chat history so AI knows the context
        if (userId) {
          await supabase.from('chat_history').insert([
            { user_id: userId, role: 'user', content: `[LOCATION: ${userLat}, ${userLng}]` },
            { user_id: userId, role: 'assistant', content: `找到最近店家: ${nearestStore.name} (${nearestStore.address}), 距離 ${distanceKm} 公里` }
          ]);
        }
      } catch (err) {
        console.error("Location processing error:", err);
        await replyMessage(replyToken, "處理位置時發生錯誤，請稍後再試。");
      }
      continue;
    }

    // Handle TEXT message
    if (event.type === "message" && event.message?.type === "text") {
      const userMessage = event.message.text;
      console.log(`Processing text from ${userId}:`, userMessage);

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

        // Process Booking Token
        const bookingRegex = /<<<BOOKING>>>([\s\S]*?)<<<BOOKING>>>/;
        const match = aiResponse.match(bookingRegex);

        if (match) {
          try {
            const bookingData = JSON.parse(match[1]);
            console.log("Booking matched:", bookingData);

            const { error: insertError } = await supabase
              .from('bookings')
              .insert([{
                customer_name: bookingData.customer_name,
                phone: bookingData.phone,
                service_type: bookingData.service_type,
                start_time: bookingData.start_time,
                status: 'PENDING'
              }]);

            if (insertError) {
              console.error("Booking DB Error:", insertError);
              aiResponse = aiResponse.replace(bookingRegex, "").trim() + "\n(系統: 預約建立失敗)";
            } else {
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
        console.error("Error:", err);
        await replyMessage(replyToken, `Error: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200 });

  try {
    const signature = req.headers.get("x-line-signature");
    const body = await req.text();

    if (signature) {
      const isValid = await validateSignature(body, signature);
      if (!isValid) console.error("Invalid signature");
    }

    let events: any[] = [];
    try { events = JSON.parse(body).events || []; } catch { }

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
    console.error("Request error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
});
