/**
 * Helper to perform secure, robust fetch requests on the client side.
 * Validates the response status and content-type, automatically parsing JSON 
 * and extracting error payloads where possible.
 */
export async function safeFetch<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const contentType = res.headers.get("content-type");
  const isJson = !!(contentType && contentType.includes("application/json"));

  if (!res.ok) {
    const errorData = isJson ? await res.json().catch(() => ({})) : {};
    throw new Error(errorData.error || `Request failed with status ${res.status}`);
  }

  if (!isJson) {
    throw new Error("The server returned an unexpected response format (HTML instead of JSON).");
  }

  return res.json() as Promise<T>;
}
