import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
// Removido superjson completamente para evitar problemas de serialização
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      // SEM transformer - usando JSON puro para evitar problemas de serialização
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

// Aguardar DOM estar pronto
function initApp() {
  // Verificar se o elemento root existe
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    console.error("❌ Elemento 'root' não encontrado no DOM!");
    document.body.innerHTML = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h1>Erro: Elemento root não encontrado</h1>
        <p>O elemento com id "root" não foi encontrado no HTML.</p>
        <p>Verifique se o arquivo index.html contém: &lt;div id="root"&gt;&lt;/div&gt;</p>
      </div>
    `;
    return;
  }

  try {
    console.log("✅ Iniciando renderização do React...");
    const root = createRoot(rootElement);
    root.render(
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </trpc.Provider>
    );
    console.log("✅ React renderizado com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao renderizar React:", error);
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h1>Erro ao carregar a aplicação</h1>
        <p>Ocorreu um erro ao inicializar o React:</p>
        <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow: auto;">${error instanceof Error ? error.stack : String(error)}</pre>
        <button onclick="window.location.reload()" style="margin-top: 10px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Recarregar página
        </button>
      </div>
    `;
  }
}

// Aguardar DOM estar pronto
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  // DOM já está pronto
  initApp();
}
