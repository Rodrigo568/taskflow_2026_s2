import { Locator } from '@playwright/test';
import type { TaskStatus } from '../support/api';

/**
 * Component Object de la tarjeta de tarea (`data-testid="task-card"`).
 *
 * La tarjeta se repite en las tres columnas del tablero con la misma estructura
 * y las mismas acciones. Todos los locators se buscan dentro de `root`, así que
 * la misma clase sirve para cualquier tarjeta de cualquier columna.
 */
export class TaskCard {
  readonly title: Locator;
  readonly priority: Locator;
  readonly assignee: Locator;
  readonly dueDate: Locator;
  readonly commentCount: Locator;
  readonly statusSelect: Locator;

  constructor(readonly root: Locator) {
    this.title = root.getByTestId('task-card-title');
    this.priority = root.getByTestId('task-card-priority');
    this.assignee = root.getByTestId('task-card-assignee');
    this.dueDate = root.getByTestId('task-card-duedate');
    this.commentCount = root.getByTestId('task-card-comment-count');
    this.statusSelect = root.getByTestId('task-card-status-select');
  }

  async changeStatus(status: TaskStatus): Promise<void> {
    await this.statusSelect.selectOption(status);
  }

  async open(): Promise<void> {
    await this.title.click();
  }
}
