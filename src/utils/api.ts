export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8003/api/admin";

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  
  const headers: HeadersInit = {
    ...options.headers,
  };

  // If body is not FormData and Content-Type is not already set, set to application/json
  if (
    options.body && 
    !(options.body instanceof FormData) && 
    !Object.keys(headers).some(k => k.toLowerCase() === 'content-type')
  ) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Automatically attempt to parse JSON response if ok, or throw error
  if (!response.ok) {
    let errorMsg = response.statusText;
    try {
      const errorData = await response.json();
      errorMsg = errorData.message || errorData.detail || JSON.stringify(errorData);
    } catch (e) {
      // Ignored
    }
    throw new ApiError(errorMsg, response.status);
  }

  return response.json();
}
