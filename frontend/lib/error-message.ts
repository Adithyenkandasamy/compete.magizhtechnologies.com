type ApiErrorShape = {
  response?: {
    data?: {
      detail?: string;
    };
  };
};

/** Extract the FastAPI `detail` field from an error, with a fallback message. */
export function getErrorMessage(error: unknown, fallback: string): string {
  const detail = (error as ApiErrorShape | undefined)?.response?.data?.detail;

  if (typeof detail === "string" && detail.length > 0) {
    return detail;
  }

  return fallback;
}