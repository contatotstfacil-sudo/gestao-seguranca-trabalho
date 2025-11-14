import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
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
import GestaoAsos from "./pages/GestaoAsos";
import LaudosOcupacionais from "./pages/LaudosOcupacionais";
import RelatorioCargos from "./pages/RelatorioCargos";
import CargosEFuncoes from "./pages/CargosEFuncoes";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/login">
        <Login />
      </Route>
      <Route path="/dashboard">
        <Dashboard />
      </Route>
      <Route path="/">
        <Home />
      </Route>
      <Route path="/empresas">
        <Empresas />
      </Route>
      <Route path="/colaboradores">
        <Colaboradores />
      </Route>
      <Route path="/obras">
        <Obras />
      </Route>
      <Route path="/cargos">
        <Cargos />
      </Route>
      <Route path="/cargos-e-funcoes/cargos">
        <CargosEFuncoes />
      </Route>
      <Route path="/cargos-e-funcoes/relatorio">
        <CargosEFuncoes />
      </Route>
      <Route path="/cargos-e-funcoes">
        <CargosEFuncoes />
      </Route>
      <Route path="/relatorio-cargos">
        <RelatorioCargos />
      </Route>
      <Route path="/setores">
        <Setores />
      </Route>
      <Route path="/treinamentos/tipos">
        <TreinamentosPainel />
      </Route>
      <Route path="/treinamentos/modelos-certificados">
        <TreinamentosPainel />
      </Route>
      <Route path="/treinamentos/emitir-certificado">
        <TreinamentosPainel />
      </Route>
      <Route path="/treinamentos/lista">
        <TreinamentosPainel />
      </Route>
      <Route path="/treinamentos">
        <TreinamentosPainel />
      </Route>
      <Route path="/tipos-treinamentos">
        <TiposTreinamentos />
      </Route>
      <Route path="/epis/lista">
        <Epis />
      </Route>
      <Route path="/epis/tipos-epis">
        <Epis />
      </Route>
      <Route path="/epis/emitir-ficha">
        <Epis />
      </Route>
      <Route path="/epis">
        <Epis />
      </Route>
      <Route path="/certificados/modelos">
        <Certificados />
      </Route>
      <Route path="/certificados">
        <Certificados />
      </Route>
      <Route path="/emissao-certificados">
        <EmissaoCertificados />
      </Route>
      <Route path="/ordem-servico/modelos">
        <OrdemServico />
      </Route>
      <Route path="/ordem-servico/emitir">
        <OrdemServico />
      </Route>
      <Route path="/ordem-servico/lista">
        <OrdemServico />
      </Route>
      <Route path="/ordem-servico">
        <OrdemServico />
      </Route>
      <Route path="/gestao-asos/lista">
        <GestaoAsos />
      </Route>
      <Route path="/gestao-asos/relatorios">
        <GestaoAsos />
      </Route>
      <Route path="/gestao-asos">
        <GestaoAsos />
      </Route>
      <Route path="/laudos-ocupacionais/pgro">
        <LaudosOcupacionais />
      </Route>
      <Route path="/laudos-ocupacionais/pgr">
        <LaudosOcupacionais />
      </Route>
      <Route path="/laudos-ocupacionais/ltcat">
        <LaudosOcupacionais />
      </Route>
      <Route path="/laudos-ocupacionais/insalubridade">
        <LaudosOcupacionais />
      </Route>
      <Route path="/laudos-ocupacionais/periculosidade">
        <LaudosOcupacionais />
      </Route>
      <Route path="/laudos-ocupacionais">
        <LaudosOcupacionais />
      </Route>
      <Route path="/dashboard-colaboradores">
        <DashboardColaboradores />
      </Route>
      <Route path="/configuracoes/modelos-certificados">
        <Configuracoes />
      </Route>
      <Route path="/configuracoes/responsaveis">
        <Configuracoes />
      </Route>
      <Route path="/configuracoes/usuarios">
        <Configuracoes />
      </Route>
      <Route path="/configuracoes/permissoes">
        <Configuracoes />
      </Route>
      <Route path="/configuracoes">
        <Configuracoes />
      </Route>
      <Route path="/404">
        <NotFound />
      </Route>
      <Route>
        <NotFound />
      </Route>
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
