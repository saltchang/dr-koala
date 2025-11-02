import { StatusCodes } from 'http-status-codes';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '@/constants/api';
import { COOKIE_KEY_ACCESS_TOKEN } from '@/constants/cookie';
import { ApiResponseError } from '@/types/api';

const getFetchUrl = (path: string, searchParams?: Record<string, string | string[]>) => {
  const pathWithoutSlash = path.startsWith('/') ? path.substring(1) : path;
  const baseUrlWithSlash = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;

  const url = new URL(pathWithoutSlash, baseUrlWithSlash);
  const params = new URLSearchParams();

  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => {
          params.append(key, v);
        });
      } else {
        params.append(key, value);
      }
    });
  }

  url.search = params.toString();

  return url.toString();
};

const handleFetch = async <TResponseData>(url: string, options: RequestInit): Promise<TResponseData> => {
  const resp = await fetch(url, options);

  const contentType = resp.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  const data = isJson ? await resp.json() : await resp.text();

  if (!resp.ok) {
    return Promise.reject(new ApiResponseError(resp.status, data));
  }

  if (resp.status === StatusCodes.NO_CONTENT) {
    return Promise.resolve() as unknown as Promise<TResponseData>;
  }

  return data as Promise<TResponseData>;
};

type QueryFunction = <TResponseData>({
  path,
  searchParams,
  headers,
}: {
  path: string;
  searchParams?: Record<string, string | string[]>;
  headers?: Record<string, string>;
}) => Promise<TResponseData>;

export const queryFunction: QueryFunction = async <TResponseData>({
  path,
  searchParams,
  headers,
}: {
  path: string;
  searchParams?: Record<string, string | string[]>;
  headers?: Record<string, string>;
}): Promise<TResponseData> => {
  const accessToken = Cookies.get(COOKIE_KEY_ACCESS_TOKEN);
  const url = getFetchUrl(path, searchParams);

  const options: RequestInit = {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
  };

  return handleFetch<TResponseData>(url, options);
};

export const mutationFunction = async <TRequest = Record<string, unknown> | FormData | Blob, TResponseData = void>({
  path,
  searchParams,
  method = 'POST',
  request,
  headers,
}: {
  path: string;
  searchParams?: Record<string, string | string[]>;
  method?: RequestInit['method'];
  request?: TRequest;
  headers?: Record<string, string>;
}): Promise<TResponseData> => {
  const accessToken = Cookies.get(COOKIE_KEY_ACCESS_TOKEN);
  const url = getFetchUrl(path, searchParams);

  const requestNotJson = request instanceof Blob || request instanceof FormData;
  const requestBody = requestNotJson ? request : JSON.stringify(request);

  const options: RequestInit = {
    method,
    headers: {
      Accept: 'application/json',
      ...(requestNotJson ? {} : { 'Content-Type': 'application/json' }),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: requestBody,
  };

  return handleFetch<TResponseData>(url, options);
};

type StreamChunk<T = unknown> = T & {
  done?: boolean;
  error?: string;
};

interface StreamOptions<TRequest = Record<string, unknown>, TChunk = unknown> {
  path: string;
  request?: TRequest;
  onChunk?: (chunk: StreamChunk<TChunk>) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

export const streamFunction = async <TRequest = Record<string, unknown>, TChunk = unknown>({
  path,
  request,
  onChunk,
  onError,
  onComplete,
  signal,
  headers,
}: StreamOptions<TRequest, TChunk>): Promise<void> => {
  const accessToken = Cookies.get(COOKIE_KEY_ACCESS_TOKEN);
  const url = getFetchUrl(path);

  const options: RequestInit = {
    method: 'POST',
    headers: {
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: request ? JSON.stringify(request) : undefined,
    signal,
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6)) as StreamChunk<TChunk>;

          onChunk?.(data);

          if (data.error) {
            onError?.(new Error(data.error));
            return;
          }

          if (data.done) {
            onComplete?.();
            return;
          }
        }
      }
    }

    onComplete?.();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return;
    }
    onError?.(error instanceof Error ? error : new Error('Unknown error'));
  }
};
