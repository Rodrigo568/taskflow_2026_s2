import { Locator, Page, Response } from '@playwright/test';
import { MemberItem } from '../components/MemberItem';

/**
 * Page Object de la pantalla Miembros de un proyecto. Conoce el formulario de
 * alta (solo para el owner), la nota de solo lectura y la lista, y delega cada
 * fila en el Component Object MemberItem.
 */
export class MembersPage {
  readonly root: Locator;
  readonly addForm: Locator;
  readonly emailInput: Locator;
  readonly addButton: Locator;
  readonly readonlyNote: Locator;
  readonly items: Locator;
  readonly error: Locator;

  constructor(private readonly page: Page) {
    this.root = page.getByTestId('members-page');
    this.addForm = page.getByTestId('member-add-form');
    this.emailInput = page.getByTestId('member-email-input');
    this.addButton = page.getByTestId('member-add-button');
    this.readonlyNote = page.getByTestId('members-readonly-note');
    this.items = page.getByTestId('member-item');
    this.error = page.getByTestId('error-message');
  }

  async goto(projectId: string): Promise<void> {
    await this.page.goto(`/projects/${projectId}/members`);
    await this.root.waitFor();
  }

  /** Agrega un miembro por email y devuelve la respuesta del POST /projects/:id/members. */
  async add(email: string): Promise<Response> {
    await this.emailInput.fill(email);
    const response = this.page.waitForResponse(
      (r) => r.request().method() === 'POST' && /\/api\/projects\/[^/]+\/members$/.test(r.url()),
    );
    await this.addButton.click();
    return response;
  }

  /** Fila identificada por el email exacto que muestra. */
  member(email: string): MemberItem {
    const byEmail = this.page.getByTestId('member-item-email').getByText(email, { exact: true });
    return new MemberItem(this.page, this.items.filter({ has: byEmail }));
  }
}
