import { Locator, Page, Response } from '@playwright/test';

/**
 * Component Object de una etiqueta del detalle de tarea (`data-testid="tag-chip"`).
 * Se repite una vez por etiqueta; todo se busca dentro de `root`.
 */
export class TagChip {
  readonly name: Locator;
  readonly removeButton: Locator;

  constructor(
    private readonly page: Page,
    readonly root: Locator,
  ) {
    this.name = root.getByTestId('tag-chip-name');
    this.removeButton = root.getByTestId('tag-remove-button');
  }

  /** Quita la etiqueta y devuelve la respuesta del DELETE para poder verificar el status. */
  async remove(): Promise<Response> {
    const response = this.page.waitForResponse(
      (r) => r.request().method() === 'DELETE' && /\/api\/tasks\/[^/]+\/tags\//.test(r.url()),
    );
    await this.removeButton.click();
    return response;
  }
}
