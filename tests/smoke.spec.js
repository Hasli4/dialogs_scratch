import { test, expect } from '@playwright/test';

test('builds a dialogue from a draggable command and a saved character', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Соберите диалог' })).toBeVisible();
  await page.locator('[data-palette="say"]').dragTo(page.locator('.timeline-cell').first());
  await expect(page.locator('.timeline-cell').first().locator('input')).toHaveValue('Привет!');

  await page.getByRole('button', { name: 'Добавить персонажа' }).click();
  await expect(page.getByRole('heading', { name: 'Кто будет говорить?' })).toBeVisible();
  await page.getByLabel('Собака').click();
  await page.locator('#new-actor-name').fill('Бобик');
  await page.getByRole('button', { name: 'Добавить персонажа' }).last().click();
  await expect(page.locator('.actor-name').last()).toHaveValue('Бобик');
});

