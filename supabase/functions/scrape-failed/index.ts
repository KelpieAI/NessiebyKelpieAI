import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Nessie-Secret",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const nessieSecret = Deno.env.get("NESSIE_INGEST_SECRET");
    const requestSecret = req.headers.get("X-Nessie-Secret");

    if (!nessieSecret || requestSecret !== nessieSecret) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = await req.json();

    if (payload.event !== "scrape_failed") {
      return new Response(
        JSON.stringify({ error: "Invalid event type. Expected scrape_failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!payload.website || !payload.batch_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: website and batch_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: existing } = await supabase
      .from("failed_scrapes")
      .select("*")
      .eq("website", payload.website)
      .eq("batch_id", payload.batch_id)
      .maybeSingle();

    const now = new Date().toISOString();

    if (existing) {
      await supabase
        .from("failed_scrapes")
        .update({
          attempts: existing.attempts + 1,
          error_code: String(payload.error_code),
          error_message: payload.error_message,
          timestamp: payload.timestamp,
          last_updated: now,
          status: "failed",
        })
        .eq("website", payload.website)
        .eq("batch_id", payload.batch_id);
    } else {
      await supabase
        .from("failed_scrapes")
        .insert({
          website: payload.website,
          batch_id: payload.batch_id,
          timestamp: payload.timestamp,
          error_code: String(payload.error_code),
          error_message: payload.error_message,
          attempts: payload.attempt || 1,
          status: "failed",
          last_updated: now,
        });
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});