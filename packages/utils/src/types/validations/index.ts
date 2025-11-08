// Validation types and schemas
// TODO: Add validation schemas as needed

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export type ValidationSchema<T = any> = {
  [K in keyof T]: {
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: T[K]) => boolean | string;
  };
};
