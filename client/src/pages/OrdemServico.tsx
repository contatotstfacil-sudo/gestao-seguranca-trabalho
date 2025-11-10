import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, ChevronRight, Plus, List, Settings } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import EmitirOrdemServico from "./EmitirOrdemServico";
import ListaOrdensServico from "./ListaOrdensServico";
import ModelosOrdemServico from "./ModelosOrdemServico";
import React from "react";

type OrdemServicoSection = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  component?: React.ComponentType<{ showLayout?: boolean }>;
};

const ordemServicoSections: OrdemServicoSection[] = [
  {
    id: "modelos-ordem",
    label: "Cadastrar Modelos",
    icon: Settings,
    path: "/ordem-servico/modelos",
    component: ModelosOrdemServico,
  },
  {
    id: "emitir-ordem",
    label: "Emitir Ordem de Serviço",
    icon: Plus,
    path: "/ordem-servico/emitir",
    component: EmitirOrdemServico,
  },
  {
    id: "lista-ordens",
    label: "Lista de Ordens",
    icon: List,
    path: "/ordem-servico/lista",
    component: ListaOrdensServico,
  },
];

export default function OrdemServico() {
  const [location, setLocation] = useLocation();
  
  // Determinar qual seção está ativa baseado na rota
  const activeSection = ordemServicoSections.find(section => {
    const isExactMatch = location === section.path;
    const isStartsWith = location.startsWith(section.path + "/");
    return isExactMatch || isStartsWith;
  }) || null;
  
  // Se não há seção ativa, mostrar o menu principal
  const showMenu = !activeSection || location === "/ordem-servico";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ordem de Serviço - SST</h1>
          <p className="text-muted-foreground mt-1">
            Emita e gerencie ordens de serviço de Segurança do Trabalho.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Menu Lateral */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-2">
                <nav className="space-y-1">
                  <button
                    onClick={() => setLocation("/ordem-servico")}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                      location === "/ordem-servico"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">Visão Geral</span>
                  </button>
                  
                  {ordemServicoSections.map((section) => {
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
            {showMenu ? (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold mb-2">Áreas de Ordem de Serviço</h2>
                      <p className="text-muted-foreground">
                        Selecione uma opção no menu lateral para gerenciar ordens de serviço de Segurança do Trabalho.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {ordemServicoSections.map((section) => {
                        const Icon = section.icon;
                        return (
                          <button
                            key={section.id}
                            onClick={() => setLocation(section.path)}
                            className="p-4 border rounded-lg hover:border-primary hover:bg-accent/50 transition-all text-left group"
                          >
                            <div className="flex items-start gap-4">
                              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                <Icon className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold mb-1">{section.label}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {section.id === "modelos-ordem"
                                    ? "Cadastre e gerencie modelos de ordem de serviço."
                                    : section.id === "emitir-ordem"
                                    ? "Crie uma nova ordem de serviço para empresas e colaboradores."
                                    : "Visualize e gerencie todas as ordens de serviço de SST emitidas."}
                                </p>
                              </div>
                              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : activeSection?.component ? (
              <div>
                {React.createElement(activeSection.component, { showLayout: false })}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground">Seção não encontrada.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

