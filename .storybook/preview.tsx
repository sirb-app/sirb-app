import type { Preview } from "@storybook/nextjs-vite";
import { ThemeProvider } from "next-themes";
import "../src/app/globals.css";
import { ModeToggle } from "../src/components/mode-toggle";

const preview: Preview = {
  decorators: [
    Story => (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="bg-background text-foreground min-h-screen">
          <ModeToggle />
          <div className="p-4">
            <Story />
          </div>
        </div>
      </ThemeProvider>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },
  },
};

export default preview;
