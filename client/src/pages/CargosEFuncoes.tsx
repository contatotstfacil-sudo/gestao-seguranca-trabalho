import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Briefcase, BarChart3, ChevronRight, FolderTree } from "lucide-react";
import { useLocation } from "wouter";
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
  
  const isEmpresasContext = location.startsWith("/empresas/cargos-e-setores");
  
  const resolvedSections = React.useMemo(() => {
    return cargosEFuncoesSections.map((section) => ({
      ...section,
      path: isEmpresasContext
        ? section.path.replace("/cargos-e-funcoes", "/empresas/cargos-e-setores")
        : section.path,
    }));
  }, [isEmpresasContext]);
  
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
  const currentTab = activeSection?.id ?? resolvedSections[0]?.id;

  const handleTabChange = (path: string) => {
    setLocation(path);
  };

  const content = (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cargos e Setores</h1>
          <p className="text-gray-600 mt-1">Gerencie cargos, setores e relatórios</p>
        </div>

        {showMenu ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resolvedSections.map((section) => {
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
          <div className="space-y-6">
            <div className="sticky top-4 z-20">
              <div className="border-b">
                <nav className="flex gap-1">
                  {resolvedSections.map((section) => {
                    const Icon = section.icon;
                    const isActive = currentTab === section.id;
                    return (
                      <button
                        key={section.id}
                        onClick={() => handleTabChange(section.path)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                          isActive
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
                        )}
                        style={{ transition: "none", WebkitTapHighlightColor: "transparent" }}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{section.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            <div className="space-y-6">
              {activeSection?.component && (
                <activeSection.component showLayout={false} />
              )}
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

