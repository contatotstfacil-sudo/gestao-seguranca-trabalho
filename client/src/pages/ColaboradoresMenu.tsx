import DashboardLayout from "@/components/DashboardLayout";
import { Users } from "lucide-react";
import { useLocation } from "wouter";
import React, { useEffect } from "react";
import Colaboradores from "./Colaboradores";

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
];

export default function ColaboradoresMenu() {
  const [location, setLocation] = useLocation();

  // Determinar qual seção está ativa baseado na rota
  const activeSection = colaboradorSections.find((section) => {
    const isExact = location === section.path;
    const isNested = location.startsWith(section.path + "/");
    return isExact || isNested;
  }) ?? null;

  // Se não há seção ativa ou está na rota base, mostrar o menu principal
  const showMenu = !activeSection || location === "/colaboradores";
  
  // Redirecionar rota base
  useEffect(() => {
    if (location === "/colaboradores") {
      setLocation("/colaboradores/cadastrar");
    }
  }, [location, setLocation]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Conteúdo do dashboard embaixo do menu */}
        <div>
          {!showMenu && activeSection?.component ? (
            <div>
              <activeSection.component />
            </div>
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  );
}


