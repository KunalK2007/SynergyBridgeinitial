import { test, expect } from '@playwright/test';

// Simple smoke tests to verify the project routes don't return 404s.
// Since Firebase Auth requires real tokens, we either mock the auth context
// in the test environment or ensure the routes gracefully handle unauthenticated
// state (e.g. redirecting to login instead of crashing or returning 404).

test.describe('Routing Smoke Tests', () => {
  test('Project list page should exist', async ({ page }) => {
    const response = await page.goto('http://localhost:3000/dashboard/projects');
    
    // Even if redirected to login, the route itself must exist (no 404)
    expect(response?.status()).not.toBe(404);
  });

  test('Project details page for valid ID should exist', async ({ page }) => {
    // demo_proj_1 is created by the demo seed script
    const response = await page.goto('http://localhost:3000/dashboard/projects/demo_proj_1');
    
    expect(response?.status()).not.toBe(404);
  });

  test('Invalid project ID should not crash', async ({ page }) => {
    const response = await page.goto('http://localhost:3000/dashboard/projects/invalid-id-xyz');
    
    // Expecting either 404 or redirect, but definitely not a 500 error
    expect(response?.status()).not.toBe(500);
  });
});
