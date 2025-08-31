"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import * as React from "react";

/**
 * Client-side wrapper that forwards props and children to NextThemesProvider.
 *
 * This component is a thin pass-through around `next-themes`'s provider and accepts the same props as `NextThemesProvider`.
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
