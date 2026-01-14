/**
 * API Route: /api/paypal/create-subscription
 * 
 * Creates PayPal subscription for Pro or Premium plans.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Force dynamic rendering (uses headers/session)
export const dynamic = 'force-dynamic';

// PayPal API base URLs
// Use PAYPAL_MODE=live to test with real PayPal in development
const PAYPAL_API_BASE = process.env.PAYPAL_MODE === 'live' || process.env.NODE_ENV === 'production'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

// Get PayPal Plan IDs
function getPlanIds(): Record<string, string> {
    return {
        pro: process.env.PAYPAL_PRO_PLAN_ID || '',
        'pro-yearly': process.env.PAYPAL_PRO_YEARLY_PLAN_ID || '',
        premium: process.env.PAYPAL_PREMIUM_PLAN_ID || '',
        'premium-yearly': process.env.PAYPAL_PREMIUM_YEARLY_PLAN_ID || '',
    };
}

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
        const error = await response.text();
        throw new Error(`PayPal auth failed: ${error}`);
    }

    const data = await response.json();
    return data.access_token;
}

function getBaseUrl(): string {
    if (process.env.NEXT_PUBLIC_BASE_URL) {
        return process.env.NEXT_PUBLIC_BASE_URL;
    }
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }
    return 'http://localhost:3000';
}

/**
 * POST /api/paypal/create-subscription
 */
export async function POST(request: NextRequest) {
    try {
        // Check PayPal configuration
        if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
            console.error('PayPal credentials not configured');
            return NextResponse.json(
                { error: 'PayPal is not configured. Contact support.' },
                { status: 500 }
            );
        }

        // Get authenticated user
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'You must be logged in to subscribe' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { priceId: planKey, planName } = body;

        // Get PayPal Plan IDs
        const PLAN_IDS = getPlanIds();
        const actualPlanId = PLAN_IDS[planKey?.toLowerCase()] || planKey;

        console.log(`[PayPal] Plan key: ${planKey}, Resolved plan ID: ${actualPlanId}`);

        if (!actualPlanId || !actualPlanId.startsWith('P-')) {
            console.error('Invalid PayPal plan ID:', planKey, '->', actualPlanId);
            return NextResponse.json(
                { error: `Invalid plan selected. Please contact support. (Plan: ${planKey})` },
                { status: 400 }
            );
        }

        console.log(`[PayPal] Creating subscription for ${session.user.email} - ${planName} (${actualPlanId})`);

        // Get access token
        const accessToken = await getPayPalAccessToken();

        // Create subscription
        const subscriptionResponse = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'PayPal-Request-Id': `${session.user.id}-${Date.now()}`,
            },
            body: JSON.stringify({
                plan_id: actualPlanId,
                subscriber: {
                    name: {
                        given_name: session.user.name?.split(' ')[0] || 'User',
                        surname: session.user.name?.split(' ').slice(1).join(' ') || '',
                    },
                    email_address: session.user.email,
                },
                application_context: {
                    brand_name: 'SportBot AI',
                    locale: 'en-US',
                    shipping_preference: 'NO_SHIPPING',
                    user_action: 'SUBSCRIBE_NOW',
                    payment_method: {
                        payer_selected: 'PAYPAL',
                        payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
                    },
                    return_url: `${getBaseUrl()}/pricing/success?plan=${encodeURIComponent(planName)}&provider=paypal`,
                    cancel_url: `${getBaseUrl()}/pricing/cancelled`,
                },
                custom_id: session.user.id,
            }),
        });

        if (!subscriptionResponse.ok) {
            const error = await subscriptionResponse.text();
            console.error('[PayPal] Subscription creation failed:', error);
            return NextResponse.json(
                { error: 'Failed to create PayPal subscription' },
                { status: 500 }
            );
        }

        const subscription = await subscriptionResponse.json();
        console.log('[PayPal] Subscription created:', subscription.id);

        // Find the approval URL
        const approvalLink = subscription.links?.find(
            (link: { rel: string; href: string }) => link.rel === 'approve'
        );

        if (!approvalLink?.href) {
            console.error('[PayPal] No approval URL found in response');
            return NextResponse.json(
                { error: 'Failed to get PayPal approval URL' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            url: approvalLink.href,
            subscriptionId: subscription.id,
        });
    } catch (error) {
        console.error('PayPal subscription error:', error);
        return NextResponse.json(
            { error: 'Error creating PayPal subscription' },
            { status: 500 }
        );
    }
}
