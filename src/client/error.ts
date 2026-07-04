export class DdysError extends Error {
  readonly status: number;
  readonly method: string;
  readonly path: string;
  readonly context: unknown;

  constructor(message: string, status = 0, method = '', path = '', context?: unknown) {
    super(message);
    this.name = 'DdysError';
    this.status = status;
    this.method = method;
    this.path = path;
    this.context = context;
  }
}
