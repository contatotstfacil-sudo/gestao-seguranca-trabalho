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

  const navItems = [
    {
      id: "overview",
      label: "Visão Geral",
      icon: FileText,
      path: "/ordem-servico",
    },
    ...ordemServicoSections,
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Ordem de Serviço - SST</h1>
          <p className="text-muted-foreground">
            Emita e gerencie ordens de serviço de Segurança do Trabalho.
          </p>
        </div>

        <div className="border-b">
          <nav className="flex gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                (item.id === "overview" && location === "/ordem-servico") ||
                location === item.path ||
                location.startsWith(item.path + "/");
              return (
                <button
                  key={item.id}
                  onClick={() => setLocation(item.path)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
                  )}
                  style={{ transition: "none", WebkitTapHighlightColor: "transparent" }}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {showMenu ? (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Áreas de Ordem de Serviço</h2>
                  <p className="text-muted-foreground">
                    Escolha uma opção no menu acima para gerenciar ordens de serviço de SST.
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
    </DashboardLayout>
  );
}

