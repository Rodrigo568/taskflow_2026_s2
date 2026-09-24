import { test as base } from '@playwright/test';
import { BoardPage } from './pages/BoardPage';
import { Session, TaskflowApi } from './support/api';
import { API_URL } from './support/env';

interface Fixtures {
  api: TaskflowApi;
  /** Usuario nuevo por test, con la sesión ya cargada en el navegador. */
  session: Session;
  boardPage: BoardPage;
}

export const test = base.extend<Fixtures>({
  api: async ({ playwright }, use) => {
    const request = await playwright.request.newContext({ baseURL: `${API_URL}/` });
    await use(new TaskflowApi(request));
    await request.dispose();
  },

  session: async ({ api, page }, use) => {
    const session = await api.register();
    // Misma forma en que la app guarda la sesión (client/src/lib/api.ts),
    // así se evita pasar por el formulario de login en cada test.
    await page.addInitScript(({ token, user }) => {
      localStorage.setItem('taskflow_token', token);
      localStorage.setItem('taskflow_user', JSON.stringify(user));
    }, session);
    await use(session);
  },

  boardPage: async ({ page }, use) => {
    await use(new BoardPage(page));
  },
});

export { expect } from '@playwright/test';
