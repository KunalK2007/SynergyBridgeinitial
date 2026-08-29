import { test, expect, Page } from '@playwright/test';

const ACCOUNTS = {
  student: { email: 'student.demo@synergybridge.local', pass: 'SBStudent@2026!' },
  mentor: { email: 'mentor.demo@synergybridge.local', pass: 'SBMentor@2026!' },
  faculty: { email: 'faculty.demo@synergybridge.local', pass: 'SBFaculty@2026!' },
  sponsor: { email: 'reviewer.demo@synergybridge.local', pass: 'SBReviewer@2026!' },
  admin: { email: 'admin.demo@synergybridge.local', pass: 'SBAdmin@2026!' },
};

async function login(page: Page, account: { email: string, pass: string }) {
  await page.goto('/login');
  await page.fill('input[type="email"]', account.email);
  await page.fill('input[type="password"]', account.pass);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
}

test.describe('Role Based Journeys', () => {
  test('Student Journey & 404 Investigation', async ({ page }) => {
    await login(page, ACCOUNTS.student);
    await expect(page).toHaveURL(/.*dashboard.*/);
    
    // Check Projects
    await page.goto('/dashboard/projects');
    await expect(page.locator('body')).not.toContainText('404');
    
    // Check specific project
    await page.goto('/dashboard/projects/demo_proj_1');
    await expect(page.locator('body')).not.toContainText('404', { ignoreCase: true });
    await expect(page.locator('body')).not.toContainText('not found', { ignoreCase: true });
    
    // Check problems
    await page.goto('/dashboard/problems');
    await expect(page.locator('body')).not.toContainText('404');
  });

  test('Mentor Journey', async ({ page }) => {
    await login(page, ACCOUNTS.mentor);
    await expect(page).toHaveURL(/.*dashboard.*/);
    await page.goto('/dashboard/projects');
    await expect(page.locator('body')).not.toContainText('404');
  });

  test('Faculty Journey', async ({ page }) => {
    await login(page, ACCOUNTS.faculty);
    await expect(page).toHaveURL(/.*dashboard.*/);
  });

  test('Sponsor Journey', async ({ page }) => {
    await login(page, ACCOUNTS.sponsor);
    await expect(page).toHaveURL(/.*dashboard.*/);
  });

  test('Admin Journey', async ({ page }) => {
    await login(page, ACCOUNTS.admin);
    await expect(page).toHaveURL(/.*dashboard.*/);
  });
});
