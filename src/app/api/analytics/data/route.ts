import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const [qualifications, pipeline, campaigns] = await Promise.all([
      supabase
        .from('lead_qualifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(2000),
      supabase
        .from('pipeline_contacts')
        .select('*')
        .order('last_stage_change_at', { ascending: false }),
      supabase
        .from('campaign_stats')
        .select('*')
        .order('synced_at', { ascending: false }),
    ]);

    if (qualifications.error) throw qualifications.error;
    if (pipeline.error) throw pipeline.error;
    if (campaigns.error) throw campaigns.error;

    return NextResponse.json({
      qualifications: qualifications.data,
      pipeline: pipeline.data,
      campaigns: campaigns.data,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
