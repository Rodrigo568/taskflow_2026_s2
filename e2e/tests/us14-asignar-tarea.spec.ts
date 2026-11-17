import { expect, test } from '../fixtures';
import type { MembersPage } from '../pages/MembersPage';
import type { Session, TaskflowApi } from '../support/api';

/**
 * US-14 · Asignar tarea a un miembro, desde el selector "Asignado" del detalle.
 * El caso de asignar a un no miembro (CA-1, 400) no se puede provocar desde la
 * UI porque el selector solo lista miembros: está cubierto en los tests de API
 * y en seguridad-accesibilidad.spec.ts.
 *
 * El cliente no tiene un GET de miembros: el selector "Asignado" lista al owner,
 * a los responsables de alguna tarea y a los miembros agregados desde la
 * pantalla Miembros (client/src/lib/members.ts). Por eso el compañero se agrega
 * por la UI, como lo haría el owner.
 */
test.describe('US-14 · Asignar tarea', () => {
  /** Registra a un segundo usuario y el owner lo agrega desde la pantalla Miembros. */
  async function addTeammate(
    api: TaskflowApi,
    membersPage: MembersPage,
    projectId: string,
  ): Promise<Session> {
    const teammate = await api.register();
    await membersPage.goto(projectId);
    expect((await membersPage.add(teammate.user.email)).status()).toBe(201);
    await expect(membersPage.member(teammate.user.email).root).toBeVisible();
    return teammate;
  }

  test('US-14 c1 · asigna la tarea a un miembro y el tablero lo muestra', async ({
    api,
    session,
    taskDetailPage,
    boardPage,
    membersPage,
  }) => {
    const project = await api.createProject(session);
    const bob = await addTeammate(api, membersPage, project.id);
    const task = await api.createTask(session, project.id, { title: 'Diseñar pantalla' });
    await taskDetailPage.goto(project.id, task.id);

    await taskDetailPage.selectAssignee(bob.user.id);
    const response = await taskDetailPage.save();

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.assigneeId).toBe(bob.user.id);
    // CA-5: la asignación no modifica el estado
    expect(body.status).toBe('TODO');
    await taskDetailPage.reload();
    await expect(taskDetailPage.assigneeSelect).toHaveValue(bob.user.id);
    await taskDetailPage.backToBoard();
    await expect(boardPage.card('Diseñar pantalla', 'TODO').assignee).toHaveText(bob.user.email);
  });

  test('US-14 c2 · reasigna una tarea ya asignada a otro miembro', async ({
    api,
    session,
    taskDetailPage,
    boardPage,
    membersPage,
  }) => {
    const project = await api.createProject(session);
    const bob = await addTeammate(api, membersPage, project.id);
    const task = await api.createTask(session, project.id, {
      title: 'Escribir tests',
      assigneeId: session.user.id,
    });
    await taskDetailPage.goto(project.id, task.id);
    await expect(taskDetailPage.assigneeSelect).toHaveValue(session.user.id);

    await taskDetailPage.selectAssignee(bob.user.id);
    const response = await taskDetailPage.save();

    // CA-2: una tarea asignada puede reasignarse
    expect(response.status()).toBe(200);
    expect((await response.json()).assigneeId).toBe(bob.user.id);
    expect((await api.getTask(session, task.id)).assigneeId).toBe(bob.user.id);
    await taskDetailPage.backToBoard();
    await expect(boardPage.card('Escribir tests').assignee).toHaveText(bob.user.email);
  });

  test('US-14 c3 · desasigna la tarea eligiendo "Sin asignar"', async ({
    api,
    session,
    taskDetailPage,
    boardPage,
    page,
    membersPage,
  }) => {
    const project = await api.createProject(session);
    const bob = await addTeammate(api, membersPage, project.id);
    const task = await api.createTask(session, project.id, {
      title: 'Revisar PR',
      assigneeId: bob.user.id,
    });
    await taskDetailPage.goto(project.id, task.id);
    await expect(taskDetailPage.assigneeSelect).toHaveValue(bob.user.id);

    const request = page.waitForRequest((r) => r.method() === 'PATCH');
    await taskDetailPage.selectAssignee(null);
    const response = await taskDetailPage.save();

    // CA-3: se desasigna enviando el asignado en nulo
    expect((await request).postDataJSON().assigneeId).toBeNull();
    expect(response.status()).toBe(200);
    expect((await response.json()).assigneeId).toBeNull();
    await taskDetailPage.reload();
    await expect(taskDetailPage.assigneeSelect).toHaveValue('');
    await taskDetailPage.backToBoard();
    await expect(boardPage.card('Revisar PR').assignee).toHaveText('Sin asignar');
  });
});
