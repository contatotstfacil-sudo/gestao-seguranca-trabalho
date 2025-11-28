import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, BarChart3, ChevronRight, Settings, FolderTree } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import Cargos from "./Cargos";
import RelatorioCargos from "./RelatorioCargos";
import Setores from "./Setores";
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
    id: "setores",
    label: "Setores",
    icon: FolderTree,
    path: "/cargos-e-funcoes/setores",
    component: Setores,
  },
  {
    id: "relatorio",
    label: "Relatório de Cargos",
    icon: BarChart3,
    path: "/cargos-e-funcoes/relatorio",
    component: RelatorioCargos,
  },
];

export default function CargosEFuncoes({ showLayout = true }: { showLayout?: boolean }) {
  const [location, setLocation] = useLocation();
  
  // Redirecionar rota antiga /setores para /cargos-e-funcoes/setores
  React.useEffect(() => {
    if (location === "/setores") {
      setLocation("/cargos-e-funcoes/setores");
    }
  }, [location, setLocation]);
  
  // Determinar qual seção está ativa baseado na rota
  // Ajustar para funcionar tanto com /cargos-e-funcoes quanto com /empresas/cargos-e-setores
  const activeSection = cargosEFuncoesSections.find(section => {
    const isExactMatch = location === section.path || location === `/empresas/cargos-e-setores${section.path.replace('/cargos-e-funcoes', '')}`;
    const isStartsWith = location.startsWith(section.path + "/") || location.startsWith(`/empresas/cargos-e-setores${section.path.replace('/cargos-e-funcoes', '')}/`);
    return isExactMatch || isStartsWith;
  }) || null;
  
  // Se não há seção ativa, mostrar o menu principal
  const showMenu = !activeSection || location === "/cargos-e-funcoes" || location === "/empresas/cargos-e-setores";

  const content = (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cargos e Setores</h1>
          <p className="text-gray-600 mt-1">Gerencie cargos, setores e relatórios</p>
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
          <div className="flex gap-2">
            {/* Menu Lateral */}
            <div className="w-[280px] flex-shrink-0">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="text-lg">Menu</CardTitle>
                </CardHeader>
                <CardContent>
                  <nav className="space-y-2">
                    <button
                      onClick={() => setLocation("/cargos-e-funcoes")}
                      className={cn(
                        "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-left transition-colors",
                        location === "/cargos-e-funcoes"
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Settings className="h-5 w-5" />
                        <span className="font-medium">Menu Principal</span>
                      </div>
                      <ChevronRight className={cn(
                        "h-4 w-4 transition-transform",
                        location === "/cargos-e-funcoes" && "rotate-90"
                      )} />
                    </button>
                    
                    {cargosEFuncoesSections.map((section) => {
                      const Icon = section.icon;
                      // Ajustar path baseado na localização atual
                      const currentPath = location.startsWith("/empresas/cargos-e-setores") 
                        ? section.path.replace("/cargos-e-funcoes", "/empresas/cargos-e-setores")
                        : section.path;
                      const isActive = location === section.path || location === currentPath || 
                                      location.startsWith(section.path + "/") || location.startsWith(currentPath + "/");
                      return (
                        <button
                          key={section.id}
                          onClick={() => setLocation(currentPath)}
                          className={cn(
                            "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-left transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-accent text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="h-5 w-5" />
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
            <div className="flex-1 min-w-0">
              <div className="space-y-6">
                {activeSection?.component && (
                  <activeSection.component showLayout={false} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
  );

  if (!showLayout) {
    return content;
  }

  return (
    <DashboardLayout>
      {content}
    </DashboardLayout>
  );
}

