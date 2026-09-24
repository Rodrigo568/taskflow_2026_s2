// Puertos propios de e2e, para no chocar con `npm run dev` (3000 / 5173).
export const API_PORT = 3100;
export const WEB_PORT = 5174;

export const API_URL = `http://localhost:${API_PORT}/api`;
export const WEB_URL = `http://localhost:${WEB_PORT}`;
