import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ClipboardList, FileText, ShieldAlert, ShieldCheck, Thermometer, ChevronRight, FolderOpen } from "lucide-react";
import { useLocation } from "wouter";
import React from "react";

import LaudoPgro from "./laudos/LaudoPgro";
import LaudoPgr from "./laudos/LaudoPgr";
import LaudoLtcat from "./laudos/LaudoLtcat";
import LaudoInsalubridade from "./laudos/LaudoInsalubridade";
import LaudoPericulosidade from "./laudos/LaudoPericulosidade";
import ModeloPgro from "./laudos/ModeloPgro";

type LaudoSection = {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  component: React.ComponentType;
};

const laudoSections: LaudoSection[] = [
  {
    id: "modelos",
    label: "Modelos",
    description: "Gerencie modelos de documentos para facilitar a criação de laudos.",
    icon: FolderOpen,
    path: "/laudos-ocupacionais/modelos",
    component: ModeloPgro,
  },
  {
    id: "pgro",
    label: "PGRO",
    description: "Plano de Gerenciamento de Riscos Ocupacionais.",
    icon: ClipboardList,
    path: "/laudos-ocupacionais/pgro",
    component: LaudoPgro,
  },
  {
    id: "pgr",
    label: "PGR",
    description: "Programa de Gerenciamento de Riscos (NR-01).",
    icon: FileText,
    path: "/laudos-ocupacionais/pgr",
    component: LaudoPgr,
  },
  {
    id: "ltcat",
    label: "LTCAT",
    description: "Laudo Técnico das Condições Ambientais do Trabalho.",
    icon: Thermometer,
    path: "/laudos-ocupacionais/ltcat",
    component: LaudoLtcat,
  },
  {
    id: "insalubridade",
    label: "Laudo de Insalubridade",
    description: "Avaliações de agentes insalubres e adicionais correspondentes.",
    icon: ShieldAlert,
    path: "/laudos-ocupacionais/insalubridade",
    component: LaudoInsalubridade,
  },
  {
    id: "periculosidade",
    label: "Laudo de Periculosidade",
    description: "Análises de atividades perigosas e controle de adicionais.",
    icon: ShieldCheck,
    path: "/laudos-ocupacionais/periculosidade",
    component: LaudoPericulosidade,
  },
];

export default function LaudosOcupacionais() {
  const [location, setLocation] = useLocation();

  const activeSection =
    laudoSections.find((section) => {
      const isExact = location === section.path;
      const isNested = location.startsWith(section.path + "/");
      return isExact || isNested;
    }) ?? null;

  const showMenu = !activeSection || location === "/laudos-ocupacionais";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Laudos Ocupacionais</h1>
          <p className="text-muted-foreground mt-1">
            Organize PGRO, PGR, LTCAT e laudos técnicos de insalubridade e periculosidade em um único lugar.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Menu lateral - sempre visível */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardContent className="p-2">
                <nav className="space-y-1">
                  <button
                    onClick={() => setLocation("/laudos-ocupacionais")}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                      location === "/laudos-ocupacionais"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">Visão Geral</span>
                  </button>

                  {laudoSections.map((section) => {
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
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-2">Escolha um laudo</h2>
                    <p className="text-muted-foreground">
                      Utilize o menu ao lado para acessar o módulo desejado. Cada laudo terá fluxos específicos para anexos, revisões e relatórios.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {laudoSections.map((section) => {
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
                              <p className="text-sm text-muted-foreground">{section.description}</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : activeSection ? (
              React.createElement(activeSection.component)
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
