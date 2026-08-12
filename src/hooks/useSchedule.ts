"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  GenerateScheduleInput,
  GenerationResultDto,
  MoveEntryInput,
  ScheduleCellDto,
  ScheduleConflict,
  SoftRuleKey,
} from "@horarios/shared-types";
import { apiClient } from "@/lib/api-client";
import type { AuditLogEntry, SoftRule } from "@/types/entities";

export type ViewType = "general" | "course" | "teacher" | "subject" | "room";

function viewPath(viewType: ViewType, id?: string): string {
  if (viewType === "general") return "/schedule/views/general";
  return `/schedule/views/${viewType}/${id}`;
}

export function useScheduleView(viewType: ViewType, id?: string) {
  return useQuery<ScheduleCellDto[]>({
    queryKey: ["schedule-view", viewType, id ?? null],
    queryFn: () => apiClient.get<ScheduleCellDto[]>(viewPath(viewType, id)),
    enabled: viewType === "general" || Boolean(id),
    staleTime: 30_000,
  });
}

export function useConflicts() {
  return useQuery<ScheduleConflict[]>({
    queryKey: ["schedule-conflicts"],
    queryFn: () => apiClient.get<ScheduleConflict[]>("/schedule/conflicts"),
    staleTime: 30_000,
  });
}

function useInvalidateSchedule() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["schedule-view"] });
    void queryClient.invalidateQueries({ queryKey: ["schedule-conflicts"] });
  };
}

export function useGenerateSchedule() {
  const invalidate = useInvalidateSchedule();
  return useMutation({
    mutationFn: (input: GenerateScheduleInput) =>
      apiClient.post<GenerationResultDto>("/schedule/generate", input),
    onSuccess: invalidate,
  });
}

export function useMoveEntry() {
  const invalidate = useInvalidateSchedule();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MoveEntryInput }) =>
      apiClient.patch<ScheduleCellDto>(`/schedule/entries/${id}/move`, data),
    onSuccess: invalidate,
  });
}

export function useSwapEntries() {
  const invalidate = useInvalidateSchedule();
  return useMutation({
    mutationFn: (data: { entryAId: string; entryBId: string }) =>
      apiClient.post<void>("/schedule/entries/swap", data),
    onSuccess: invalidate,
  });
}

export function useChangeTeacher() {
  const invalidate = useInvalidateSchedule();
  return useMutation({
    mutationFn: ({ id, teacherId }: { id: string; teacherId: string }) =>
      apiClient.patch<ScheduleCellDto>(`/schedule/entries/${id}/teacher`, {
        teacherId,
      }),
    onSuccess: invalidate,
  });
}

export function useChangeRoom() {
  const invalidate = useInvalidateSchedule();
  return useMutation({
    mutationFn: ({ id, roomId }: { id: string; roomId: string }) =>
      apiClient.patch<ScheduleCellDto>(`/schedule/entries/${id}/room`, {
        roomId,
      }),
    onSuccess: invalidate,
  });
}

export function useSetLock() {
  const invalidate = useInvalidateSchedule();
  return useMutation({
    mutationFn: ({ id, locked }: { id: string; locked: boolean }) =>
      apiClient.patch<ScheduleCellDto>(`/schedule/entries/${id}/lock`, {
        locked,
      }),
    onSuccess: invalidate,
  });
}

export function useSoftRules() {
  return useQuery<SoftRule[]>({
    queryKey: ["soft-rules"],
    queryFn: () => apiClient.get<SoftRule[]>("/schedule/soft-rules"),
    staleTime: 60 * 60 * 1000,
  });
}

export function useUpdateSoftRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      key,
      weight,
      enabled,
    }: {
      key: SoftRuleKey;
      weight: number;
      enabled: boolean;
    }) =>
      apiClient.patch<SoftRule>(`/schedule/soft-rules/${key}`, {
        weight,
        enabled,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["soft-rules"] });
    },
  });
}

export function useAuditLog(limit = 100) {
  return useQuery<AuditLogEntry[]>({
    queryKey: ["audit-log", limit],
    queryFn: () =>
      apiClient.get<AuditLogEntry[]>(`/schedule/audit-log?limit=${limit}`),
    staleTime: 30_000,
  });
}
