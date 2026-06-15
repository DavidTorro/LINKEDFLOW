import { Outlet } from "react-router";
import { Topbar } from "./Topbar";

// Shell simple: barra superior + contenido centrado. Sin sidebar (una sola herramienta).
export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      <Topbar />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-[1100px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
