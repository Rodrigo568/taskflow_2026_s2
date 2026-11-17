import { Locator, Page, Response } from '@playwright/test';

/**
 * Component Object de un comentario del detalle de tarea (`data-testid="comment-item"`).
 * Se repite una vez por comentario; todo se busca dentro de `root`.
 */
export class CommentItem {
  readonly body: Locator;
  readonly author: Locator;
  readonly date: Locator;
  /** Solo aparece en los comentarios del usuario con sesión. */
  readonly deleteButton: Locator;

  constructor(
    private readonly page: Page,
    readonly root: Locator,
  ) {
    this.body = root.getByTestId('comment-item-body');
    this.author = root.getByTestId('comment-item-author');
    this.date = root.getByTestId('comment-item-date');
    this.deleteButton = root.getByTestId('comment-delete-button');
  }

  /** Borra el comentario y devuelve la respuesta del DELETE /comments/:id. */
  async delete(): Promise<Response> {
    const response = this.page.waitForResponse(
      (r) => r.request().method() === 'DELETE' && /\/api\/comments\/[^/]+$/.test(r.url()),
    );
    await this.deleteButton.click();
    return response;
  }
}
