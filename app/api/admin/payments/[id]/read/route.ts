import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

interface MarkReadRequest {
  admin_id: string;
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body: MarkReadRequest = await request.json();
    const paymentId = params.id;

    // Use service role client to bypass RLS
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    if (!serviceSupabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // Validate required fields
    if (!body.admin_id) {
      return NextResponse.json(
        { error: 'Missing required field: admin_id' },
        { status: 400 }
      );
    }

    // Verify payment notification exists
    const { data: paymentNotification, error: fetchError } = await serviceSupabase
      .from('payment_notifications')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (fetchError || !paymentNotification) {
      return NextResponse.json(
        { error: `Payment notification not found: ${paymentId}` },
        { status: 404 }
      );
    }

    // Verify admin_id matches
    if (paymentNotification.admin_id !== body.admin_id) {
      return NextResponse.json(
        { error: 'Unauthorized: admin_id does not match notification' },
        { status: 403 }
      );
    }

    // Update payment notification
    const now = new Date().toISOString();
    const { data, error } = await serviceSupabase
      .from('payment_notifications')
      .update({
        notification_sent: true,
        sent_at: paymentNotification.sent_at || now,
        updated_at: now,
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating payment notification:', error);
      return NextResponse.json(
        { error: `Failed to update payment notification: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('Payment notification marked as read:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Admin payments read API error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update payment notification';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
