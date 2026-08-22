import { SessionProvider } from "./features/session/SessionProvider.tsx";
import AppRoutes from "./app/AppRoutes.tsx";

function App() {
  return (
    <SessionProvider>
      <AppRoutes />
    </SessionProvider>
  );
}

export default App;
