import type { CSSProperties, ReactNode } from "react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div style={app}>
      <Sidebar />

      <div style={contentWrapper}>
        <Header />

        <main style={content}>
          {children}
        </main>
      </div>
    </div>
  );
}

const app: CSSProperties = {
  display: "flex",
  height: "100vh",
  background: "#f3f4f6",
};

const contentWrapper: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  flex: 1,
};

const content: CSSProperties = {
  flex: 1,
  overflow: "auto",
  padding: 24,
};