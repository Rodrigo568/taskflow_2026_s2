import { randomUUID } from 'crypto';
import { APIRequestContext, expect } from '@playwright/test';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Session {
  token: string;
  user: { id: string; email: string };
}

export interface Project {
  id: string;
  name: string;
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
}

export interface NewTask {
  title: string;
  priority?: TaskPriority;
  assigneeId?: string;
  dueDate?: string;
}

export function uniqueEmail(prefix = 'e2e'): string {
  return `${prefix}-${randomUUID()}@test.com`;
}

/**
 * Prepara datos por la API en lugar de la UI: los tests solo recorren en el
 * navegador lo que quieren verificar.
 */
export class TaskflowApi {
  constructor(private readonly request: APIRequestContext) {}

  async register(email = uniqueEmail(), password = 'Password1'): Promise<Session> {
    const res = await this.request.post('auth/register', { data: { email, password } });
    expect(res.status(), await res.text()).toBe(201);
    return res.json();
  }

  async createProject(session: Session, name = `Proyecto ${randomUUID().slice(0, 8)}`): Promise<Project> {
    const res = await this.request.post('projects', {
      headers: this.auth(session),
      data: { name },
    });
    expect(res.status(), await res.text()).toBe(201);
    return res.json();
  }

  async createTask(session: Session, projectId: string, task: NewTask): Promise<Task> {
    const res = await this.request.post(`projects/${projectId}/tasks`, {
      headers: this.auth(session),
      data: task,
    });
    expect(res.status(), await res.text()).toBe(201);
    return res.json();
  }

  async setStatus(session: Session, taskId: string, status: TaskStatus): Promise<Task> {
    const res = await this.request.patch(`tasks/${taskId}`, {
      headers: this.auth(session),
      data: { status },
    });
    expect(res.status(), await res.text()).toBe(200);
    return res.json();
  }

  async addComment(session: Session, taskId: string, body: string): Promise<void> {
    const res = await this.request.post(`tasks/${taskId}/comments`, {
      headers: this.auth(session),
      data: { body },
    });
    expect(res.status(), await res.text()).toBe(201);
  }

  private auth(session: Session) {
    return { Authorization: `Bearer ${session.token}` };
  }
}
