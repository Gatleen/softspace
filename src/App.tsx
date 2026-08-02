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
        body: { value: "'Quicksand', system-ui, sans-serif" },
        heading: { value: "'Jersey 25', cursive" },
        mono: { value: "'Quicksand', system-ui, sans-serif" },
      },
      colors: {
        softspace: {
          bg: { value: "#F7F1EA" },
          pink: {
            50: { value: "#FFFBF5" },
            100: { value: "#FFF6FA" },
            200: { value: "#FFF0F6" },
            300: { value: "#FFDDEB" },
            400: { value: "#FFC2DA" },
            500: { value: "#F9A8CB" },
            600: { value: "#F27DAB" },
            700: { value: "#C0577E" },
          },
          lavender: {
            100: { value: "#F6F0FF" },
            200: { value: "#EEDCFB" },
            400: { value: "#CDB4F6" },
            600: { value: "#8A6BD1" },
            700: { value: "#7A5AA6" },
          },
          blue: {
            100: { value: "#F1F8FE" },
            200: { value: "#D8E9FB" },
            400: { value: "#BDE0FE" },
            600: { value: "#5B8FD6" },
          },
          text: {
            100: { value: "#4A3B52" },
            200: { value: "#5C4A63" },
            300: { value: "#8A7690" },
            400: { value: "#A08B9B" },
            500: { value: "#B79ACB" },
            600: { value: "#C2AECF" },
          },
        },
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
