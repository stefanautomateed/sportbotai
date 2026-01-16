/**
 * Vitest Test Setup
 * 
 * Global setup for all tests - extends matchers and mocks.
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
        back: vi.fn(),
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
}));

// Mock next-auth
vi.mock('next-auth/react', () => ({
    useSession: () => ({
        data: null,
        status: 'unauthenticated',
    }),
    signIn: vi.fn(),
    signOut: vi.fn(),
}));

// Mock fetch for API calls
global.fetch = vi.fn();

// Reset all mocks between tests
beforeEach(() => {
    vi.clearAllMocks();
});
