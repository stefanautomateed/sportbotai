/**
 * API Route: /api/paypal/cancel-subscription
 * 
 * Cancels a PayPal subscription for the authenticated user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

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
 * POST /api/paypal/cancel-subscription
 */
export async function POST(request: NextRequest) {
    try {
        // Get authenticated user
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'You must be logged in' },
                { status: 401 }
            );
        }

        // Get user's PayPal subscription ID
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { paypalSubscriptionId: true },
        });

        if (!user?.paypalSubscriptionId) {
            return NextResponse.json(
                { error: 'No active PayPal subscription found' },
                { status: 400 }
            );
        }

        console.log(`[PayPal] Cancelling subscription: ${user.paypalSubscriptionId}`);

        // Get access token
        const accessToken = await getPayPalAccessToken();

        // Cancel subscription
        const response = await fetch(
            `${PAYPAL_API_BASE}/v1/billing/subscriptions/${user.paypalSubscriptionId}/cancel`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    reason: 'Customer requested cancellation',
                }),
            }
        );

        if (!response.ok && response.status !== 204) {
            const error = await response.text();
            console.error('[PayPal] Cancellation failed:', error);
            return NextResponse.json(
                { error: 'Failed to cancel subscription' },
                { status: 500 }
            );
        }

        // Update user in database (webhook will also handle this)
        await prisma.user.update({
            where: { email: session.user.email },
            data: {
                plan: 'FREE',
                paypalSubscriptionId: null,
            },
        });

        console.log('[PayPal] Subscription cancelled successfully');
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('PayPal cancellation error:', error);
        return NextResponse.json(
            { error: 'Error cancelling subscription' },
            { status: 500 }
        );
    }
}
