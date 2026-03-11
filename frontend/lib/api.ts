const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export async function apiRequest<T>(
  path: string,
  method: "GET" | "POST" | "PATCH" | "DELETE" = "GET",
  body?: any
): Promise<T> {
  const url = `${BACKEND_URL}${path}`;

  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Bilinmeyen bir hata oluştu" }));
    throw new Error(errorData.message || `API hatası: ${response.status}`);
  }

  // No content responses (204) or empty bodies
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
