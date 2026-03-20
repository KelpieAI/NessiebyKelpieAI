import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RetryRequest {
  website: string;
  batch_id: string;
}

interface MakeRetryPayload {
  trigger: string;
  website: string;
  batch_id: string;
  source: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const body: RetryRequest = await req.json();

    if (!body.website || !body.batch_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: website, batch_id" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: existing } = await supabase
      .from("failed_scrapes")
      .select("attempts")
      .eq("website", body.website)
      .eq("batch_id", body.batch_id)
      .maybeSingle();

    if (!existing) {
      return new Response(
        JSON.stringify({ error: "Scrape record not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { error: updateError } = await supabase
      .from("failed_scrapes")
      .update({
        status: "retrying",
        attempts: existing.attempts + 1,
        last_updated: new Date().toISOString(),
      })
      .eq("website", body.website)
      .eq("batch_id", body.batch_id);

    if (updateError) {
      throw updateError;
    }

    const makeWebhookUrl = Deno.env.get("MAKE_RETRY_WEBHOOK_URL");
    if (!makeWebhookUrl) {
      return new Response(
        JSON.stringify({ error: "Make webhook URL not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const makePayload: MakeRetryPayload = {
      trigger: "retry_single",
      website: body.website,
      batch_id: body.batch_id,
      source: "nessie_ui",
    };

    const makeResponse = await fetch(makeWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(makePayload),
    });

    if (!makeResponse.ok) {
      await supabase
        .from("failed_scrapes")
        .update({
          status: "failed",
          last_updated: new Date().toISOString(),
        })
        .eq("website", body.website)
        .eq("batch_id", body.batch_id);

      return new Response(
        JSON.stringify({ error: `Make API returned ${makeResponse.status}` }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ ok: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error retrying scrape:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});