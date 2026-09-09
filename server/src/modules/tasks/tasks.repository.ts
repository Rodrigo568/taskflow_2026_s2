import { Prisma } from '@prisma/client';
import { db } from '../../lib/db';

export interface TaskFilters {
  status?: string;
  priority?: string;
  assigneeId?: number;
  search?: string;
}

/** Arma el filtro de Prisma a partir de los parámetros de query. */
export function buildFilters(projectId: number, f: TaskFilters): Prisma.TaskWhereInput {
  const where: Prisma.TaskWhereInput = { projectId };

  if (f.status) {
    where.status = f.status;
  }
  if (f.priority) {
    where.priority = f.priority;
  }
  if (f.assigneeId !== undefined) {
    where.assigneeId = f.assigneeId;
  }
  if (f.search) {
    where.OR = [{ title: { contains: f.search } }, { description: { contains: f.search } }];
  }

  return where;
}

export interface Page {
  limit: number;
  offset: number;
}

export async function findTasks(projectId: number, f: TaskFilters, page: Page) {
  return db.task.findMany({
    where: buildFilters(projectId, f),
    include: { assignee: { select: { id: true, email: true } } },
    orderBy: { id: 'asc' },
    take: page.limit,
    skip: page.offset,
  });
}

/** Cantidad de comentarios por tarea, en una sola consulta. */
export async function countCommentsByTask(taskIds: number[]): Promise<Map<number, number>> {
  if (taskIds.length === 0) return new Map();

  const rows = await db.comment.groupBy({
    by: ['taskId'],
    where: { taskId: { in: taskIds } },
    _count: true,
  });

  return new Map(rows.map((r) => [r.taskId, r._count]));
}

export async function countTasks(projectId: number, f: TaskFilters): Promise<number> {
  return db.task.count({ where: buildFilters(projectId, f) });
}
