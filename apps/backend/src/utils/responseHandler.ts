interface Details {
  message: string;
  [key: string]: any;
}

interface Context {
  json: (body: object, status: number) => any;
}

interface ResponseOptions {
  error?: Details;
  data?: any;
  message?: string;
  status?: number;
  isError?: boolean;
}

export function responseHandler(
  c: Context,
  { error, data, message, status = 500, isError = true }: ResponseOptions
): any {
  if (!isError) {
    return c.json({ success: true, data, message }, status);
  } else {
    return c.json({ success: false, error: error?.message, details: error }, status);
  }
}
