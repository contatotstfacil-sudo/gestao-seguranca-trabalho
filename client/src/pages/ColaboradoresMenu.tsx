import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Users, BarChart3 } from "lucide-react";
import { useLocation } from "wouter";
import React, { useEffect, useMemo, memo, useCallback, startTransition } from "react";
import Colaboradores from "./Colaboradores";
import DashboardColaboradores from "./DashboardColaboradores";
import { trpc } from "@/lib/trpc";

type ColaboradorSection = {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  component: React.ComponentType;
};

const colaboradorSections: ColaboradorSection[] = [
  {
    id: "cadastrar",
    label: "Cadastrar",
    description: "Gerencie os colaboradores cadastrados com informações completas.",
    icon: Users,
    path: "/colaboradores/cadastrar",
    component: Colaboradores,
  },
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Visualize estatísticas e análises dos colaboradores.",
    icon: BarChart3,
    path: "/colaboradores/dashboard",
    component: DashboardColaboradores,
  },
];

// Componente memoizado para renderizar a seção ativa - com cache agressivo
const ActiveSectionRenderer = memo(({ 
  component: Component,
  path
}: { 
  component: React.ComponentType;
  path: string;
}) => {
  return (
    <div style={{ contain: 'layout style paint', willChange: 'contents' }}>
      <Component />
    </div>
  );
}, (prevProps, nextProps) => {
  // Só re-renderiza se o componente ou path mudar
  return prevProps.component === nextProps.component && prevProps.path === nextProps.path;
});

ActiveSectionRenderer.displayName = "ActiveSectionRenderer";

export default function ColaboradoresMenu() {
  const [location, setLocation] = useLocation();
  const utils = trpc.useUtils();

  // Pré-carregar dados quando o componente monta ou quando hover no menu
  useEffect(() => {
    // Pré-carregar dados essenciais em background
    utils.empresas.list.prefetch(undefined);
    utils.cargos.list.prefetch(undefined);
    utils.setores.list.prefetch(undefined);
  }, [utils]);

  // Memoizar a seção ativa para evitar recálculos - otimizado
  const activeSection = useMemo(() => {
    if (location === "/colaboradores") {
      return colaboradorSections[0]; // Retorna "Cadastrar" por padrão
    }
    for (const section of colaboradorSections) {
      if (location === section.path || location.startsWith(section.path + "/")) {
        return section;
      }
    }
    return null;
  }, [location]);

  // Memoizar showMenu
  const showMenu = useMemo(() => {
    return !activeSection || location === "/colaboradores";
  }, [activeSection, location]);
  
  // Handler ultra-otimizado para navegação - usando startTransition
  const handleNavigation = useCallback((path: string) => {
    // Pré-carregar dados antes de navegar
    if (path === "/colaboradores/cadastrar") {
      utils.colaboradores.list.prefetch({
        searchTerm: undefined,
        dataAdmissaoInicio: undefined,
        dataAdmissaoFim: undefined,
        empresaId: undefined,
      });
    }
    
    // Navegação não-bloqueante
    startTransition(() => {
      setLocation(path);
    });
  }, [setLocation, utils]);

  // Pré-carregar dados quando hover no botão
  const handleMouseEnter = useCallback((path: string) => {
    if (path === "/colaboradores/cadastrar") {
      utils.colaboradores.list.prefetch({
        searchTerm: undefined,
        dataAdmissaoInicio: undefined,
        dataAdmissaoFim: undefined,
        empresaId: undefined,
      });
    } else if (path === "/colaboradores/dashboard") {
      // Pré-carregar dados do dashboard
      utils.empresas.list.prefetch(undefined);
    }
  }, [utils]);

  // Redirecionar rota base apenas uma vez no mount
  useEffect(() => {
    if (location === "/colaboradores") {
      handleNavigation("/colaboradores/cadastrar");
    }
  }, []); // Apenas no mount

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabeçalho com título e menu horizontal */}
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Colaboradores</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie colaboradores cadastrados e visualize estatísticas e análises.
            </p>
          </div>

          {/* Menu horizontal no cabeçalho */}
          <div className="border-b">
            <nav className="flex gap-1">
              {colaboradorSections.map((section) => {
                const Icon = section.icon;
                const isActive = location === section.path || location.startsWith(section.path + "/");
                return (
                  <button
                    key={section.id}
                    onClick={() => handleNavigation(section.path)}
                    onMouseEnter={() => handleMouseEnter(section.path)}
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
                  {colaboradorSections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <div
                        key={section.id}
                        onMouseEnter={() => handleMouseEnter(section.path)}
                      >
                        <button
                          onClick={() => handleNavigation(section.path)}
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
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : activeSection?.component ? (
            <div>
              <ActiveSectionRenderer 
                component={activeSection.component} 
                path={activeSection.path}
              />
            </div>
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  );
}
