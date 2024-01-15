import { NextRequest, NextResponse } from 'next/server';

declare function locales(request: NextRequest): NextResponse<unknown> | undefined;
declare function withLocales(middleware: any): (...args: any[]) => any;

export { locales, withLocales };
