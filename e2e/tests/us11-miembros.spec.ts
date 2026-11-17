import { expect, test } from '../fixtures';

/**
 * US-11 · Agregar y quitar miembros, desde la pantalla Miembros.
 * Usa el Page Object MembersPage y el Component Object MemberItem.
 */
test.describe('US-11 · Miembros', () => {
  test('US-11 c1 · el owner agrega un miembro por email', async ({ api, session, membersPage }) => {
    const project = await api.createProject(session);
    const bob = await api.register();
    await membersPage.goto(project.id);

    const response = await membersPage.add(bob.user.email);

    expect(response.status()).toBe(201);
    const bobRow = membersPage.member(bob.user.email);
    await expect(bobRow.role).toHaveText('MEMBER');
    await expect(bobRow.removeButton).toBeVisible();
    await expect(membersPage.emailInput).toHaveValue('');
    await expect(membersPage.items).toHaveCount(2); // owner + Bob
  });

  test('US-11 c2 · un email sin usuario devuelve 404 y no agrega a nadie', async ({
    api,
    session,
    membersPage,
  }) => {
    const project = await api.createProject(session);
    await membersPage.goto(project.id);

    const response = await membersPage.add('nadie-registrado@test.com');

    // CA-2: si no existe un usuario con ese email → 404
    expect(response.status()).toBe(404);
    await expect(membersPage.error).toBeVisible();
    await expect(membersPage.items).toHaveCount(1); // solo el owner
  });

  test('US-11 c3 · el owner quita a un miembro y desaparece de la lista', async ({
    api,
    session,
    membersPage,
  }) => {
    const project = await api.createProject(session);
    const bob = await api.register();
    await membersPage.goto(project.id);
    expect((await membersPage.add(bob.user.email)).status()).toBe(201);

    const response = await membersPage.member(bob.user.email).remove();

    expect(response.status()).toBe(204);
    await expect(membersPage.member(bob.user.email).root).toHaveCount(0);
    await membersPage.goto(project.id);
    await expect(membersPage.member(bob.user.email).root).toHaveCount(0);
  });

  test('US-11 c4 · un miembro que no es owner no puede administrar miembros', async ({
    api,
    session,
    membersPage,
  }) => {
    // La sesión del navegador es de un miembro; el proyecto es de otro usuario.
    const owner = await api.register();
    const project = await api.createProject(owner);
    await api.addMember(owner, project.id, session.user.email);

    await membersPage.goto(project.id);

    // CA-1: solo el owner agrega o quita miembros
    await expect(membersPage.readonlyNote).toBeVisible();
    await expect(membersPage.addForm).toHaveCount(0);
    await expect(membersPage.root.getByTestId('member-remove-button')).toHaveCount(0);
  });
});
