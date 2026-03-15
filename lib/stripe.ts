import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is not configured');
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
});

/**
 * Create a payment intent for a booking
 */
export async function createPaymentIntent(
  amount: number,
  currency: string = 'usd',
  customerId?: string,
  metadata?: Record<string, string>
) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      customer: customerId,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
    });

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error('Failed to create payment intent:', error);
    throw error;
  }
}

/**
 * Confirm a payment intent
 */
export async function confirmPaymentIntent(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return {
      success: paymentIntent.status === 'succeeded',
      status: paymentIntent.status,
      chargeId: paymentIntent.charges.data[0]?.id,
    };
  } catch (error) {
    console.error('Failed to confirm payment intent:', error);
    throw error;
  }
}

/**
 * Create a Stripe Connect account for a braider
 */
export async function createConnectAccount(
  email: string,
  fullName: string,
  country: string = 'US'
) {
  try {
    const account = await stripe.accounts.create({
      type: 'express',
      country,
      email,
      business_profile: {
        name: fullName,
        product_category: 'beauty_and_personal_care',
      },
    });

    return {
      success: true,
      accountId: account.id,
    };
  } catch (error) {
    console.error('Failed to create Connect account:', error);
    throw error;
  }
}

/**
 * Create an account link for onboarding
 */
export async function createAccountLink(
  accountId: string,
  refreshUrl: string,
  returnUrl: string
) {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      type: 'account_onboarding',
      refresh_url: refreshUrl,
      return_url: returnUrl,
    });

    return {
      success: true,
      url: accountLink.url,
    };
  } catch (error) {
    console.error('Failed to create account link:', error);
    throw error;
  }
}

/**
 * Create a transfer to a braider's connected account
 */
export async function createTransfer(
  amount: number,
  destinationAccountId: string,
  sourceTransactionId: string,
  currency: string = 'usd'
) {
  try {
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      destination: destinationAccountId,
      metadata: {
        sourceTransactionId,
        timestamp: new Date().toISOString(),
      },
    });

    return {
      success: true,
      transferId: transfer.id,
      status: transfer.status,
    };
  } catch (error) {
    console.error('Failed to create transfer:', error);
    throw error;
  }
}

/**
 * Create a payout for a braider
 */
export async function createPayout(
  accountId: string,
  amount: number,
  currency: string = 'usd'
) {
  try {
    const payout = await stripe.payouts.create(
      {
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        method: 'instant',
      },
      {
        stripeAccount: accountId,
      }
    );

    return {
      success: true,
      payoutId: payout.id,
      status: payout.status,
      arrivalDate: payout.arrival_date,
    };
  } catch (error) {
    console.error('Failed to create payout:', error);
    throw error;
    }
}

/**
 * Refund a charge
 */
export async function refundCharge(
  chargeId: string,
  amount?: number,
  reason?: string
) {
  try {
    const refund = await stripe.refunds.create({
      charge: chargeId,
      amount: amount ? Math.round(amount * 100) : undefined,
      reason: reason as any,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });

    return {
      success: true,
      refundId: refund.id,
      status: refund.status,
      amount: refund.amount / 100,
    };
  } catch (error) {
    console.error('Failed to refund charge:', error);
    throw error;
  }
}

/**
 * Get account balance
 */
export async function getAccountBalance(accountId: string) {
  try {
    const balance = await stripe.balance.retrieve({
      stripeAccount: accountId,
    });

    return {
      success: true,
      available: balance.available[0]?.amount || 0,
      pending: balance.pending[0]?.amount || 0,
    };
  } catch (error) {
    console.error('Failed to get account balance:', error);
    throw error;
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): Stripe.Event | null {
  try {
    return stripe.webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return null;
  }
}

/**
 * Handle payment intent succeeded event
 */
export async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
  onSuccess: (data: {
    paymentIntentId: string;
    chargeId: string;
    amount: number;
    metadata: Record<string, string>;
  }) => Promise<void>
) {
  try {
    const chargeId = paymentIntent.charges.data[0]?.id;
    if (!chargeId) throw new Error('No charge found');

    await onSuccess({
      paymentIntentId: paymentIntent.id,
      chargeId,
      amount: paymentIntent.amount / 100,
      metadata: paymentIntent.metadata || {},
    });
  } catch (error) {
    console.error('Failed to handle payment intent succeeded:', error);
    throw error;
  }
}

/**
 * Handle payment intent failed event
 */
export async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent,
  onFailure: (data: {
    paymentIntentId: string;
    reason: string;
    metadata: Record<string, string>;
  }) => Promise<void>
) {
  try {
    await onFailure({
      paymentIntentId: paymentIntent.id,
      reason: paymentIntent.last_payment_error?.message || 'Payment failed',
      metadata: paymentIntent.metadata || {},
    });
  } catch (error) {
    console.error('Failed to handle payment intent failed:', error);
    throw error;
  }
}

/**
 * Handle charge refunded event
 */
export async function handleChargeRefunded(
  charge: Stripe.Charge,
  onRefund: (data: {
    chargeId: string;
    refundAmount: number;
    reason: string;
    metadata: Record<string, string>;
  }) => Promise<void>
) {
  try {
    await onRefund({
      chargeId: charge.id,
      refundAmount: charge.amount_refunded / 100,
      reason: charge.refunded ? 'Full refund' : 'Partial refund',
      metadata: charge.metadata || {},
    });
  } catch (error) {
    console.error('Failed to handle charge refunded:', error);
    throw error;
  }
}
