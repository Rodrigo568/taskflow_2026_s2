import { expect, test } from '../fixtures';

/**
 * US-12 · Editar tarea, desde el detalle de tarea.
 * Lo que se puede probar más abajo (403 de un no miembro, 404, prioridad
 * inválida) ya está en los tests de API; acá va lo que solo se ve en la UI:
 * que el formulario manda el cambio, que persiste y que el error se muestra.
 */
test.describe('US-12 · Editar tarea', () => {
  test('US-12 c1 · edita el título desde el detalle y el cambio persiste', async ({
    api,
    session,
    taskDetailPage,
    boardPage,
  }) => {
    // Arrange
    const project = await api.createProject(session);
    const task = await api.createTask(session, project.id, { title: 'Implementar login' });
    await taskDetailPage.goto(project.id, task.id);

    // Act
    await taskDetailPage.setTitle('Implementar login con OAuth');
    const response = await taskDetailPage.save();

    // Assert: la API lo guardó, sobrevive a una recarga y el tablero lo muestra
    expect(response.status()).toBe(200);
    expect((await response.json()).title).toBe('Implementar login con OAuth');
    await taskDetailPage.reload();
    await expect(taskDetailPage.titleInput).toHaveValue('Implementar login con OAuth');
    await taskDetailPage.backToBoard();
    await expect(boardPage.card('Implementar login con OAuth', 'TODO').root).toBeVisible();
    await expect(boardPage.card('Implementar login').root).toHaveCount(0);
  });

  test('US-12 c2 · rechaza guardar con el título vacío y conserva el anterior', async ({
    api,
    session,
    taskDetailPage,
  }) => {
    const project = await api.createProject(session);
    const task = await api.createTask(session, project.id, { title: 'Revisar documentación' });
    await taskDetailPage.goto(project.id, task.id);

    await taskDetailPage.setTitle('');
    const response = await taskDetailPage.save();

    // CA-2: el título es obligatorio → 400 VALIDATION_ERROR y la UI avisa
    expect(response.status()).toBe(400);
    expect((await response.json()).error.code).toBe('VALIDATION_ERROR');
    await expect(taskDetailPage.error).toBeVisible();
    // La tarea no cambió en el servidor
    await taskDetailPage.reload();
    await expect(taskDetailPage.titleInput).toHaveValue('Revisar documentación');
    expect((await api.getTask(session, task.id)).title).toBe('Revisar documentación');
  });

  test('US-12 c3 · borde: rechaza un título de 2 caracteres y acepta uno de 3', async ({
    api,
    session,
    taskDetailPage,
  }) => {
    const project = await api.createProject(session);
    const task = await api.createTask(session, project.id, { title: 'Título original' });
    await taskDetailPage.goto(project.id, task.id);

    // CA-2: entre 3 y 200 caracteres. Justo debajo del mínimo…
    await taskDetailPage.setTitle('ab');
    const rejected = await taskDetailPage.save();
    expect(rejected.status()).toBe(400);
    await expect(taskDetailPage.error).toBeVisible();

    // …y justo en el mínimo
    await taskDetailPage.setTitle('abc');
    const accepted = await taskDetailPage.save();
    expect(accepted.status()).toBe(200);
    await expect(taskDetailPage.error).toHaveCount(0);
    await taskDetailPage.reload();
    await expect(taskDetailPage.titleInput).toHaveValue('abc');
  });
});
