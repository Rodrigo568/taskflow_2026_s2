import { expect, test } from '../fixtures';

/**
 * US-08 · Comentar en una tarea, desde la sección "Comentarios" del detalle.
 * Usa el Component Object CommentItem a través de TaskDetailPage.
 */
test.describe('US-08 · Comentarios', () => {
  test('US-08 c1 · publica un comentario y lo muestra con autor y fecha', async ({
    api,
    session,
    taskDetailPage,
  }) => {
    const project = await api.createProject(session);
    const task = await api.createTask(session, project.id, { title: 'Revisar diseño' });
    await taskDetailPage.goto(project.id, task.id);

    const response = await taskDetailPage.addComment('Revisado y aprobado');

    // CA-3: se registran autor y timestamp
    expect(response.status()).toBe(201);
    const created = await response.json();
    expect(created).toMatchObject({ authorId: session.user.id, body: 'Revisado y aprobado' });
    const comment = taskDetailPage.comment('Revisado y aprobado');
    await expect(comment.root).toBeVisible();
    await expect(comment.date).toHaveText(created.createdAt);
    // La UI muestra el email si conoce al miembro y, si no, su id.
    await expect(comment.author).toHaveText(
      new RegExp(`^(${session.user.email}|${session.user.id})$`),
    );
    await expect(taskDetailPage.commentInput).toHaveValue('');
  });

  test('US-08 c2 · rechaza un comentario en blanco y no lo agrega', async ({
    api,
    session,
    taskDetailPage,
  }) => {
    const project = await api.createProject(session);
    const task = await api.createTask(session, project.id, { title: 'Tarea sin comentarios' });
    await taskDetailPage.goto(project.id, task.id);

    const response = await taskDetailPage.addComment('   ');

    // CA-1 y CA-2: entre 1 y 1000 caracteres, validado en la API
    expect(response.status()).toBe(400);
    await expect(taskDetailPage.error).toBeVisible();
    await taskDetailPage.reload();
    await expect(taskDetailPage.commentItems).toHaveCount(0);
  });

  test('US-08 c3 · muestra los comentarios del más antiguo al más reciente', async ({
    api,
    session,
    taskDetailPage,
  }) => {
    // Bug: comments.repository.ts ordena por createdAt 'desc' y la UI muestra el
    // más reciente primero. Ver docs/issues/11-us08-comentarios-orden-inverso.md.
    test.fail(true, 'US-08 CA-4: los comentarios se devuelven del más reciente al más antiguo');

    const project = await api.createProject(session);
    const task = await api.createTask(session, project.id, { title: 'Hilo de comentarios' });
    await taskDetailPage.goto(project.id, task.id);

    for (const body of ['Primero', 'Segundo', 'Tercero']) {
      expect((await taskDetailPage.addComment(body)).status()).toBe(201);
      await expect(taskDetailPage.comment(body).root).toBeVisible();
    }

    // CA-4: orden cronológico ascendente, también después de recargar
    await taskDetailPage.reload();
    await expect(taskDetailPage.commentItems.getByTestId('comment-item-body')).toHaveText([
      'Primero',
      'Segundo',
      'Tercero',
    ]);
  });

  test('US-08 c4 · borra su comentario y no ofrece borrar el de otro miembro', async ({
    api,
    session,
    taskDetailPage,
  }) => {
    const project = await api.createProject(session);
    const bob = await api.register();
    await api.addMember(session, project.id, bob.user.email);
    const task = await api.createTask(session, project.id, { title: 'Tarea compartida' });
    await api.addComment(bob, task.id, 'Comentario de Bob');
    await taskDetailPage.goto(project.id, task.id);
    expect((await taskDetailPage.addComment('Comentario propio')).status()).toBe(201);

    // CA-6: solo se puede borrar el comentario propio
    await expect(taskDetailPage.comment('Comentario de Bob').deleteButton).toHaveCount(0);
    const deleted = await taskDetailPage.comment('Comentario propio').delete();

    expect(deleted.status()).toBe(204);
    await taskDetailPage.reload();
    await expect(taskDetailPage.commentItems).toHaveCount(1);
    await expect(taskDetailPage.comment('Comentario de Bob').root).toBeVisible();
  });
});
