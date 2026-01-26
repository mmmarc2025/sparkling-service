
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

console.log("LINE Auth Function Started");

const LINE_LOGIN_CHANNEL_ID = Deno.env.get("LINE_LOGIN_CHANNEL_ID")!;
const LINE_LOGIN_CHANNEL_SECRET = Deno.env.get("LINE_LOGIN_CHANNEL_SECRET")!;
const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "http://localhost:5173";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Generate simple token
function generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    // CORS headers
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    };

    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // GET /line-auth/login - Redirect to LINE Login
        if (path === "login" && req.method === "GET") {
            const redirectUri = `${supabaseUrl}/functions/v1/line-auth/callback`;
            const state = generateToken().slice(0, 16);

            const lineAuthUrl = new URL("https://access.line.me/oauth2/v2.1/authorize");
            lineAuthUrl.searchParams.set("response_type", "code");
            lineAuthUrl.searchParams.set("client_id", LINE_LOGIN_CHANNEL_ID);
            lineAuthUrl.searchParams.set("redirect_uri", redirectUri);
            lineAuthUrl.searchParams.set("state", state);
            lineAuthUrl.searchParams.set("scope", "profile openid");

            return Response.redirect(lineAuthUrl.toString(), 302);
        }

        // GET /line-auth/callback - Handle LINE OAuth callback
        if (path === "callback" && req.method === "GET") {
            const code = url.searchParams.get("code");
            const error = url.searchParams.get("error");

            if (error) {
                return Response.redirect(`${FRONTEND_URL}/login?error=${error}`, 302);
            }

            if (!code) {
                return Response.redirect(`${FRONTEND_URL}/login?error=no_code`, 302);
            }

            // Exchange code for token
            const redirectUri = `${supabaseUrl}/functions/v1/line-auth/callback`;
            const tokenResponse = await fetch("https://api.line.me/oauth2/v2.1/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    grant_type: "authorization_code",
                    code: code,
                    redirect_uri: redirectUri,
                    client_id: LINE_LOGIN_CHANNEL_ID,
                    client_secret: LINE_LOGIN_CHANNEL_SECRET,
                }),
            });

            if (!tokenResponse.ok) {
                console.error("Token exchange failed:", await tokenResponse.text());
                return Response.redirect(`${FRONTEND_URL}/login?error=token_exchange_failed`, 302);
            }

            const tokenData = await tokenResponse.json();
            const accessToken = tokenData.access_token;

            // Get user profile
            const profileResponse = await fetch("https://api.line.me/v2/profile", {
                headers: { "Authorization": `Bearer ${accessToken}` },
            });

            if (!profileResponse.ok) {
                console.error("Profile fetch failed:", await profileResponse.text());
                return Response.redirect(`${FRONTEND_URL}/login?error=profile_failed`, 302);
            }

            const profile = await profileResponse.json();
            const lineUserId = profile.userId;
            const displayName = profile.displayName;
            const pictureUrl = profile.pictureUrl;

            // Check if user exists
            let { data: existingUser } = await supabase
                .from("users")
                .select("*")
                .eq("line_user_id", lineUserId)
                .maybeSingle();

            let userId: string;

            if (existingUser) {
                // Update last login
                await supabase
                    .from("users")
                    .update({
                        last_login_at: new Date().toISOString(),
                        display_name: displayName,
                        picture_url: pictureUrl
                    })
                    .eq("id", existingUser.id);
                userId = existingUser.id;
            } else {
                // Create new user
                const { data: newUser, error: createError } = await supabase
                    .from("users")
                    .insert([{
                        line_user_id: lineUserId,
                        display_name: displayName,
                        picture_url: pictureUrl,
                        role: "user", // Default role
                        last_login_at: new Date().toISOString()
                    }])
                    .select()
                    .single();

                if (createError || !newUser) {
                    console.error("User creation failed:", createError);
                    return Response.redirect(`${FRONTEND_URL}/login?error=user_creation_failed`, 302);
                }
                userId = newUser.id;
            }

            // Create session token
            const sessionToken = generateToken();
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

            await supabase.from("user_sessions").insert([{
                user_id: userId,
                token: sessionToken,
                expires_at: expiresAt.toISOString()
            }]);

            // Redirect to frontend with token
            return Response.redirect(`${FRONTEND_URL}/auth/callback?token=${sessionToken}`, 302);
        }

        // POST /line-auth/verify - Verify session token
        if (path === "verify" && req.method === "POST") {
            const body = await req.json();
            const token = body.token;

            if (!token) {
                return new Response(JSON.stringify({ error: "No token provided" }), {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            // Find session
            const { data: session } = await supabase
                .from("user_sessions")
                .select("*, users(*)")
                .eq("token", token)
                .gt("expires_at", new Date().toISOString())
                .maybeSingle();

            if (!session) {
                return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
                    status: 401,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            return new Response(JSON.stringify({
                user: session.users,
                expiresAt: session.expires_at
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // POST /line-auth/logout - Logout
        if (path === "logout" && req.method === "POST") {
            const body = await req.json();
            const token = body.token;

            if (token) {
                await supabase.from("user_sessions").delete().eq("token", token);
            }

            return new Response(JSON.stringify({ success: true }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        return new Response("Not Found", { status: 404 });

    } catch (err) {
        console.error("Error:", err);
        return new Response(JSON.stringify({ error: String(err) }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
