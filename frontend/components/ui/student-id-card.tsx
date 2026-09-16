"use client";

import { MagizhIdCard, type MagizhIdCardProps } from "@/components/student/MagizhIdCard";
import { formatMagizhStudentId } from "@/lib/student-id";

export function formatStudentId(userId?: string | null): string {
  return formatMagizhStudentId(null, userId);
}

export type { MagizhIdCardProps as StudentIdCardProps };
export const StudentIdCard = MagizhIdCard;
