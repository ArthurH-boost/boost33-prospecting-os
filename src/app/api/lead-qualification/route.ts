import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      contact_name,
      company,
      reply_content,
      qualification,
      next_action,
      campaign_id,
      desk,
    } = body;

    if (!contact_name || !qualification || !next_action || !desk) {
      return NextResponse.json(
        { error: 'Missing required fields: contact_name, qualification, next_action, desk' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Deduplication: skip if same contact_name + company + desk exists within last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    let dupQuery = supabase
      .from('lead_qualifications')
      .select('id')
      .eq('contact_name', contact_name)
      .eq('desk', desk)
      .gte('created_at', fiveMinutesAgo);

    if (company) {
      dupQuery = dupQuery.eq('company', company);
    } else {
      dupQuery = dupQuery.is('company', null);
    }

    const { data: existing } = await dupQuery.limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { skipped: true, reason: 'Duplicate lead within 5-minute window', existing_id: existing[0].id },
        { status: 200 }
      );
    }

    // Insert with actual reply_content
    const { data, error } = await supabase.from('lead_qualifications').insert({
      contact_name,
      company: company || null,
      reply_content: reply_content || null,
      qualification,
      next_action,
      campaign_id: campaign_id || null,
      desk,
    }).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, lead: data }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
