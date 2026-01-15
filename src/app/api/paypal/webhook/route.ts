/**
 * API Route: /api/paypal/webhook
 * 
 * PayPal Webhook handler - updates user plans in database
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
    sendWelcomeEmail,
    sendCancellationEmail,
    sendAdminPurchaseNotification
} from '@/lib/email';

// PayPal API base URLs
const PAYPAL_API_BASE = process.env.NODE_ENV === 'production'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

/**
 * Get PayPal access token
 */
async function getPayPalAccessToken(): Promise<string> {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error('PayPal credentials not configured');
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
        throw new Error('PayPal auth failed');
    }

    const data = await response.json();
    return data.access_token;
}

/**
 * Verify PayPal webhook signature
 */
async function verifyWebhookSignature(
    headers: Headers,
    body: string
): Promise<boolean> {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (!webhookId) {
        console.error('[PayPal Webhook] PAYPAL_WEBHOOK_ID not configured');
        return false;
    }

    try {
        const accessToken = await getPayPalAccessToken();

        const verificationData = {
            auth_algo: headers.get('paypal-auth-algo'),
            cert_url: headers.get('paypal-cert-url'),
            transmission_id: headers.get('paypal-transmission-id'),
            transmission_sig: headers.get('paypal-transmission-sig'),
            transmission_time: headers.get('paypal-transmission-time'),
            webhook_id: webhookId,
            webhook_event: JSON.parse(body),
        };

        const response = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(verificationData),
        });

        if (!response.ok) {
            console.error('[PayPal Webhook] Signature verification failed');
            return false;
        }

        const result = await response.json();
        return result.verification_status === 'SUCCESS';
    } catch (error) {
        console.error('[PayPal Webhook] Signature verification error:', error);
        return false;
    }
}

// Map PayPal Plan IDs to plan names
function getPlanFromPlanId(planId: string): 'FREE' | 'PRO' | 'PREMIUM' {
    if (planId === process.env.PAYPAL_PREMIUM_PLAN_ID) return 'PREMIUM';
    if (planId === process.env.PAYPAL_PREMIUM_YEARLY_PLAN_ID) return 'PREMIUM';
    if (planId === process.env.PAYPAL_PRO_PLAN_ID) return 'PRO';
    if (planId === process.env.PAYPAL_PRO_YEARLY_PLAN_ID) return 'PRO';
    return 'FREE';
}

/**
 * POST /api/paypal/webhook
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.text();

        // Verify webhook signature (skip in development for testing)
        if (process.env.NODE_ENV === 'production') {
            const isValid = await verifyWebhookSignature(request.headers, body);
            if (!isValid) {
                console.error('[PayPal Webhook] Invalid signature');
                return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
            }
        }

        const event = JSON.parse(body);
        console.log(`[PayPal Webhook] Event received: ${event.event_type}`);

        switch (event.event_type) {
            case 'BILLING.SUBSCRIPTION.ACTIVATED':
                await handleSubscriptionActivated(event.resource);
                break;

            case 'BILLING.SUBSCRIPTION.CANCELLED':
                await handleSubscriptionCancelled(event.resource);
                break;

            case 'BILLING.SUBSCRIPTION.EXPIRED':
                await handleSubscriptionExpired(event.resource);
                break;

            case 'BILLING.SUBSCRIPTION.RENEWED':
                await handleSubscriptionRenewed(event.resource);
                break;

            case 'PAYMENT.SALE.COMPLETED':
                // Payment successful - subscription will be activated
                console.log('[PayPal Webhook] Payment completed:', event.resource.id);
                break;

            default:
                console.log(`[PayPal Webhook] Unhandled event type: ${event.event_type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('[PayPal Webhook] Error:', error);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
    }
}

/**
 * Subscription activated - upgrade user's plan
 */
