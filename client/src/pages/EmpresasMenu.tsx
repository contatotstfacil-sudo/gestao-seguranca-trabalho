import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Building2, BarChart3, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import React, { useEffect } from "react";
import Empresas from "./Empresas";
import DashboardEmpresas from "./DashboardEmpresas";

type EmpresaSection = {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  component: React.ComponentType;
};

const empresaSections: EmpresaSection[] = [
  {
    id: "cadastrar",
    label: "Cadastrar",
    description: "Gerencie as empresas cadastradas com informações completas.",
    icon: Building2,
    path: "/empresas/cadastrar",
    component: Empresas,
  },
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Visão geral e estatísticas das empresas cadastradas.",
    icon: BarChart3,
    path: "/empresas/dashboard",
    component: DashboardEmpresas,
  },
];

export default function EmpresasMenu() {
  const [location, setLocation] = useLocation();

  // Determinar qual seção está ativa baseado na rota
  const activeSection = empresaSections.find((section) => {
    const isExact = location === section.path;
    const isNested = location.startsWith(section.path + "/");
    return isExact || isNested;
  }) ?? null;

  // Se não há seção ativa ou está na rota base, mostrar o menu principal
  const showMenu = !activeSection || location === "/empresas";
  
  // Se estiver na rota base "/empresas", redirecionar para cadastrar
  useEffect(() => {
    if (location === "/empresas") {
      setLocation("/empresas/cadastrar");
    }
  }, [location, setLocation]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Empresas</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie empresas cadastradas e visualize estatísticas e análises.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Menu lateral - sempre visível */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardContent className="p-2">
                <nav className="space-y-1">
                  {empresaSections.map((section) => {
                    const Icon = section.icon;
                    const isActive = location === section.path || location.startsWith(section.path + "/");
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
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 transition-transform",
                            isActive && "rotate-90"
                          )}
                        />
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Conteúdo */}
          <div className="lg:col-span-3 overflow-y-auto max-h-[calc(100vh-8rem)] pr-2">
            {showMenu ? (
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {empresaSections.map((section) => {
                      const Icon = section.icon;
                      return (
                        <button
                          key={section.id}
                          onClick={() => setLocation(section.path)}
                          className="flex flex-col items-start gap-3 p-4 rounded-lg border hover:bg-accent transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold">{section.label}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {section.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : activeSection?.component ? (
              <div>
                <activeSection.component />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

