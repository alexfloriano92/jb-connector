import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import JBHome from "@/components/JBHome";
import { carsQueryOptions } from "@/lib/cars";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(carsQueryOptions),
  component: Index,
  errorComponent: ({ error }) => (
    <div style={{ padding: 40, color: "#fff", background: "#080810", minHeight: "100vh" }}>
      Falha ao carregar o catálogo: {error.message}
    </div>
  ),
  notFoundComponent: () => <div style={{ padding: 40, color: "#fff" }}>Página não encontrada.</div>,
});

function Index() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#080810" }} />}>
      <JBHome />
    </Suspense>
  );
}
