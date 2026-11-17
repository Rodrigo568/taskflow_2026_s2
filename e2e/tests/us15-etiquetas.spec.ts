import { expect, test } from '../fixtures';

/**
 * US-15 · Etiquetar tareas, desde la sección "Etiquetas" del detalle.
 *
 * c2 y c3 fallan por defectos reales del producto. Se marcan con test.fail()
 * (misma convención que board.spec.ts, ver ADR-002): el assert sigue siendo el
 * de la spec, la suite queda en verde mientras el bug exista y Playwright avisa
 * ("expected to fail, but passed") cuando se corrija. Issues #10 y #11.
 */
test.describe('US-15 · Etiquetar tareas', () => {
  test('US-15 c1 · agrega una etiqueta, la muestra y la quita', async ({
    api,
    session,
    taskDetailPage,
  }) => {
    const project = await api.createProject(session);
    const task = await api.createTask(session, project.id, { title: 'Corregir login' });
    await taskDetailPage.goto(project.id, task.id);

    const added = await taskDetailPage.addTag('backend');

    expect(added.status()).toBe(201);
    expect((await added.json()).name).toBe('backend');
    await expect(taskDetailPage.tagChips).toHaveCount(1);
    await expect(taskDetailPage.tag('backend').root).toBeVisible();

    const removed = await taskDetailPage.tag('backend').remove();

    expect(removed.status()).toBe(204);
    await expect(taskDetailPage.tagChips).toHaveCount(0);
    await taskDetailPage.reload();
    await expect(taskDetailPage.tagChips).toHaveCount(0);
  });

  test('US-15 c2 · "Bug" y "BUG" son la misma etiqueta: no se duplica', async ({
    api,
    session,
    taskDetailPage,
  }) => {
    // Bug: addTag guarda el nombre tal cual (solo trim) y busca el tag por nombre
    // exacto, así que "Bug" y "BUG" crean dos etiquetas distintas.
    test.fail(true, 'US-15 CA-1/CA-2: las etiquetas no se normalizan a minúsculas (issue #10)');

    const project = await api.createProject(session);
    const task = await api.createTask(session, project.id, { title: 'Error en el tablero' });
    await taskDetailPage.goto(project.id, task.id);

    expect((await taskDetailPage.addTag('Bug')).ok()).toBe(true);
    await expect(taskDetailPage.tagChips).toHaveCount(1);
    expect((await taskDetailPage.addTag('BUG')).ok()).toBe(true);

    // Gherkin: "sigue teniendo exactamente 1 etiqueta y esa etiqueta se llama 'bug'"
    await taskDetailPage.reload();
    await expect(taskDetailPage.tagChips).toHaveCount(1);
    await expect(taskDetailPage.tagChips.getByTestId('tag-chip-name')).toHaveText('bug');
  });

  test('US-15 c3 · agregar la misma etiqueta dos veces devuelve 200 y no la duplica', async ({
    api,
    session,
    taskDetailPage,
  }) => {
    // Bug: no hay control de duplicados en task_tags; el segundo POST responde
    // 201 y la tarea queda con la etiqueta repetida.
    test.fail(true, 'US-15 CA-3: la misma etiqueta se agrega dos veces (issue #11)');

    const project = await api.createProject(session);
    const task = await api.createTask(session, project.id, { title: 'Etiqueta repetida' });
    await taskDetailPage.goto(project.id, task.id);

    expect((await taskDetailPage.addTag('bug')).status()).toBe(201);
    await expect(taskDetailPage.tagChips).toHaveCount(1);
    const again = await taskDetailPage.addTag('bug');

    expect(again.status()).toBe(200);
    await taskDetailPage.reload();
    await expect(taskDetailPage.tagChips).toHaveCount(1);
  });
});
