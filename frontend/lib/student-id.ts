/**
 * Magizh Student ID Utilities
 * Permanent ID format: MAGZ-YY-XXXXXX (e.g. MAGZ-26-004821)
 */

export function formatMagizhStudentId(
  rawId?: string | null,
  userId?: string | null,
): string {
  if (rawId && rawId.trim().toUpperCase().startsWith("MAGZ-")) {
    return rawId.trim().toUpperCase();
  }

  if (userId) {
    const clean = userId.replace(/-/g, "").toUpperCase();
    const num = parseInt(clean.slice(0, 6), 16) % 1000000;
    return `MAGZ-26-${num.toString().padStart(6, "0")}`;
  }

  return "MAGZ-26-000001";
}

export function formatDateOfBirth(dobString?: string | null): string {
  if (!dobString) return "NOT SPECIFIED";
  try {
    const date = new Date(dobString);
    if (isNaN(date.getTime())) return dobString.toUpperCase();
    return date
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .toUpperCase(); // e.g. "30 MAR 2006"
  } catch {
    return dobString.toUpperCase();
  }
}
