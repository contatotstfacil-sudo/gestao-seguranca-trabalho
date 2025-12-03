import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, ChevronRight, Settings, List, FileCheck, Plus, ClipboardList } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import ListaTreinamentos from "./ListaTreinamentos";
import TiposTreinamentos from "./TiposTreinamentos";
import ModelosCertificados from "./ModelosCertificados";
import EmissaoCertificados from "./EmissaoCertificados";
import ListaPresencaEmitida from "./ListaPresencaEmitida";
import React from "react";

type TreinamentosSection = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  component?: React.ComponentType<{ showLayout?: boolean }>;
};

const treinamentosSections: TreinamentosSection[] = [
  {
    id: "modelos-certificados",
    label: "Modelos de Certificados",
    icon: FileCheck,
    path: "/treinamentos/modelos-certificados",
    component: ModelosCertificados,
  },
  {
    id: "tipos-treinamentos",
    label: "Prazos de Treinamentos",
    icon: Settings,
    path: "/treinamentos/tipos",
    component: TiposTreinamentos,
  },
  {
    id: "emitir-certificado",
    label: "Emitir Certificado",
    icon: Plus,
    path: "/treinamentos/emitir-certificado",
    component: EmissaoCertificados,
  },
  {
    id: "lista-treinamentos",
    label: "Relatório de Treinamentos Feitos",
    icon: List,
    path: "/treinamentos/lista",
    component: ListaTreinamentos,
  },
  {
    id: "lista-presenca-emitida",
    label: "Lista de Presença Emitida",
    icon: ClipboardList,
    path: "/treinamentos/lista-presenca-emitida",
    component: ListaPresencaEmitida,
  },
];

export default function TreinamentosPainel() {
  const [location, setLocation] = useLocation();
  
  // Determinar qual seção está ativa baseado na rota
  const activeSection = treinamentosSections.find(section => {
    const isExactMatch = location === section.path;
    const isStartsWith = location.startsWith(section.path + "/");
    return isExactMatch || isStartsWith;
  }) || null;
  
  // Se não há seção ativa, mostrar o menu principal
  const showMenu = !activeSection || location === "/treinamentos";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Treinamentos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie tipos de treinamentos e registre treinamentos realizados.
          </p>
        </div>

        {/* Menu no Cabeçalho */}
        <Card>
          <CardContent className="p-2">
            <nav className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setLocation("/treinamentos")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  location === "/treinamentos"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent text-muted-foreground hover:text-foreground"
                )}
              >
                <FileText className="h-4 w-4" />
                <span>Visão Geral</span>
              </button>
              
              {treinamentosSections.map((section) => {
                const Icon = section.icon;
                const isActive = location === section.path;
                return (
                  <button
                    key={section.id}
                    onClick={() => setLocation(section.path)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{section.label}</span>
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>

        {/* Conteúdo Principal */}
        <div>
            {showMenu ? (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold mb-2">Áreas de Treinamentos</h2>
                      <p className="text-muted-foreground">
                        Selecione uma opção no menu acima para gerenciar treinamentos.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {treinamentosSections.map((section) => {
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
                                  {section.id === "modelos-certificados"
                                    ? "Configure e gerencie os modelos de certificados do sistema."
                                    : section.id === "emitir-certificado"
                                    ? "Emita certificados para colaboradores usando os modelos cadastrados."
                                    : section.id === "tipos-treinamentos"
                                    ? "Cadastre e gerencie os prazos de treinamentos disponíveis."
                                    : section.id === "lista-treinamentos"
                                    ? "Visualize e gerencie todos os treinamentos realizados."
                                    : section.id === "lista-presenca-emitida"
                                    ? "Gere listas de presença automaticamente a partir dos certificados emitidos."
                                    : "Visualize e gerencie todos os treinamentos realizados."}
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
    </DashboardLayout>
  );
}

