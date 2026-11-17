import { Locator, Page, Response } from '@playwright/test';

/**
 * Component Object de una fila de la lista de miembros (`data-testid="member-item"`).
 * Se repite una vez por miembro; todo se busca dentro de `root`.
 */
export class MemberItem {
  readonly email: Locator;
  readonly role: Locator;
  /** Solo lo ve el owner, y nunca en su propia fila. */
  readonly removeButton: Locator;

  constructor(
    private readonly page: Page,
    readonly root: Locator,
  ) {
    this.email = root.getByTestId('member-item-email');
    this.role = root.getByTestId('member-item-role');
    this.removeButton = root.getByTestId('member-remove-button');
  }

  /** Quita al miembro y devuelve la respuesta del DELETE /projects/:id/members/:userId. */
  async remove(): Promise<Response> {
    const response = this.page.waitForResponse(
      (r) => r.request().method() === 'DELETE' && /\/api\/projects\/[^/]+\/members\//.test(r.url()),
    );
    await this.removeButton.click();
    return response;
  }
}
