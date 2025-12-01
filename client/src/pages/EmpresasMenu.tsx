import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Building2, BarChart3, HardHat } from "lucide-react";
import { useLocation } from "wouter";
import React, { useEffect } from "react";
import Empresas from "./Empresas";
import DashboardEmpresas from "./DashboardEmpresas";
import Obras from "./Obras";

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
  {
    id: "obras",
    label: "Obras",
    description: "Gerencie obras e projetos das empresas.",
    icon: HardHat,
    path: "/obras",
    component: Obras,
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

  // Se estiver em /obras, garantir que está dentro do contexto de empresas
  useEffect(() => {
    if (location === "/obras" && !activeSection) {
      // A seção já deve estar sendo detectada, mas garantimos que funciona
    }
  }, [location, activeSection]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabeçalho com título e menu horizontal */}
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Empresas</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie empresas cadastradas e visualize estatísticas e análises.
            </p>
          </div>

          {/* Menu horizontal no cabeçalho */}
          <div className="border-b">
            <nav className="flex gap-1">
              {empresaSections.map((section) => {
                const Icon = section.icon;
                const isActive = location === section.path || location.startsWith(section.path + "/");
                return (
                  <button
                    key={section.id}
                    onClick={() => setLocation(section.path)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                      isActive
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
                    )}
                    style={{ 
                      transition: 'none',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{section.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Conteúdo */}
        <div>
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
                        className="flex flex-col items-start gap-3 p-4 rounded-lg border hover:bg-accent text-left w-full"
                        style={{ transition: 'background-color 0.1s ease' }}
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
    </DashboardLayout>
  );
}

