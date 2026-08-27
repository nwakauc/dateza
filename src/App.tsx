import { SessionProvider } from "./features/session/SessionProvider.tsx";
import { ToastProvider } from "./features/toasts/ToastProvider.tsx";
import { ToastViewport } from "./features/toasts/ToastViewport.tsx";
import AppRoutes from "./app/AppRoutes.tsx";

function App() {
  return (
    <SessionProvider>
      <ToastProvider>
        <AppRoutes />
        <ToastViewport />
      </ToastProvider>
    </SessionProvider>
  );
}

export default App;
