import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '@/services/api';
import type { Link, Collection, DashboardData } from '@/types';

// ---------- Links ----------

export function useLinks(params: Record<string, any> = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
  ).toString();
  return useQuery({
    queryKey: ['links', params],
    queryFn: () => api.get<{ items: Link[]; pagination: any }>(`/links?${query}`),
  });
}

export function useLink(id?: string) {
  return useQuery({
    queryKey: ['link', id],
    queryFn: () => api.get<{ data: { link: Link; manualRelated: Link[] } }>(`/links/${id}`),
    enabled: !!id,
  });
}

export function useSaveLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ url, collections }: { url: string; collections?: string[] }) =>
      api.post('/links', { url, collections }),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['links'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['graph'] });
      qc.invalidateQueries({ queryKey: ['collections'] });
      if (res.alreadySaved) toast('Already saved to your BrainVault', { icon: '🧠' });
      else toast.success('Saved! AI is done analyzing it.');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to save link'),
  });
}

export function useUpdateLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Link> }) => api.patch(`/links/${id}`, data),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['links'] });
      qc.invalidateQueries({ queryKey: ['link', vars.id] });
    },
  });
}

function useLinkAction(action: string, method: 'patch' | 'delete' = 'patch') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      method === 'patch' ? api.patch(`/links/${id}/${action}`) : api.delete(`/links/${id}`),
    onSuccess: (_res, id) => {
      qc.invalidateQueries({ queryKey: ['links'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['link', id] });
    },
  });
}

export const useToggleFavorite = () => useLinkAction('favorite');
export const useTogglePin = () => useLinkAction('pin');
export const useToggleArchive = () => useLinkAction('archive');
export const useSoftDeleteLink = () => useLinkAction('', 'delete');

export function useTrash(params: Record<string, any> = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
  ).toString();
  return useQuery({
    queryKey: ['trash', params],
    queryFn: () => api.get<{ items: Link[]; pagination: any }>(`/links/trash?${query}`),
  });
}

export function useEmptyTrash() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete('/links/trash'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trash'] });
      toast.success('Trash emptied');
    },
  });
}

export function useRestoreLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/links/${id}/restore`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['links'] });
      qc.invalidateQueries({ queryKey: ['trash'] });
      toast.success('Restored from trash');
    },
  });
}

export function usePermanentlyDeleteLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/links/${id}/permanent`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['links'] });
      qc.invalidateQueries({ queryKey: ['trash'] });
      toast.success('Deleted permanently');
    },
  });
}

export function useSetReadLater() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/links/${id}/read-later`, data),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['links'] });
      qc.invalidateQueries({ queryKey: ['link', vars.id] });
      toast.success('Reading reminder set');
    },
  });
}

// ---------- Collections ----------

export function useCollections() {
  return useQuery({
    queryKey: ['collections'],
    queryFn: () => api.get<{ data: { collections: Collection[]; tree: Collection[] } }>('/collections'),
  });
}

export function useCreateCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; color?: string; parent?: string | null }) =>
      api.post('/collections', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['collections'] });
      toast.success('Collection created');
    },
    onError: (err: any) => toast.error(err.message),
  });
}

export function useDeleteCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/collections/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['collections'] });
      toast.success('Collection deleted');
    },
  });
}

// ---------- Dashboard ----------

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<{ data: DashboardData }>('/dashboard'),
  });
}

export function useAnalytics() {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: () => api.get('/dashboard/analytics'),
  });
}

// ---------- Graph ----------

export function useGraph(params: Record<string, any> = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
  ).toString();
  return useQuery({
    queryKey: ['graph', params],
    queryFn: () => api.get(`/graph?${query}`),
  });
}

// ---------- Search ----------

export function useSearch(q: string, mode: 'keyword' | 'nl' = 'keyword') {
  return useQuery({
    queryKey: ['search', q, mode],
    queryFn: () => api.get(`/search?q=${encodeURIComponent(q)}&mode=${mode}`),
    enabled: q.trim().length > 1,
  });
}

// ---------- Tags ----------

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: () => api.get('/tags'),
  });
}