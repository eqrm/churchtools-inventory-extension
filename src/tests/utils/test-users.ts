/**
 * Test Users Configuration
 * 
 * Safe user IDs for testing that won't spam real users with emails/notifications.
 * These users should be configured in the test ChurchTools instance.
 */

/**
 * Safe test user IDs from Phase 2.5 requirements
 */
export const TEST_USER_IDS = [4618, 6465, 11672, 6462] as const;

/**
 * Get a random test user ID
 */
export function getRandomTestUserId(): number {
    const index = Math.floor(Math.random() * TEST_USER_IDS.length);
    const userId = TEST_USER_IDS[index];
    if (userId === undefined) {
        throw new Error('Failed to get random test user ID');
    }
    return userId;
}

/**
 * Get all test user IDs
 */
export function getAllTestUserIds(): readonly number[] {
    return TEST_USER_IDS;
}

/**
 * Check if a user ID is a test user
 */
export function isTestUser(userId: number): boolean {
    return (TEST_USER_IDS as readonly number[]).includes(userId);
}
