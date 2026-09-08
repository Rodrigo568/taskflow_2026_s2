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

export async function findTasks(projectId: number, f: TaskFilters) {
  return db.task.findMany({
    where: buildFilters(projectId, f),
    orderBy: { id: 'asc' },
  });
}

export async function countTasks(projectId: number, f: TaskFilters): Promise<number> {
  return db.task.count({ where: buildFilters(projectId, f) });
}
