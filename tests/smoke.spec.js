import { test, expect } from '@playwright/test';

test('builds a dialogue from a draggable command and a saved character', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Соберите диалог' })).toBeVisible();
  await page.locator('[data-palette="say"]').dragTo(page.locator('.timeline-cell').first());
  const phrase = page.locator('.timeline-cell').first().locator('.phrase-input');
  await expect(phrase).toHaveValue('Привет!');
  await phrase.fill('Это длинная реплика, которая должна переноситься на несколько строк, чтобы весь текст оставался виден в блоке.');
  await expect(phrase).toHaveValue(/несколько строк/);
  await expect.poll(() => phrase.evaluate((element) => Number.parseInt(element.style.height, 10))).toBeGreaterThan(25);
  await page.locator('.say-duration-input').fill('3.5');
  await expect(page.locator('.say-duration-input')).toHaveValue('3.5');
  await page.locator('[data-palette="wait"]').dragTo(page.locator('.timeline-cell').nth(1));
  await page.locator('[data-resize-wait]').click();
  await expect(page.locator('.command-card.wait')).toHaveAttribute('data-span', '2');
  await expect(page.locator('.seconds-input')).toHaveValue('3');
  await expect(page.locator('.seconds-input')).toHaveCSS('width', '64px');
  await expect(page.locator('.wait-stretch > span')).toHaveCount(0);
  await expect.poll(async () => (await page.locator('.command-card.wait').boundingBox()).height).toBeGreaterThan(100);
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

  await page.locator('[data-edit-type]').last().dblclick();
  await page.locator('.actor-type-input').fill('Робот');
  await page.locator('.actor-type-input').press('Enter');
  await expect(page.locator('[data-edit-type]').last()).toHaveText('Робот');

  await page.locator('[data-edit-name]').last().dblclick();
  await page.locator('.actor-name-input').fill('Рекс');
  await page.locator('.actor-name-input').press('Enter');
  await expect(page.locator('[data-edit-name]').last()).toHaveText('Рекс');
});
