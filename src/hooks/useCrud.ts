"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface WithId {
  id: string;
}

export function useCrudResource<
  TEntity extends WithId,
  TCreate = Partial<TEntity>,
  TUpdate = Partial<TEntity>,
>(resource: string, staleTime = 5 * 60 * 1000) {
  const queryClient = useQueryClient();
  const queryKey = [resource];

  const list = useQuery<TEntity[]>({
    queryKey,
    queryFn: () => apiClient.get<TEntity[]>(`/${resource}`),
    staleTime,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const create = useMutation({
    mutationFn: (data: TCreate) =>
      apiClient.post<TEntity>(`/${resource}`, data),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TUpdate }) =>
      apiClient.patch<TEntity>(`/${resource}/${id}`, data),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(`/${resource}/${id}`),
    onSuccess: invalidate,
  });

  return { list, create, update, remove };
}
