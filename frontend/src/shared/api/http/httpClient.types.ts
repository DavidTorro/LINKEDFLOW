export type HttpMethod = 'GET' | 'POST';

export interface HttpErrorResponse {
  status: number;
  statusText: string;
  url: string;
  body: unknown;
}

export interface HttpClientOptions extends Omit<RequestInit, 'body' | 'method'> {
  body?: unknown;
}