async function handleSubscriptionActivated(subscription: {
    id: string;
    plan_id: string;
    custom_id?: string;
    subscriber?: { email_address?: string };
    billing_info?: { next_billing_time?: string };
}) {
    console.log('[PayPal Webhook] Subscription activated:', subscription.id);

    const userId = subscription.custom_id;
    const subscriberEmail = subscription.subscriber?.email_address;
    const planId = subscription.plan_id;
    const plan = getPlanFromPlanId(planId);

    // Get period end from billing info
    const periodEnd = subscription.billing_info?.next_billing_time
        ? new Date(subscription.billing_info.next_billing_time)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days

    try {
        // Find user by ID or email
        const whereClause = userId
            ? { id: userId }
            : subscriberEmail
                ? { email: subscriberEmail }
                : null;

        if (!whereClause) {
            console.error('[PayPal Webhook] No user identifier found');
            return;
        }

        await prisma.user.update({
            where: whereClause,
            data: {
                plan,
                paypalSubscriptionId: subscription.id,
                paypalPlanId: planId,
                paypalCurrentPeriodEnd: periodEnd,
                paymentProvider: 'paypal',
                // Reset credits for new subscription
                analysisCount: 0,
                chatCount: 0,
                lastAnalysisDate: null,
                lastChatDate: null,
            },
        });

        console.log(`[PayPal Webhook] User upgraded to ${plan}`);

        // Send welcome email
        if (subscriberEmail) {
            await sendWelcomeEmail(subscriberEmail, plan);
            await sendAdminPurchaseNotification(subscriberEmail, plan, 'PayPal');
        }
    } catch (error) {
        console.error('[PayPal Webhook] Error updating user:', error);
    }
}

/**
 * Subscription cancelled - downgrade to free
 */
async function handleSubscriptionCancelled(subscription: {
    id: string;
    plan_id: string;
    subscriber?: { email_address?: string };
    billing_info?: { next_billing_time?: string };
}) {
    console.log('[PayPal Webhook] Subscription cancelled:', subscription.id);

    const subscriberEmail = subscription.subscriber?.email_address;
    const planId = subscription.plan_id;
    const planName = getPlanFromPlanId(planId);
    const endDate = subscription.billing_info?.next_billing_time
        ? new Date(subscription.billing_info.next_billing_time)
        : new Date();

    try {
        await prisma.user.updateMany({
            where: { paypalSubscriptionId: subscription.id },
            data: {
                plan: 'FREE',
                paypalSubscriptionId: null,
            },
        });

        if (subscriberEmail) {
            await sendCancellationEmail(subscriberEmail, planName, endDate);
        }

        console.log('[PayPal Webhook] User downgraded to FREE');
    } catch (error) {
        console.error('[PayPal Webhook] Error handling cancellation:', error);
    }
}

/**
 * Subscription expired
 */
async function handleSubscriptionExpired(subscription: { id: string }) {
    console.log('[PayPal Webhook] Subscription expired:', subscription.id);

    try {
        await prisma.user.updateMany({
            where: { paypalSubscriptionId: subscription.id },
            data: {
                plan: 'FREE',
                paypalSubscriptionId: null,
            },
        });

        console.log('[PayPal Webhook] User downgraded to FREE (expired)');
    } catch (error) {
        console.error('[PayPal Webhook] Error handling expiration:', error);
    }
}

/**
 * Subscription renewed - reset credits
 */
async function handleSubscriptionRenewed(subscription: {
    id: string;
    billing_info?: { next_billing_time?: string };
}) {
    console.log('[PayPal Webhook] Subscription renewed:', subscription.id);

    const periodEnd = subscription.billing_info?.next_billing_time
        ? new Date(subscription.billing_info.next_billing_time)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    try {
        await prisma.user.updateMany({
            where: { paypalSubscriptionId: subscription.id },
            data: {
                paypalCurrentPeriodEnd: periodEnd,
                // Reset credits for new billing period
                analysisCount: 0,
                chatCount: 0,
                lastAnalysisDate: null,
                lastChatDate: null,
            },
        });

        console.log('[PayPal Webhook] User credits reset for new period');
    } catch (error) {
        console.error('[PayPal Webhook] Error handling renewal:', error);
    }
}
