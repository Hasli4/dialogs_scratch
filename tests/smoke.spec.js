import { test, expect } from '@playwright/test';

test('builds a dialogue from a draggable command and a saved character', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Соберите диалог' })).toBeVisible();
  await page.locator('[data-palette="say"]').dragTo(page.locator('.timeline-cell').first());
  await expect(page.locator('.timeline-cell').first().locator('input')).toHaveValue('Привет!');
  await page.locator('[data-palette="wait"]').dragTo(page.locator('.timeline-cell').nth(1));
  await page.getByRole('button', { name: /Просмотреть/ }).click();
  await expect(page.locator('.timeline-cell.is-active')).toHaveCount(2);
  await page.getByRole('button', { name: /Просмотреть/ }).click();

  await page.getByRole('button', { name: 'Добавить персонажа' }).click();
  await expect(page.getByRole('heading', { name: 'Кто будет говорить?' })).toBeVisible();
  await page.getByLabel('Собака').click();
  await page.locator('#new-actor-name').fill('Бобик');
  await page.getByRole('button', { name: 'Добавить персонажа' }).last().click();
  await expect(page.locator('[data-edit-name]').last()).toHaveText('Бобик');

  await page.locator('[data-edit-avatar]').last().dblclick();
  await expect(page.getByRole('heading', { name: 'Выберите новый образ' })).toBeVisible();
  await page.getByLabel('Мальчик').click();
  await page.getByRole('button', { name: 'Заменить образ' }).click();
  await expect(page.locator('.actor-type').last()).toHaveText('Мальчик');

  await page.locator('[data-edit-avatar]').last().dblclick();
  await page.locator('#custom-avatar-input').setInputFiles({
    name: 'my-character.svg',
    mimeType: 'image/svg+xml',
    buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><rect width="60" height="60" fill="#6d63e8"/><circle cx="30" cy="24" r="14" fill="#fff"/></svg>'),
  });
  await expect(page.locator('.custom-avatar-preview img')).toBeVisible();
  await page.getByRole('button', { name: 'Заменить образ' }).click();
  await expect(page.locator('[data-edit-avatar]').last().locator('img.custom-avatar-image')).toBeVisible();
  await expect(page.locator('.actor-type').last()).toHaveText('Своя картинка');

  await page.locator('[data-edit-name]').last().dblclick();
  await page.locator('.actor-name-input').fill('Рекс');
  await page.locator('.actor-name-input').press('Enter');
  await expect(page.locator('[data-edit-name]').last()).toHaveText('Рекс');
});

