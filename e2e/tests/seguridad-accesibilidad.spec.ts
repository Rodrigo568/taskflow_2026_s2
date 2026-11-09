import { randomUUID } from 'crypto';
import { test, expect } from '../fixtures';
import { API_URL } from '../support/env';

test('el título con HTML se muestra como texto en tablero y detalle', async ({ page, api, session }) => {
  const project = await api.createProject(session);
  const payload = '<img src=x onerror=alert(1)>';
  const dialogs: string[] = [];
  page.on('dialog', async dialog => { dialogs.push(dialog.message()); await dialog.dismiss(); });
  await page.goto(`/projects/${project.id}`);
  await page.getByTestId('task-create-title-input').fill(payload);
  await page.getByTestId('task-create-submit').click();
  const title = page.getByTestId('task-card-title').filter({ hasText: payload });
  await expect(title).toBeVisible();
  await expect(title.locator('img')).toHaveCount(0);
  await title.click();
  await expect(page.getByTestId('task-title-input')).toHaveValue(payload);
  await expect(page.locator('img[src="x"]')).toHaveCount(0);
  expect(dialogs).toEqual([]);
});

test('un proyecto se puede abrir con Tab y Enter', async ({ page, api, session }) => {
  const project = await api.createProject(session, 'Proyecto teclado');
  await page.goto('/projects');
  const link = page.getByTestId('project-card-name').filter({ hasText: 'Proyecto teclado' });
  await expect(link).toBeVisible();
  let focused = false;
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Tab');
    if (await link.evaluate(el => el === document.activeElement)) { focused = true; break; }
  }
  expect(focused).toBe(true);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(`/projects/${project.id}`);
});

test('idioma y anuncio de errores de login', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await page.getByTestId('login-email-input').fill('noexiste@test.com');
  await page.getByTestId('login-password-input').fill('incorrecta');
  await page.getByTestId('login-submit').click();
  await expect(page.getByRole('alert')).toHaveText('Invalid credentials');
});

test('compara bloqueo de cuenta existente e inexistente', async ({ request }) => {
  const email = `bloqueo-${randomUUID()}@test.com`;
  const registered = await request.post(`${API_URL}/auth/register`, { data: { email, password: 'Password1' } });
  expect(registered.status()).toBe(201);
  for (let i = 1; i <= 8; i++) {
    for (const [address, expected] of [[email, i > 5 ? 'Account temporarily locked. Try again later.' : 'Invalid credentials'], [`ausente-${email}`, 'Invalid credentials']]) {
      const res = await request.post(`${API_URL}/auth/login`, { data: { email: address, password: 'incorrecta' } });
      expect(res.status()).toBe(401);
      expect((await res.json()).error.message).toBe(expected);
    }
  }
  const valid = await request.post(`${API_URL}/auth/login`, { data: { email, password: 'Password1' } });
  expect((await valid.json()).error.message).toBe('Account temporarily locked. Try again later.');
});

test('rechaza asignar una tarea a alguien que no integra el proyecto', async ({ request, api, session }) => {
  const outsider = await api.register();
  const project = await api.createProject(session);
  const res = await request.post(`${API_URL}/projects/${project.id}/tasks`, {
    headers: { Authorization: `Bearer ${session.token}` },
    data: { title: 'Asignación externa', assigneeId: outsider.user.id },
  });
  expect(res.status()).toBe(400);
  expect((await res.json()).error.message).toBe('The assignee must be a member of the project');
});

test('revisa el nombre accesible del botón para quitar una etiqueta', async ({ page, api, session }) => {
  const project = await api.createProject(session);
  const task = await api.createTask(session, project.id, { title: 'Revisión de etiqueta' });
  await page.goto(`/projects/${project.id}/tasks/${task.id}`);
  await page.getByTestId('tag-add-input').fill('urgente');
  await page.getByTestId('tag-add-button').click();
  await expect(page.getByTestId('tag-remove-button')).toHaveAccessibleName('×');
});
