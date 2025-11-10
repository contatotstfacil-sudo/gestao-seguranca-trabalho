import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Empresas from "./pages/Empresas";
import Colaboradores from "./pages/Colaboradores";
import Obras from "./pages/Obras";
import Cargos from "./pages/Cargos";
import Setores from "./pages/Setores";
import TiposTreinamentos from "./pages/TiposTreinamentos";
import TreinamentosPainel from "./pages/TreinamentosPainel";
import Epis from "./pages/Epis";
import DashboardColaboradores from "./pages/DashboardColaboradores";
import EmissaoCertificados from "./pages/EmissaoCertificados";
import Certificados from "./pages/Certificados";
import OrdemServico from "./pages/OrdemServico";
import Configuracoes from "./pages/Configuracoes";
import Login from "./pages/Login";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/login"} component={Login} />
      <Route path={"/"} component={Dashboard} />
      <Route path={"/empresas"} component={Empresas} />
      <Route path={"/colaboradores"} component={Colaboradores} />
      <Route path={"/obras"} component={Obras} />
      <Route path={"/cargos"} component={Cargos} />
      <Route path={"/setores"} component={Setores} />
      <Route path={"/treinamentos/tipos"} component={TreinamentosPainel} />
      <Route path={"/treinamentos/modelos-certificados"} component={TreinamentosPainel} />
      <Route path={"/treinamentos/emitir-certificado"} component={TreinamentosPainel} />
      <Route path={"/treinamentos/lista"} component={TreinamentosPainel} />
      <Route path={"/treinamentos"} component={TreinamentosPainel} />
      <Route path={"/tipos-treinamentos"} component={TiposTreinamentos} />
      <Route path={"/epis/lista"} component={Epis} />
      <Route path={"/epis/tipos-epis"} component={Epis} />
      <Route path={"/epis/emitir-ficha"} component={Epis} />
      <Route path={"/epis"} component={Epis} />
      <Route path={"/certificados/modelos"} component={Certificados} />
      <Route path={"/certificados"} component={Certificados} />
      <Route path={"/emissao-certificados"} component={EmissaoCertificados} />
      <Route path={"/ordem-servico/modelos"} component={OrdemServico} />
      <Route path={"/ordem-servico/emitir"} component={OrdemServico} />
      <Route path={"/ordem-servico/lista"} component={OrdemServico} />
      <Route path={"/ordem-servico"} component={OrdemServico} />
      <Route path={"/dashboard-colaboradores"} component={DashboardColaboradores} />
      <Route path={"/configuracoes/modelos-certificados"} component={Configuracoes} />
      <Route path={"/configuracoes/riscos-ocupacionais"} component={Configuracoes} />
      <Route path={"/configuracoes/responsaveis"} component={Configuracoes} />
      <Route path={"/configuracoes/usuarios"} component={Configuracoes} />
      <Route path={"/configuracoes/permissoes"} component={Configuracoes} />
      <Route path={"/configuracoes"} component={Configuracoes} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
