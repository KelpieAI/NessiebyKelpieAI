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

    if (!payload.website || !payload.batch_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: website and batch_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date().toISOString();
    const timestamp = payload.timestamp || now;

    const { data: existingFailed } = await supabase
      .from("failed_scrapes")
      .select("*")
      .eq("website", payload.website)
      .eq("batch_id", payload.batch_id)
      .maybeSingle();

    let successStatus = "success";

    if (existingFailed) {
      successStatus = "resolved";
      
      await supabase
        .from("failed_scrapes")
        .update({
          status: "resolved",
          last_updated: now,
        })
        .eq("website", payload.website)
        .eq("batch_id", payload.batch_id);
    }

    const { error: insertError } = await supabase
      .from("successful_scrapes")
      .insert({
        website: payload.website,
        domain: payload.domain || null,
        company: payload.company || null,
        batch_id: payload.batch_id,
        batch_uuid: payload.batch_uuid || payload.batch_id,
        timestamp: timestamp,
        emails: payload.emails || [],
        industry: payload.industry || null,
        icebreaker: payload.icebreaker || null,
        subject: payload.subject || null,
        message: payload.message || null,
        status: successStatus,
      });

    if (insertError) {
      if (insertError.code === '23505') {
        return new Response(
          JSON.stringify({ error: "Duplicate entry: This scrape has already been marked as successful" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw insertError;
    }

    return new Response(
      JSON.stringify({ 
        ok: true, 
        status: successStatus,
        message: successStatus === "resolved" 
          ? "Previously failed scrape marked as resolved" 
          : "Scrape marked as successful"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});