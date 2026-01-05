import { ReactNode } from "react";

export default function SessionLayout({ children }: { children: ReactNode }) {
  return <div className="fixed inset-0 overflow-auto bg-background">{children}</div>;
}
