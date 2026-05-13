// SPA entry point for Vercel static deployment.
// Bypasses TanStack Start SSR — renders the app as a plain React SPA.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { IndexPage } from "./routes/index";
import "./styles.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <IndexPage />
    </QueryClientProvider>
  </StrictMode>
);
