import { ComponentProps, ReactElement } from 'react';

declare const Button: ({ children, className, ...props }: ComponentProps<'button'>) => ReactElement;

export { Button };
