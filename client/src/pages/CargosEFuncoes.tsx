import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, AlertTriangle, BarChart3, ChevronRight, Settings } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import Cargos from "./Cargos";
import RiscosOcupacionais from "./RiscosOcupacionais";
import RelatorioCargos from "./RelatorioCargos";
import React from "react";

type CargosEFuncoesSection = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  component?: React.ComponentType<{ showLayout?: boolean }>;
};

const cargosEFuncoesSections: CargosEFuncoesSection[] = [
  {
    id: "cargos",
    label: "Cargos",
    icon: Briefcase,
    path: "/cargos-e-funcoes/cargos",
    component: Cargos,
  },
  {
    id: "riscos-ocupacionais",
    label: "Riscos Ocupacionais",
    icon: AlertTriangle,
    path: "/cargos-e-funcoes/riscos-ocupacionais",
    component: RiscosOcupacionais,
  },
  {
    id: "relatorio",
    label: "Relatório de Cargos",
    icon: BarChart3,
    path: "/cargos-e-funcoes/relatorio",
    component: RelatorioCargos,
  },
];

export default function CargosEFuncoes() {
  const [location, setLocation] = useLocation();
  
  // Determinar qual seção está ativa baseado na rota
  const activeSection = cargosEFuncoesSections.find(section => {
    const isExactMatch = location === section.path;
    const isStartsWith = location.startsWith(section.path + "/");
    return isExactMatch || isStartsWith;
  }) || null;
  
  // Se não há seção ativa, mostrar o menu principal
  const showMenu = !activeSection || location === "/cargos-e-funcoes";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cargos e Funções</h1>
          <p className="text-gray-600 mt-1">Gerencie cargos, funções e riscos ocupacionais</p>
        </div>

        {showMenu ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cargosEFuncoesSections.map((section) => {
              const Icon = section.icon;
              return (
                <Card
                  key={section.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setLocation(section.path)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{section.label}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Clique para acessar</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Menu Lateral */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="text-lg">Menu</CardTitle>
                </CardHeader>
                <CardContent>
                  <nav className="space-y-2">
                    <button
                      onClick={() => setLocation("/cargos-e-funcoes")}
                      className={cn(
                        "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                        location === "/cargos-e-funcoes"
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Settings className="h-4 w-4" />
                        <span className="font-medium">Menu Principal</span>
                      </div>
                      <ChevronRight className={cn(
                        "h-4 w-4 transition-transform",
                        location === "/cargos-e-funcoes" && "rotate-90"
                      )} />
                    </button>
                    
                    {cargosEFuncoesSections.map((section) => {
                      const Icon = section.icon;
                      const isActive = location === section.path;
                      return (
                        <button
                          key={section.id}
                          onClick={() => setLocation(section.path)}
                          className={cn(
                            "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-accent text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="h-4 w-4" />
                            <span className="font-medium">{section.label}</span>
                          </div>
                          <ChevronRight className={cn(
                            "h-4 w-4 transition-transform",
                            isActive && "rotate-90"
                          )} />
                        </button>
                      );
                    })}
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Conteúdo Principal */}
            <div className="lg:col-span-3">
              <div className="space-y-6">
                {activeSection?.component && (
                  <activeSection.component showLayout={false} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

