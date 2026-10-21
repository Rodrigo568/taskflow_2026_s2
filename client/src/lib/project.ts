import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from './api';
import type { Project } from '../types';

interface ProjectState {
  project: Project | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

/** GET /api/projects. Sin argumentos usa la API del proxy y el token guardado. */
export function getProjects(baseUrl?: string, token?: string): Promise<Project[]> {
  return api<Project[]>('/projects', { baseUrl, token });
}

export function useProject(projectId: string | undefined): ProjectState {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const projects = await getProjects();
      const found = projects.find((p) => p.id === projectId) ?? null;
      setProject(found);
      if (!found) setError('No se encontró el proyecto');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar el proyecto');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { project, loading, error, reload };
}
