import { NextRequest, NextResponse } from 'next/server';
import { createPaymentIntent } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase environment variables not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Stripe secret key not configured');
      return NextResponse.json(
        { error: 'Payment service not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { bookingId, amount, customerId, braiderId } = body;

    console.log('Payment intent request:', { bookingId, amount, customerId, braiderId });

    // Validate required fields
    if (!bookingId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: bookingId and amount' },
        { status: 400 }
      );
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    // Verify booking exists
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError) {
      console.error('Booking fetch error:', bookingError);
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    console.log('Booking found:', booking.id);

    // Create payment intent with Stripe
    let result;
    try {
      result = await createPaymentIntent(amount, 'usd', undefined, {
        bookingId,
        customerId: customerId || booking.customer_id,
        braiderId: braiderId || booking.braider_id,
        bookingDate: booking.appointment_date,
      });
      console.log('Payment intent created:', result.paymentIntentId);
    } catch (stripeError) {
      console.error('Stripe error:', stripeError);
      const errorMessage = stripeError instanceof Error ? stripeError.message : 'Stripe API error';
      return NextResponse.json(
        { error: `Payment service error: ${errorMessage}` },
        { status: 500 }
      );
    }

    // Update booking with payment intent ID
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        stripe_payment_intent_id: result.paymentIntentId,
        status: 'pending',
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Booking update error:', updateError);
      throw updateError;
    }

    console.log('Booking updated with payment intent');

    return NextResponse.json({
      success: true,
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId,
    });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create payment intent';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
