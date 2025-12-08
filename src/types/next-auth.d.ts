import 'next-auth';
import { Plan } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      plan: Plan;
      analysisCount: number;
      subscriptionTier?: string;
    };
  }

  interface User {
    plan: Plan;
    analysisCount: number;
    lastAnalysisDate?: Date | null;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    stripePriceId?: string | null;
    stripeCurrentPeriodEnd?: Date | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    plan: Plan;
    analysisCount: number;
  }
}
