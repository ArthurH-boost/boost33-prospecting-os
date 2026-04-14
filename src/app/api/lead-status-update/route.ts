import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const VALID_STATUSES = [
  'À contacter',
  'Appelé',
  'RDV booké',
  'Pas intéressé',
  'Sans réponse',
  'Relance',
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contact_name, company, ghl_contact_id, status, desk, updated_by } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid or missing status. Valid values: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    if (!ghl_contact_id && !contact_name) {
      return NextResponse.json(
        { error: 'Must provide either ghl_contact_id or contact_name to identify the lead' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Try to find lead by ghl_contact_id first, then by contact_name + company
    let leadId: string | null = null;

    if (ghl_contact_id) {
      const { data } = await supabase
        .from('lead_qualifications')
        .select('id')
        .eq('ghl_contact_id', ghl_contact_id)
        .limit(1)
        .single();

      if (data) leadId = data.id;
    }

    if (!leadId && contact_name) {
      let query = supabase
        .from('lead_qualifications')
        .select('id')
        .eq('contact_name', contact_name);

      if (company) {
        query = query.eq('company', company);
      }
      if (desk) {
        query = query.eq('desk', desk);
      }

      const { data } = await query
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) leadId = data.id;
    }

    const now = new Date().toISOString();

    if (leadId) {
      const { error } = await supabase
        .from('lead_qualifications')
        .update({
          status,
          updated_at: now,
          updated_by: updated_by || null,
        })
        .eq('id', leadId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, action: 'updated', lead_id: leadId });
    }

    // Lead not found — insert new row
    const { data: inserted, error: insertError } = await supabase
      .from('lead_qualifications')
      .insert({
        contact_name: contact_name || null,
        company: company || null,
        ghl_contact_id: ghl_contact_id || null,
        desk: desk || 'Arthur',
        qualification: 'TIEDE',
        next_action: 'Relance',
        status,
        updated_at: now,
        updated_by: updated_by || null,
      })
      .select('id')
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, action: 'created', lead_id: inserted.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
