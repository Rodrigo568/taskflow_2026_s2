import { Locator, Page, Response } from '@playwright/test';
import { TagChip } from '../components/TagChip';

/**
 * Page Object del detalle de tarea. Conoce el formulario de edición (título,
 * asignado, vencimiento), las etiquetas y el mensaje de error, y delega cada
 * etiqueta en el Component Object TagChip.
 *
 * Las acciones que llaman a la API devuelven la `Response`, así el test espera
 * la respuesta del servidor antes de mirar la pantalla.
 */
export class TaskDetailPage {
  readonly root: Locator;
  readonly titleInput: Locator;
  readonly assigneeSelect: Locator;
  readonly dueDateInput: Locator;
  readonly dueDateValue: Locator;
  readonly saveButton: Locator;
  readonly backLink: Locator;
  readonly tagInput: Locator;
  readonly tagAddButton: Locator;
  readonly tagChips: Locator;
  readonly error: Locator;

  constructor(private readonly page: Page) {
    this.root = page.getByTestId('task-detail-page');
    this.titleInput = page.getByTestId('task-title-input');
    this.assigneeSelect = page.getByTestId('task-assignee-select');
    this.dueDateInput = page.getByTestId('task-duedate-input');
    this.dueDateValue = page.getByTestId('task-duedate-value');
    this.saveButton = page.getByTestId('task-save-button');
    this.backLink = page.getByTestId('task-detail-back-link');
    this.tagInput = page.getByTestId('tag-add-input');
    this.tagAddButton = page.getByTestId('tag-add-button');
    this.tagChips = page.getByTestId('tag-chip');
    this.error = page.getByTestId('error-message');
  }

  async goto(projectId: string, taskId: string): Promise<void> {
    await this.page.goto(`/projects/${projectId}/tasks/${taskId}`);
    await this.waitUntilLoaded();
  }

  async reload(): Promise<void> {
    await this.page.reload();
    await this.waitUntilLoaded();
  }

  /**
   * En desarrollo React (StrictMode) pide la tarea dos veces; si el test escribe
   * antes de que llegue la segunda respuesta, el formulario se resincroniza y
   * pisa lo escrito. Se espera a que no queden pedidos pendientes.
   */
  private async waitUntilLoaded(): Promise<void> {
    await this.root.waitFor();
    await this.page.waitForLoadState('networkidle');
  }

  /** Guarda el formulario y devuelve la respuesta del PATCH /tasks/:id. */
  async save(): Promise<Response> {
    const response = this.page.waitForResponse(
      (r) => r.request().method() === 'PATCH' && /\/api\/tasks\/[^/]+$/.test(r.url()),
    );
    await this.saveButton.click();
    return response;
  }

  async setTitle(title: string): Promise<void> {
    await this.titleInput.fill(title);
  }

  /** `null` elige "Sin asignar". */
  async selectAssignee(userId: string | null): Promise<void> {
    await this.assigneeSelect.selectOption(userId ?? '');
  }

  /** `null` vacía el campo de fecha. */
  async setDueDate(day: string | null): Promise<void> {
    await this.dueDateInput.fill(day ?? '');
  }

  /** Agrega una etiqueta y devuelve la respuesta del POST /tasks/:id/tags. */
  async addTag(name: string): Promise<Response> {
    await this.tagInput.fill(name);
    const response = this.page.waitForResponse(
      (r) => r.request().method() === 'POST' && /\/api\/tasks\/[^/]+\/tags$/.test(r.url()),
    );
    await this.tagAddButton.click();
    return response;
  }

  /** Etiqueta identificada por su nombre exacto. */
  tag(name: string): TagChip {
    const byName = this.page.getByTestId('tag-chip-name').getByText(name, { exact: true });
    return new TagChip(this.page, this.tagChips.filter({ has: byName }));
  }

  async backToBoard(): Promise<void> {
    await this.backLink.click();
  }
}
