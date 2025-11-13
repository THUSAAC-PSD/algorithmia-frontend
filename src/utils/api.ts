/**
 * Safely parse JSON response, handling empty responses
 * @param response - Fetch Response object
 * @returns Parsed JSON data or empty object if response is empty
 */
export async function safeJsonParse<T = Record<string, unknown>>(
  response: Response,
): Promise<T> {
  const text = await response.text();
  if (!text || text.trim() === '') {
    return {} as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    console.error('Failed to parse JSON:', text);
    throw new Error('Invalid JSON response from server');
  }
}

/**
 * Make an API request with automatic JSON parsing
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @returns Parsed response data
 */
export async function apiRequest<T = Record<string, unknown>>(
  url: string,
  options?: RequestInit,
): Promise<{ data: T; response: Response }> {
  const response = await fetch(url, options);
  const data = await safeJsonParse<T>(response);
  return { data, response };
}
