
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

console.log("LINE Bot Function Started (Multi-Store Logic)");

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
      model: "google/gemini-2.0-flash-exp", 
      messages: messages,
      max_tokens: 500,
      temperature: 0.5, 
    }),
  });

  if (!response.ok) {
    console.error("AI API Error:", await response.text());
    throw new Error(`AI error: ${response.status}`);
  }
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

  const basePrompt = data?.value || "你是一位專業的 WashCar 汽車美容服務助理。請用繁體中文回答。";

  // Fetch Active Stores
  const { data: stores } = await supabase
    .from('stores')
    .select('id, name, address')
    .eq('is_active', true);

  let storeListText = "\n[AVAILABLE STORES]\n";
  
  if (stores && stores.length > 0) {
    stores.forEach((store: any) => {
      storeListText += `- ${store.name} (ID: ${store.id}, Addr: ${store.address})\n`;
    });
  }

  // Fetch Services (General List)
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .limit(10); 

  let serviceMenuText = "\n[SERVICES]\n";
  if (services && services.length > 0) {
    services.forEach((svc: any) => {
      serviceMenuText += `- ${svc.name}: $${svc.price_flat || svc.price_small}\n`;
    });
  }

  // Time context
  const now = new Date();
  const taiwanTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
  const currentTimeString = taiwanTime.toLocaleString("zh-TW", { hour12: false });

  const bookingInstruction = `
  ${serviceMenuText}
  ${storeListText}

  [CURRENT TIME]
  Now: ${currentTimeString} (Taiwan Time)
  
  [BOOKING RULES]
  To make a booking, you MUST identify 5 fields. If any is missing, ASK the user.
  1. Customer Name
  2. Phone
  3. Service Name
  4. Time (ISO 8601 format with +08:00)
  5. **Store Name** (MUST EXACTLY match one from [AVAILABLE STORES])

  If the user says "nearest store" or sends location, ask them to confirm the store name I suggest.
  
  [OUTPUT FORMAT]
  If ALL 5 fields are collected and confirmed:
  Output ONLY this JSON block wrapped in <<<BOOKING>>>:
  <<<BOOKING>>>
  {
    "customer_name": "...",
    "phone": "...",
    "service_type": "...",
    "start_time": "2024-XX-XXTHH:MM:00+08:00",
    "store_name": "..."
  }
  <<<BOOKING>>>
  
  Otherwise, reply naturally to help the user.
  `;

  return basePrompt + bookingInstruction;
}

// Process events
async function processEvents(events: any[]): Promise<void> {
  for (const event of events) {
    if (event.replyToken === "00000000000000000000000000000000") continue;

    const replyToken = event.replyToken;
    const userId = event.source?.userId;

    // 1. Handle LOCATION
    if (event.type === "message" && event.message?.type === "location") {
      const userLat = event.message.latitude;
      const userLng = event.message.longitude;
      
      const { data: stores } = await supabase.from('stores').select('*').eq('is_active', true);
      
      if (!stores || stores.length === 0) {
        await replyMessage(replyToken, "抱歉，目前沒有營業中的店家。");
        continue;
      }

      let nearest = stores[0];
      let minDist = 99999;

      stores.forEach((store: any) => {
        const d = calculateDistance(userLat, userLng, store.lat, store.lng);
        if (d < minDist) {
          minDist = d;
          nearest = store;
        }
      });

      const msg = `📍 離您最近的是：\n${nearest.name}\n${nearest.address}\n(距離 ${minDist.toFixed(1)} km)\n\n要幫您預約這家嗎？`;
      
      // Save context so AI knows about this location
      if (userId) {
        await supabase.from('chat_history').insert([
          { user_id: userId, role: 'user', content: `[User Location: ${userLat}, ${userLng}]` },
          { user_id: userId, role: 'assistant', content: `System: Nearest store is ${nearest.name}` }
        ]);
      }
      
      await replyMessage(replyToken, msg);
      continue;
    }

    // 2. Handle TEXT
    if (event.type === "message" && event.message?.type === "text") {
      const userMessage = event.message.text;
      
      try {
        const systemPrompt = await getSystemPrompt();
        
        // Load History
        let historyMessages: any[] = [];
        if (userId) {
          const { data: history } = await supabase
            .from('chat_history')
            .select('role, content')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(6);
            
          if (history) {
            historyMessages = history.reverse().map(h => ({
              role: h.role === 'user' ? 'user' : 'assistant',
              content: h.content
            }));
          }
        }

        let aiResponse = await getAIResponse(userMessage, systemPrompt, historyMessages);

        // Check for Booking
        const bookingRegex = /<<<BOOKING>>>([\s\S]*?)<<<BOOKING>>>/;
        const match = aiResponse.match(bookingRegex);

        if (match) {
          try {
            const bookingJson = JSON.parse(match[1]);
            console.log("Booking Attempt:", bookingJson);

            // 🔍 Resolve Store Name to Store ID
            const { data: storeData } = await supabase
              .from('stores')
              .select('id')
              .eq('name', bookingJson.store_name)
              .single();

            if (storeData) {
              const { error } = await supabase.from('bookings').insert([{
                customer_name: bookingJson.customer_name,
                phone: bookingJson.phone,
                service_type: bookingJson.service_type,
                start_time: bookingJson.start_time,
                store_id: storeData.id, // ✅ Critical: Link to store
                status: 'PENDING'
              }]);

              if (!error) {
                aiResponse = `✅ 預約成功！\n\n店家：${bookingJson.store_name}\n時間：${new Date(bookingJson.start_time).toLocaleString('zh-TW')}\n項目：${bookingJson.service_type}\n\n店家確認後會發送通知給您。`;
              } else {
                console.error("DB Insert Error", error);
                aiResponse = "抱歉，系統建立訂單時發生錯誤，請稍後再試。";
              }
            } else {
              aiResponse = `找不到店家 "${bookingJson.store_name}"，請確認店名是否正確。`;
            }

          } catch (e) {
            console.error("Booking Parse Error", e);
            aiResponse = "預約資料格式有誤，請人工確認。";
          }
        }

        // Clean up internal tags before sending
        const cleanResponse = aiResponse.replace(bookingRegex, "").trim();
        if (cleanResponse) {
            await replyMessage(replyToken, cleanResponse);
        }

        // Save Chat
        if (userId) {
          await supabase.from('chat_history').insert([
            { user_id: userId, role: 'user', content: userMessage },
            { user_id: userId, role: 'assistant', content: cleanResponse }
          ]);
        }

      } catch (err) {
        console.error("Error processing text:", err);
        await replyMessage(replyToken, "系統忙碌中，請稍後再試。");
      }
    }
  }
}

serve(async (req) => {
  // Health Check
  if (req.method === "GET") return new Response("LINE Bot is Active", { status: 200 });
  if (req.method === "OPTIONS") return new Response(null, { status: 200 });

  try {
    const signature = req.headers.get("x-line-signature");
    const body = await req.text();

    if (!signature || !(await validateSignature(body, signature))) {
      return new Response("Unauthorized", { status: 401 });
    }

    const json = JSON.parse(body);
    const events = json.events || [];
    
    // Non-blocking processing (Edge Runtime compatible)
    const p = processEvents(events);
    // @ts-ignore
    if (typeof EdgeRuntime !== 'undefined') EdgeRuntime.waitUntil(p);
    else p.catch(console.error);

    return new Response("OK", { status: 200 });
  } catch (err) {
    return new Response(`Error: ${err}`, { status: 500 });
  }
});
