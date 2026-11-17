import { expect, test } from '../fixtures';

/**
 * US-16 · Fecha de vencimiento, desde el campo "Vencimiento" del detalle.
 *
 * Bug conocido: la API guarda el día como medianoche UTC y lo formatea en hora
 * local del servidor (server/src/lib/ids.ts), así que en zonas UTC- devuelve el
 * día anterior (CA-1, CA-2, CA-3). Los casos que dependen de eso usan
 * test.fail() con la misma condición que board.spec.ts: el assert es el de la
 * spec y Playwright avisa cuando el bug se corrija. Issue #6.
 *
 * El navegador se fija en UTC-3, como en el escenario Gherkin de CA-3.
 */
const serverInUtcMinus = new Date().getTimezoneOffset() > 0;

test.use({ timezoneId: 'America/Montevideo' });

test.describe('US-16 · Fecha de vencimiento', () => {
  test('US-16 c1 · pone el vencimiento y se muestra el mismo día en detalle y tablero', async ({
    api,
    session,
    taskDetailPage,
    boardPage,
  }) => {
    test.fail(serverInUtcMinus, 'US-16 CA-3: dueDate se corre un día en zonas UTC- (issue #6)');

    const project = await api.createProject(session);
    const task = await api.createTask(session, project.id, { title: 'Entregar informe' });
    await taskDetailPage.goto(project.id, task.id);
    await expect(taskDetailPage.dueDateValue).toHaveText('—');

    await taskDetailPage.setDueDate('2026-09-15');
    const response = await taskDetailPage.save();

    expect(response.status()).toBe(200);
    expect((await response.json()).dueDate).toBe('2026-09-15');
    await expect(taskDetailPage.dueDateValue).toHaveText('2026-09-15');
    await taskDetailPage.backToBoard();
    await expect(boardPage.card('Entregar informe').dueDate).toHaveText('2026-09-15');
  });

  test('US-16 c2 · quita el vencimiento dejando el campo vacío', async ({
    api,
    session,
    taskDetailPage,
    boardPage,
    page,
  }) => {
    const project = await api.createProject(session);
    const task = await api.createTask(session, project.id, {
      title: 'Tarea con plazo',
      dueDate: '2026-12-01',
    });
    await taskDetailPage.goto(project.id, task.id);
    await expect(taskDetailPage.dueDateValue).not.toHaveText('—');

    const request = page.waitForRequest((r) => r.method() === 'PATCH');
    await taskDetailPage.setDueDate(null);
    const response = await taskDetailPage.save();

    // CA-5: se quita enviando el campo en nulo
    expect((await request).postDataJSON().dueDate).toBeNull();
    expect(response.status()).toBe(200);
    expect((await response.json()).dueDate).toBeNull();
    await taskDetailPage.reload();
    await expect(taskDetailPage.dueDateValue).toHaveText('—');
    await expect(taskDetailPage.dueDateInput).toHaveValue('');
    await taskDetailPage.backToBoard();
    await expect(boardPage.card('Tarea con plazo').dueDate).toHaveText('—');
  });

  test('US-16 c3 · borde: muestra una fecha pasada tal como se cargó', async ({
    api,
    session,
    taskDetailPage,
  }) => {
    test.fail(serverInUtcMinus, 'US-16 CA-3/CA-7: dueDate se corre un día en zonas UTC- (issue #6)');

    // CA-7: se admite una fecha pasada. 1 de enero es el borde que, corrido un
    // día, cambia también de mes y de año (2019-12-31).
    const project = await api.createProject(session);
    const task = await api.createTask(session, project.id, {
      title: 'Tarea vencida',
      dueDate: '2020-01-01',
    });

    await taskDetailPage.goto(project.id, task.id);

    await expect(taskDetailPage.dueDateValue).toHaveText('2020-01-01');
    await expect(taskDetailPage.dueDateInput).toHaveValue('2020-01-01');
  });
});
