"use client";

import { useQuery } from "@tanstack/react-query";
import { getProjects } from "@/lib/projects-api";
import type { Project } from "@/types/project";

export function useProjects() {
  return useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: getProjects,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}