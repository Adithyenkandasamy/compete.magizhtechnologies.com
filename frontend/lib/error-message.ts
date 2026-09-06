type PydanticErrorItem = {
  loc?: (string | number)[];
  msg?: string;
  type?: string;
};

type ApiErrorShape = {
  response?: {
    data?: {
      detail?: string | PydanticErrorItem[];
    };
  };
};

function extractString(detail: unknown): string | null {
  if (typeof detail === "string" && detail.length > 0) {
    return detail;
  }

  return null;
}

function extractValidationMessages(detail: unknown): string | null {
  if (!Array.isArray(detail)) {
    return null;
  }

  const messages = detail
    .filter(
      (item): item is PydanticErrorItem =>
        item !== null && typeof item === "object",
    )
    .map((item) => {
      const location = Array.isArray(item.loc)
        ? item.loc.join(".")
        : "value";

      if (typeof item.msg === "string") {
        return `${location}: ${item.msg}`;
      }

      return `${location}: invalid value`;
    })
    .filter((message) => message.length > 0);

  if (messages.length === 0) {
    return null;
  }

  return messages.join("; ");
}

/** Extract the FastAPI `detail` field from an error, with a fallback message. */
export function getErrorMessage(error: unknown, fallback: string): string {
  const detail = (error as ApiErrorShape | undefined)?.response?.data?.detail;

  return extractString(detail) ?? extractValidationMessages(detail) ?? fallback;
}
