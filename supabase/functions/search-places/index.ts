import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

function extractDomain(url: string): string {
  return url
    .toLowerCase()
    .replace(/^https?:\/\/(www\.)?/, '')
    .replace(/\/.*$/, '')
    .trim()
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const { query, location, industry } = await req.json()

    if (!query || !location) {
      return new Response(
        JSON.stringify({ error: 'query and location are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!GOOGLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Google API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)
    let userId: string | null = null

    const authHeader = req.headers.get('Authorization')
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      if (user) userId = user.id
    }

    const searchQuery = `${query} in ${location}`
    const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${GOOGLE_API_KEY}`
    const textSearchRes = await fetch(textSearchUrl)
    const textSearchData = await textSearchRes.json()

    if (textSearchData.status !== 'OK' && textSearchData.status !== 'ZERO_RESULTS') {
      return new Response(
        JSON.stringify({ error: `Google Text Search error: ${textSearchData.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const places = textSearchData.results || []

    const candidates = []
    for (const place of places) {
      try {
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,website,formatted_phone_number,international_phone_number&key=${GOOGLE_API_KEY}`
        const detailsRes = await fetch(detailsUrl)
        const detailsData = await detailsRes.json()
        const details = detailsData.result || {}
        const website = details.website || ''

        candidates.push({
          company: details.name || place.name,
          location: details.formatted_address || place.formatted_address,
          industry: industry || query,
          website,
          domain: website ? extractDomain(website) : null,
          phone: details.international_phone_number || details.formatted_phone_number || null,
        })
      } catch {
        candidates.push({
          company: place.name,
          location: place.formatted_address,
          industry: industry || query,
          website: '',
          domain: null,
          phone: null,
        })
      }
    }

    const domainsToCheck = candidates.map(c => c.domain).filter(Boolean) as string[]
    let existingRecords: any[] = []

    if (domainsToCheck.length > 0) {
      const { data: existing } = await supabase
        .from('successful_scrapes')
        .select(`
          id,
          company,
          website,
          domain_normalized,
          lead_status,
          emails,
          contacted_at,
          created_at,
          batch_uuid,
          owner_user_id,
          tags
        `)
        .in('domain_normalized', domainsToCheck)

      existingRecords = existing || []
    }

    const existingByDomain = new Map<string, any>()
    existingRecords.forEach(r => {
      if (r.domain_normalized) existingByDomain.set(r.domain_normalized, r)
    })

    const newCandidates = []
    const duplicateCandidates = []

    for (const c of candidates) {
      if (c.domain && existingByDomain.has(c.domain)) {
        const existing = existingByDomain.get(c.domain)

        const { data: batchData } = await supabase
          .from('batches')
          .select('id, label, channel, created_at')
          .eq('id', existing.batch_uuid)
          .single()

        const { count: emailsSent } = await supabase
          .from('sent_emails')
          .select('*', { count: 'exact', head: true })
          .eq('lead_id', existing.id)

        duplicateCandidates.push({
          company: c.company,
          location: c.location,
          website: c.website,
          phone: c.phone,
          industry: c.industry,
          domain: c.domain,
          existing: {
            id: existing.id,
            lead_status: existing.lead_status,
            emails_enriched: existing.emails?.length > 0,
            emails_count: existing.emails?.length || 0,
            emails_sent: emailsSent || 0,
            contacted_at: existing.contacted_at,
            created_at: existing.created_at,
            tags: existing.tags || [],
            batch: batchData ? {
              id: batchData.id,
              label: batchData.label,
              channel: batchData.channel,
              created_at: batchData.created_at,
            } : null,
          }
        })
      } else {
        newCandidates.push(c)
      }
    }

    if (newCandidates.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          count: 0,
          skipped: duplicateCandidates.length,
          batch_id: null,
          batch_label: null,
          message: `All ${duplicateCandidates.length} businesses already exist`,
          leads: [],
          duplicates: duplicateCandidates,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const batchLabel = `${query} in ${location}`
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .insert({
        label: batchLabel,
        channel: 'lead-finder',
        status: 'complete',
        owner_user_id: userId,
        total_urls: newCandidates.length,
        processed_urls: newCandidates.length,
        successful_count: newCandidates.length,
        failed_count: 0,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (batchError) {
      return new Response(
        JSON.stringify({ error: `Failed to create batch: ${batchError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const realBatchId = batch.id

    const leadsToInsert = newCandidates.map(lead => ({
      company: lead.company,
      location: lead.location,
      industry: lead.industry,
      website: lead.website,
      phone: lead.phone,
      lead_status: 'new',
      tags: ['google-places'],
      emails: [],
      batch_id: realBatchId,
      batch_uuid: realBatchId,
      owner_user_id: userId,
    }))

    const { data: insertedLeads, error: insertError } = await supabase
      .from('successful_scrapes')
      .insert(leadsToInsert)
      .select()

    if (insertError) {
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    await supabase
      .from('lead_searches')
      .insert({
        owner_user_id: userId,
        query,
        location,
        industry: industry || null,
        results_count: newCandidates.length,
        status: 'completed'
      })

    return new Response(
      JSON.stringify({
        success: true,
        count: newCandidates.length,
        skipped: duplicateCandidates.length,
        batch_id: realBatchId,
        batch_label: batchLabel,
        enrichment_summary: {
          with_website: newCandidates.filter(l => l.website).length,
          with_phone: newCandidates.filter(l => l.phone).length,
        },
        leads: insertedLeads,
        duplicates: duplicateCandidates,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
