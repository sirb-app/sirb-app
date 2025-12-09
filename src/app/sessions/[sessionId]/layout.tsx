import { ReactNode } from "react";

export default function SessionLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen overflow-hidden">
      {children}
    </div>
  );
}
