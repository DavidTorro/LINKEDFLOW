import { Link } from "react-router";
import { Button } from "../shared/ui";

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
      <p className="text-[64px] font-extrabold leading-none tracking-[-0.03em] text-accent">
        404
      </p>
      <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-text">
        Página no encontrada
      </h1>
      <p className="max-w-sm text-[15px] font-medium text-text-2">
        La página que buscas no existe o se ha movido.
      </p>
      <Link to="/">
        <Button>Volver al inicio</Button>
      </Link>
    </div>
  );
}
