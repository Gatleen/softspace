import { useState, useEffect } from "react";
import { ChakraProvider, createSystem, defaultConfig } from "@chakra-ui/react";
import StartPage from "./pages/StartPage";
import SignInPage from "./pages/SignInPage";
import LoadingScreen from "./pages/LoadingScreen";
import Dashboard from "./pages/Dashboard";

const system = createSystem(defaultConfig, {
  theme: {
    tokens: {
      fonts: {
        body:    { value: "'Jersey 25', system-ui, sans-serif" },
        heading: { value: "'Jersey 25', system-ui, sans-serif" },
        mono:    { value: "'Jersey 25', system-ui, sans-serif" },
      },
    },
  },
});

type Phase = "start" | "auth" | "loading" | "app";

function App() {
  const [phase, setPhase] = useState<Phase>("start");

  // Register the service worker for background reminder notifications
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.warn("SW registration failed:", err));
    }
  }, []);

  return (
    <ChakraProvider value={system}>
      {phase === "start"   && <StartPage onEnter={() => setPhase("auth")} />}
      {phase === "auth"    && <SignInPage onSuccess={() => setPhase("loading")} onGuest={() => setPhase("loading")} />}
      {phase === "loading" && <LoadingScreen onComplete={() => setPhase("app")} />}
      {phase === "app"     && <Dashboard />}
    </ChakraProvider>
  );
}

export default App;
