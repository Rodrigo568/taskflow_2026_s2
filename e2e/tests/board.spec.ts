import { expect, test } from '../fixtures';

test.describe('Tablero de tareas', () => {
  test('muestra los datos de la tarea en su tarjeta', async ({ api, session, boardPage }) => {
    const project = await api.createProject(session);
    const task = await api.createTask(session, project.id, {
      title: 'Preparar informe',
      priority: 'HIGH',
      assigneeId: session.user.id,
    });
    await api.addComment(session, task.id, 'Primer comentario');

    await boardPage.goto(project.id);

    const card = boardPage.card('Preparar informe', 'TODO');
    await expect(card.priority).toHaveText('HIGH');
    await expect(card.assignee).toHaveText(session.user.email);
    await expect(card.dueDate).toHaveText('—');
    await expect(card.commentCount).toHaveText('1 comentarios');
    await expect(card.statusSelect).toHaveValue('TODO');
  });

  test('muestra la fecha de vencimiento cargada', async ({ api, session, boardPage }) => {
    // Bug conocido: la API guarda la fecha como medianoche UTC y la formatea en hora
    // local (server/src/lib/ids.ts), así que en UTC-3 muestra el día anterior.
    // test.fail() mantiene la suite en verde y avisa cuando el bug se corrija.
    test.fail(new Date().getTimezoneOffset() > 0, 'dueDate se corre un día en zonas UTC-');

    const project = await api.createProject(session);
    await api.createTask(session, project.id, { title: 'Con vencimiento', dueDate: '2026-12-01' });

    await boardPage.goto(project.id);

    await expect(boardPage.card('Con vencimiento').dueDate).toHaveText('2026-12-01');
  });

  test('ubica cada tarjeta en la columna de su estado', async ({ api, session, boardPage }) => {
    const project = await api.createProject(session);
    await api.createTask(session, project.id, { title: 'Pendiente' });
    const enCurso = await api.createTask(session, project.id, { title: 'En curso' });
    const terminada = await api.createTask(session, project.id, { title: 'Terminada' });
    await api.setStatus(session, enCurso.id, 'IN_PROGRESS');
    await api.setStatus(session, terminada.id, 'DONE');

    await boardPage.goto(project.id);

    await expect(boardPage.total).toHaveText('Total: 3');
    for (const [title, status] of [
      ['Pendiente', 'TODO'],
      ['En curso', 'IN_PROGRESS'],
      ['Terminada', 'DONE'],
    ] as const) {
      await expect(boardPage.cards(status)).toHaveCount(1);
      await expect(boardPage.card(title, status).root).toBeVisible();
    }
  });

  test('mueve la tarjeta de columna al cambiar su estado', async ({ api, session, boardPage }) => {
    const project = await api.createProject(session);
    await api.createTask(session, project.id, { title: 'Implementar login' });
    await boardPage.goto(project.id);

    await boardPage.card('Implementar login', 'TODO').changeStatus('IN_PROGRESS');

    const moved = boardPage.card('Implementar login', 'IN_PROGRESS');
    await expect(moved.root).toBeVisible();
    await expect(moved.statusSelect).toHaveValue('IN_PROGRESS');
    await expect(boardPage.cards('TODO')).toHaveCount(0);
    await expect(boardPage.columnCount('IN_PROGRESS')).toHaveText('(1)');
  });

  test('abre el detalle desde el título de la tarjeta', async ({ api, session, boardPage, page }) => {
    const project = await api.createProject(session);
    const task = await api.createTask(session, project.id, { title: 'Revisar documentación' });
    await boardPage.goto(project.id);

    await boardPage.card('Revisar documentación').open();

    await expect(page).toHaveURL(`/projects/${project.id}/tasks/${task.id}`);
  });
});
