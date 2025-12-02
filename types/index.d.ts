export interface RequestOptions {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: Record<string, unknown>;
  target?: string | Element;
  headers?: Record<string, string>;
}

export interface Context {
  id: string;
  request: RequestOptions;
  response: Response | null;
  body: unknown;
  success: boolean;
}

export interface ALISAPI {
  version: string;
  init(config?: Record<string, unknown>): { config: Record<string, unknown> };
  process(root: Element | Document | undefined): number;
  trigger(element: Element): Promise<Context>;
  request(options: RequestOptions): Promise<Context>;
  from(element: Element): { execute(overrides?: Partial<RequestOptions>): Promise<Context> };
  abort(id: string): void;
  abortAll(): void;
}

export const ALIS: ALISAPI;
export default ALIS;

