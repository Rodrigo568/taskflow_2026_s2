import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../fixtures';

const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

test('audita login y registro', async ({ page }, testInfo) => {
  await page.goto('/login');
  for (const view of ['Login', 'Registro']) {
    if (view === 'Registro') await page.getByTestId('login-mode-toggle').click();
    const result = await new AxeBuilder({ page }).withTags(tags).analyze();
    console.log(`${view}: ${JSON.stringify(result.violations.map(v => ({ id: v.id, impact: v.impact, tags: v.tags, nodes: v.nodes.map(n => n.target) })))}`);
    await testInfo.attach(`axe-${view}.json`, { body: JSON.stringify(result.violations, null, 2), contentType: 'application/json' });
  }
});

test('audita proyectos y tablero', async ({ page, api, session }, testInfo) => {
  const project = await api.createProject(session);
  const task = await api.createTask(session, project.id, { title: 'Tarea de auditoría' });
  for (const [view, path] of [['Proyectos', '/projects'], ['Tablero', `/projects/${project.id}`], ['Detalle', `/projects/${project.id}/tasks/${task.id}`]]) {
    await page.goto(path);
    await expect(page.getByTestId(view === 'Proyectos' ? 'project-card' : view === 'Tablero' ? 'task-card' : 'task-detail-page').first()).toBeVisible();
    const result = await new AxeBuilder({ page }).withTags(tags).analyze();
    console.log(`${view}: ${JSON.stringify(result.violations.map(v => ({ id: v.id, impact: v.impact, tags: v.tags, nodes: v.nodes.map(n => n.target) })))}`);
    await testInfo.attach(`axe-${view}.json`, { body: JSON.stringify(result.violations, null, 2), contentType: 'application/json' });
    if (view === 'Detalle') expect(result.violations.map(v => v.id)).not.toContain('label');
  }
});
