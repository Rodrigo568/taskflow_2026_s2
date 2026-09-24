import { Locator, Page } from '@playwright/test';
import { TaskCard } from '../components/TaskCard';
import type { TaskStatus } from '../support/api';

/**
 * Page Object del tablero de un proyecto. Conoce la pantalla (columnas, total,
 * navegación) y delega el detalle de cada tarjeta en el Component Object TaskCard.
 */
export class BoardPage {
  readonly root: Locator;
  readonly projectName: Locator;
  readonly total: Locator;

  constructor(private readonly page: Page) {
    this.root = page.getByTestId('board-page');
    this.projectName = page.getByTestId('board-project-name');
    this.total = page.getByTestId('board-total');
  }

  async goto(projectId: string): Promise<void> {
    await this.page.goto(`/projects/${projectId}`);
    await this.root.waitFor();
  }

  column(status: TaskStatus): Locator {
    return this.page.getByTestId(`board-column-${status}`);
  }

  columnCount(status: TaskStatus): Locator {
    return this.page.getByTestId(`board-column-count-${status}`);
  }

  /** Todas las tarjetas del tablero o, si se indica, las de una columna. */
  cards(status?: TaskStatus): Locator {
    const scope = status ? this.column(status) : this.page;
    return scope.getByTestId('task-card');
  }

  /** Tarjeta identificada por su título exacto, opcionalmente dentro de una columna. */
  card(title: string, status?: TaskStatus): TaskCard {
    const byTitle = this.page.getByTestId('task-card-title').getByText(title, { exact: true });
    return new TaskCard(this.cards(status).filter({ has: byTitle }));
  }
}
