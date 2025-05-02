import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

import "./index.css";
import Router from "./routes/Router.tsx";
import AuthProvider from "./contexts/auth/AuthProvider.tsx";
import Base from "./layouts/Base/Base.tsx";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Base>
          <Router />
        </Base>
      </BrowserRouter>
    </AuthProvider>
    <Analytics />
    <SpeedInsights />
  </StrictMode>,
);
