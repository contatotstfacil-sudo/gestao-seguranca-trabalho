import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Calendar, CalendarDays, Clock, ListChecks, Repeat, Sparkles, Trash2, BookOpen, Download, Shield, GraduationCap, LifeBuoy, ExternalLink } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { nanoid } from "nanoid";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

type NotaPrioridade = "alta" | "media" | "baixa";

type Nota = {
  id: string;
  titulo: string;
  descricao: string;
  prioridade: NotaPrioridade;
  createdAt: string;
};

const HOME_NOTAS_STORAGE_KEY = "home-painel-notas";
const HOME_ROTINAS_STORAGE_KEY = "home-painel-rotinas";

const prioridadeEstilos: Record<NotaPrioridade, { label: string; badgeClass: string; containerClass: string; dotClass: string }> = {
  alta: {
    label: "Alta prioridade",
    badgeClass: "bg-red-100 text-red-700 border border-red-200",
    containerClass: "border-red-200/80 bg-red-50/80",
    dotClass: "bg-red-500",
  },
  media: {
    label: "Prioridade média",
    badgeClass: "bg-amber-100 text-amber-700 border border-amber-200",
    containerClass: "border-amber-200/80 bg-amber-50/70",
    dotClass: "bg-amber-500",
  },
  baixa: {
    label: "Prioridade baixa",
    badgeClass: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    containerClass: "border-emerald-200/80 bg-emerald-50/70",
    dotClass: "bg-emerald-500",
  },
};

const prioridadePeso: Record<NotaPrioridade, number> = {
  alta: 0,
  media: 1,
  baixa: 2,
};

type Recorrencia = "unica" | "diaria" | "semanal" | "mensal";

type Rotina = {
  id: string;
  titulo: string;
  descricao: string;
  data: string;
  hora: string;
  recorrencia: Recorrencia;
  createdAt: string;
};

const recorrenciaLabels: Record<Recorrencia, string> = {
  unica: "Única",
  diaria: "Diária",
  semanal: "Semanal",
  mensal: "Mensal",
};

type NormaRegulamentadora = {
  codigo: string;
  titulo: string;
  descricao: string;
  pdfUrl?: string;
  observacoes?: string[];
  links?: { etiqueta: string; url: string; destaque?: boolean }[];
};

type ReferenciaFundacentro = {
  codigo: string;
  titulo: string;
  descricao: string;
  url: string;
};

const normasRegulamentadoras: NormaRegulamentadora[] = [
  {
    codigo: "NR-01",
    titulo: "Disposições Gerais e Gerenciamento de Riscos Ocupacionais",
    descricao: "Regras gerais, responsabilidades e diretrizes do Programa de Gerenciamento de Riscos (PGR).",
    observacoes: [
      "Vigência até 25 de maio de 2026 (última modificação: Portaria MTE nº 344, de 25 de março de 2024).",
      "Nova redação entra em vigor em 26 de maio de 2026 (Portaria MTE nº 1.419, de 27 de agosto de 2024).",
    ],
    links: [
      {
        etiqueta: "Versão vigente",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-01-atualizada-2024-i-1.pdf",
        destaque: true,
      },
      {
        etiqueta: "Versão 2026",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-01-atualizada-2025-i-3.pdf",
      },
    ],
  },
  {
    codigo: "NR-02",
    titulo: "Inspeção Prévia (Revogada)",
    descricao: "Histórico de exigências de inspeção prévia. Disponível para referência documental.",
    observacoes: [
      "Revogada pela Portaria SEPRT nº 915, de 30 de julho de 2019 (DOU de 31/07/2019).",
    ],
    links: [
      {
        etiqueta: "Versão histórica (revogada)",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/arquivos/normas-regulamentadoras/nr-02_atualizada_2019.pdf",
      },
    ],
  },
  {
    codigo: "NR-03",
    titulo: "Embargo e Interdição",
    descricao: "Critérios para caracterização de grave e iminente risco e procedimentos de embargo ou interdição.",
    observacoes: [
      "Última modificação: Portaria SEPRT nº 1.068, de 23 de setembro de 2019 (DOU de 24/09/2019).",
    ],
    links: [
      {
        etiqueta: "Versão vigente",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/arquivos/normas-regulamentadoras/nr-03_atualizada_2019.pdf",
        destaque: true,
      },
    ],
  },
  {
    codigo: "NR-04",
    titulo: "Serviços Especializados em Segurança e em Medicina do Trabalho",
    descricao: "Parâmetros para constituição, dimensionamento e funcionamento do SESMT.",
    observacoes: [
      "Última modificação: Portaria MTP nº 2.318, de 3 de agosto de 2022 (DOU de 12/08/2022).",
      "Reforço de diretrizes gerais pela Portaria MTP nº 4.219, de 20 de dezembro de 2022 (DOU de 22/12/2022).",
    ],
    links: [
      {
        etiqueta: "Versão vigente",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-04-atualizada-2023.pdf",
        destaque: true,
      },
      {
        etiqueta: "Manual registro SESMT",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/manual-do-usuario-registro-de-sesmt-2023.pdf",
      },
    ],
  },
  {
    codigo: "NR-05",
    titulo: "Comissão Interna de Prevenção de Acidentes e de Assédio - CIPA",
    descricao: "Diretrizes para constituição, funcionamento e atribuições da CIPA e do representante dos trabalhadores.",
    observacoes: [
      "Última atualização: Portaria MTP nº 4.219, de 20 de dezembro de 2022 (DOU de 22/12/2022).",
    ],
    links: [
      {
        etiqueta: "Versão vigente",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/NR05atualizada2023.pdf",
        destaque: true,
      },
    ],
  },
  {
    codigo: "NR-06",
    titulo: "Equipamento de Proteção Individual",
    descricao: "Requisitos para aprovação, fornecimento, uso e responsabilidade sobre EPIs.",
    observacoes: [
      "Última modificação: Portaria MTE nº 57, de 16 de janeiro de 2025 (DOU de 17/01/2025).",
    ],
    links: [
      {
        etiqueta: "Versão vigente",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-06-atualizada-2025-ii.pdf",
        destaque: true,
      },
      {
        etiqueta: "Manual vestimentas EPI",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/arquivos/normas-regulamentadoras/nr-06_manual_de_orientacao_para_especificacao_das_vestimentas_de_protecao_de_arco_eletrico_e_fogo_repentino.pdf",
      },
    ],
  },
  {
    codigo: "NR-07",
    titulo: "Programa de Controle Médico de Saúde Ocupacional - PCMSO",
    descricao: "Diretrizes para elaboração, implementação e acompanhamento do PCMSO alinhado ao PGR.",
    observacoes: [
      "Última modificação: Portaria SEPRT nº 8.873, de 23 de julho de 2021 (DOU de 26/07/2021).",
    ],
    links: [
      {
        etiqueta: "Versão vigente",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-07-atualizada-2022-1.pdf",
        destaque: true,
      },
    ],
  },
  {
    codigo: "NR-08",
    titulo: "Edificações",
    descricao: "Requisitos mínimos de segurança, conforto e salubridade para edificações utilizadas por trabalhadores.",
    observacoes: [
      "Última modificação: Portaria MTP nº 2.188, de 28 de julho de 2022 (DOU de 05/08/2022).",
    ],
    links: [
      {
        etiqueta: "Versão vigente",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/arquivos/normas-regulamentadoras/nr-08-atualizada-2022.pdf",
        destaque: true,
      },
    ],
  },
  {
    codigo: "NR-09",
    titulo: "Avaliação e Controle das Exposições Ocupacionais a Agentes Físicos, Químicos e Biológicos",
    descricao: "Requisitos para identificação, avaliação e controle das exposições ocupacionais integradas ao PGR.",
    observacoes: [
      "Última modificação: Portaria MTP nº 426, de 7 de outubro de 2021 (DOU de 08/10/2021).",
    ],
    links: [
      {
        etiqueta: "Versão vigente",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-09-atualizada-2021.pdf",
        destaque: true,
      },
    ],
  },
  {
    codigo: "NR-10",
    titulo: "Segurança em Instalações e Serviços em Eletricidade",
    descricao: "Requisitos para controle de riscos elétricos e organização do prontuário de instalações elétricas.",
    observacoes: [
      "Última modificação: Portaria SEPRT nº 915, de 30 de julho de 2019 (DOU de 31/07/2019).",
    ],
    links: [
      {
        etiqueta: "Versão vigente",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/arquivos/normas-regulamentadoras/nr-10.pdf",
        destaque: true,
      },
      {
        etiqueta: "Manual NR-10",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/arquivos/normas-regulamentadoras/nr-10_manual_de_auxilio_na_interpretacao_e_aplicacao_da_nr_10.pdf",
      },
    ],
  },
  {
    codigo: "NR-11",
    titulo: "Transporte, Movimentação, Armazenagem e Manuseio de Materiais",
    descricao: "Requisitos de segurança para equipamentos de içamento e movimentação, transporte manual e armazenamento de materiais.",
    observacoes: [
      "Última modificação: Portaria MTPS nº 505, de 29 de abril de 2016 (DOU de 02/05/2016).",
    ],
    links: [
      {
        etiqueta: "Versão vigente",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-11-atualizada-2016.pdf",
        destaque: true,
      },
      {
        etiqueta: "Anexo I",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/arquivos/normas-regulamentadoras/nr-11-anexo-01.pdf",
      },
    ],
  },
  {
    codigo: "NR-12",
    titulo: "Segurança no Trabalho em Máquinas e Equipamentos",
    descricao: "Diretrizes para prevenção de acidentes com máquinas, cobrindo projeto, instalação, operação, manutenção e capacitação.",
    observacoes: [
      "Última modificação: Portaria MTE nº 344, de 21 de março de 2024 (DOU de 22/03/2024).",
    ],
    links: [
      {
        etiqueta: "Versão vigente",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-12-atualizada-2025.pdf",
        destaque: true,
      },
      {
        etiqueta: "Manual",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/manuais-e-publicacoes/manual-de-aplicacao-da-nr-12.pdf",
      },
      {
        etiqueta: "Nota técnica",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/seguranca-e-saude-no-trabalho/sst-notas-tecnicas/nota_tecnica_2347-manual-aplicacao-nr-12.pdf",
      },
      {
        etiqueta: "Avaliação",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/arquivos/normas-regulamentadoras/nr-12_avaliacao_de_conformidade_de_componentes_de_sistemas_de_seguranca_de_maquinas_no_brasil.pdf",
      },
      {
        etiqueta: "Cartilha",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/arquivos/normas-regulamentadoras/nr-12_cartilha_nr_12_segurana_em_mquinas_para_couro_e_tratamento_de_efluentes.pdf",
      },
    ],
  },
  {
    codigo: "NR-13",
    titulo: "Caldeiras, Vasos de Pressão, Tubulações e Tanques Metálicos de Armazenamento",
    descricao: "Requisitos para operação segura, inspeção e integridade estrutural de equipamentos sob pressão e tanques." ,
    observacoes: [
      "Última modificação: Portaria MTP nº 4.219, de 20 de dezembro de 2022 (DOU de 22/12/2022).",
    ],
    links: [
      {
        etiqueta: "Versão vigente",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-13-atualizada-2023-b.pdf",
        destaque: true,
      },
      {
        etiqueta: "Perguntas/Respostas",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/perguntas-e-respostas-nr13_2023_04_28.pdf",
      },
    ],
  },
  {
    codigo: "NR-14",
    titulo: "Fornos",
    descricao: "Segurança na operação de fornos industriais, com foco em requisitos construtivos e operacionais.",
    observacoes: [
      "Vigência desde 01/09/2022: Portaria MTP nº 2.189, de 28 de julho de 2022.",
    ],
    links: [
      {
        etiqueta: "Versão vigente",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/arquivos/normas-regulamentadoras/nr-14-atualizada-2022.pdf",
        destaque: true,
      },
    ],
  },
  {
    codigo: "NR-15",
    titulo: "Atividades e Operações Insalubres",
    descricao: "Limites de tolerância, metodologias de avaliação e anexos específicos para agentes físicos, químicos e biológicos em ambientes insalubres.",
    observacoes: [
      "Última modificação: Portaria MTE nº 2.189, de 28 de julho de 2022.",
      "Observação: Os anexos I (Vibração) e III (Calor) permanecem vigentes conforme Portaria MTP nº 426/2021 até nova republicação integrada.",
    ],
    links: [
      {
        etiqueta: "Versão vigente",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-15-atualizada-2022.pdf",
        destaque: true,
      },
      {
        etiqueta: "Anexo 1",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/arquivos/normas-regulamentadoras/nr-15-anexo-01.pdf",
      },
      {
        etiqueta: "Anexo 2",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/arquivos/normas-regulamentadoras/nr-15-anexo-02.pdf",
      },
      {
        etiqueta: "Anexos I e III (Port.426)",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/seguranca-e-saude-no-trabalho/sst-portarias/2021/portaria-mtp-no-426-anexos-i-vibracao-e-iii-calor-da-nr-09.pdf",
      },
      {
        etiqueta: "Anexo 5",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/arquivos/normas-regulamentadoras/nr-15-anexo-05.pdf",
      },
      {
        etiqueta: "Anexo 6",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-15-anexo-6-trabalho-sob-condicoes-hiperbaricas.pdf",
      },
      {
        etiqueta: "Anexo 7",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/arquivos/normas-regulamentadoras/nr-15-anexo-07.pdf",
      },
      {
        etiqueta: "Anexo 9",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/arquivos/normas-regulamentadoras/nr-15-anexo-09.pdf",
      },
      {
        etiqueta: "Anexo 10",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/arquivos/normas-regulamentadoras/nr-15-anexo-10.pdf",
      },
      {
        etiqueta: "Anexo 11",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/arquivos/normas-regulamentadoras/nr-15-anexo-11.pdf",
      },
      {
        etiqueta: "Anexo 12",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/arquivos/normas-regulamentadoras/nr-15-anexo-12.pdf",
      },
      {
        etiqueta: "Anexo 13",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/arquivos/normas-regulamentadoras/nr-15-anexo-13.pdf",
      },
      {
        etiqueta: "Anexo 13A",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/arquivos/normas-regulamentadoras/nr-15-anexo-13a-atualizado-2022-1.pdf",
      },
      {
        etiqueta: "Anexo 14",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/arquivos/normas-regulamentadoras/nr-15-anexo-14.pdf",
      },
    ],
  },
  {
    codigo: "NR-16",
    titulo: "Atividades e Operações Perigosas",
    descricao: "Definição de periculosidade, critérios de enquadramento e anexos específicos para explosivos, inflamáveis, radiações ionizantes e outras situações críticas.",
    observacoes: [
      "Última modificação: Portaria MTE nº 1.411, de 22 de agosto de 2025.",
      "Obs.: Portaria MTE nº 1.565/2014 (motociclistas) está suspensa por decisão judicial até nova regulamentação.",
    ],
    links: [
      {
        etiqueta: "Versão vigente",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-16-atualizada-2025-1.pdf",
        destaque: true,
      },
    ],
  },
  {
    codigo: "NR-17",
    titulo: "Ergonomia",
    descricao: "Parâmetros ergonômicos para adaptação das condições de trabalho às características psicofisiológicas dos trabalhadores, incluindo anexos específicos para checkout e teleatendimento.",
    observacoes: [
      "Última modificação: Portaria MTP nº 4.219, de 20 de dezembro de 2022.",
    ],
    links: [
      {
        etiqueta: "Versão vigente",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-17-atualizada-2023.pdf",
        destaque: true,
      },
      {
        etiqueta: "Anexo I",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-17-anexo-i-checkout-atualizado-2023.pdf",
      },
      {
        etiqueta: "Anexo II",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-17-anexo-ii-teleatendimento-atualizado-2023.pdf",
      },
    ],
  },
  {
    codigo: "NR-18",
    titulo: "Segurança e Saúde no Trabalho na Indústria da Construção",
    descricao: "Diretrizes para planejamento, organização e controle de riscos em canteiros de obras, com anexos sobre capacitação e cabos de aço/fibra.",
    observacoes: [
      "Última modificação: Portaria MTE nº 1.420, de 27 de agosto de 2024 (com consolidação em 02/01/2025).",
    ],
    links: [
      {
        etiqueta: "Versão vigente",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-18-atualizada-2025-1.pdf",
        destaque: true,
      },
      {
        etiqueta: "Histórico da reformulação",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/arquivos/normas-regulamentadoras/nr-18_historico_reformulacao_nr_18.pdf",
      },
    ],
  },
  {
    codigo: "NR-19",
    titulo: "Explosivos",
    descricao: "Requisitos para fabricação, armazenamento, transporte e manuseio seguro de explosivos e acessórios.",
    observacoes: [
      "Última modificação: Portaria MTP nº 4.219, de 20 de dezembro de 2022.",
    ],
    links: [
      {
        etiqueta: "Versão vigente",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-19-atualizada-2023.pdf",
        destaque: true,
      },
    ],
  },
  {
    codigo: "NR-20",
    titulo: "Segurança e Saúde no Trabalho com Inflamáveis e Combustíveis",
    descricao: "Medidas de prevenção, controle e resposta a emergências em instalações que manipulam líquidos inflamáveis, gases combustíveis e líquidos combustíveis.",
    observacoes: [
      "Última modificação: Portaria MTE nº 60, de 21 de janeiro de 2025.",
    ],
    links: [
      {
        etiqueta: "Versão vigente",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-20-atualizada-2025.pdf",
        destaque: true,
      },
      {
        etiqueta: "Perguntas/Respostas",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/arquivos/normas-regulamentadoras/nr-20-perguntas_respostas_nr_20.pdf",
      },
    ],
  },
  {
    codigo: "NR-21",
    titulo: "Trabalhos a Céu Aberto",
    descricao: "Diretrizes para proteção contra intempéries, condições sanitárias e alojamentos em locais de trabalho a céu aberto.",
    observacoes: [
      "Última modificação: Portaria MTE nº 2.037, de 15 de dezembro de 1999.",
    ],
    links: [
      {
        etiqueta: "Versão vigente",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/arquivos/normas-regulamentadoras/nr-21.pdf",
        destaque: true,
      },
    ],
  },
  {
    codigo: "NR-22",
    titulo: "Segurança e Saúde Ocupacional na Mineração",
    descricao: "Requisitos para gerenciamento de riscos, operação e proteção dos trabalhadores em atividades de mineração, com anexos técnicos.",
    observacoes: [
      "Última modificação: Portaria MTE nº 2.105, de 23 de dezembro de 2024.",
    ],
    links: [
      {
        etiqueta: "Versão vigente",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-22-atualizada-2024-iii.pdf",
        destaque: true,
      },
    ],
  },
  {
    codigo: "NR-23",
    titulo: "Proteção Contra Incêndios",
    descricao: "Medidas de prevenção, sinalização e resposta a emergências para controle de incêndios nos ambientes de trabalho.",
    observacoes: [
      "Última modificação: Portaria MTP nº 2.769, de 5 de setembro de 2022.",
    ],
    links: [
      {
        etiqueta: "Versão vigente",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/arquivos/normas-regulamentadoras/nr-23-atualizada-2022.pdf",
        destaque: true,
      },
    ],
  },
  {
    codigo: "NR-24",
    titulo: "Condições Sanitárias e de Conforto nos Locais de Trabalho",
    descricao: "Requisitos mínimos de higiene, instalações sanitárias, vestiários, refeitórios e alojamentos para garantir conforto aos trabalhadores.",
    observacoes: [
      "Última modificação: Portaria SEPRT nº 1.066, de 23 de setembro de 2019.",
    ],
    links: [
      {
        etiqueta: "Versão vigente",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/arquivos/normas-regulamentadoras/nr-24.pdf",
        destaque: true,
      },
    ],
  },
  {
    codigo: "NR-25",
    titulo: "Resíduos Industriais (revogada)",
    descricao: "Conteúdo histórico sobre gerenciamento de resíduos industriais. Norma revogada pela Portaria MTP nº 672/2021, com orientações atuais distribuídas em outras NRs e legislações ambientais.",
    observacoes: [
      "Revogada pela Portaria MTP nº 672, de 8 de novembro de 2021. Mantida para referência histórica.",
    ],
    links: [
      {
        etiqueta: "Informações oficiais",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/norma-regulamentadora-no-25-nr-25",
        destaque: true,
      },
    ],
  },
  {
    codigo: "NR-26",
    titulo: "Sinalização de Segurança",
    descricao: "Critérios de cores, rotulagem preventiva e fichas de segurança para comunicação visual de riscos nos locais de trabalho.",
    observacoes: [
      "Última modificação: Portaria MTP nº 2.770, de 5 de setembro de 2022.",
    ],
    links: [
      {
        etiqueta: "Versão vigente",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/arquivos/normas-regulamentadoras/nr-26-atualizada-2022.pdf",
        destaque: true,
      },
    ],
  },
  {
    codigo: "NR-27",
    titulo: "Registro Profissional do Técnico de Segurança do Trabalho (Revogada)",
    descricao: "Histórico sobre os procedimentos de registro profissional dos Técnicos de Segurança do Trabalho junto ao Ministério do Trabalho.",
    observacoes: [
      "Revogada pela Portaria MTE nº 262, de 30 de maio de 2008 (DOU de 30/05/2008).",
    ],
    links: [
      {
        etiqueta: "Versão histórica (revogada)",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/arquivos/normas-regulamentadoras/nr_27_revogada_2008.pdf",
      },
    ],
  },
  {
    codigo: "NR-28",
    titulo: "Fiscalização e Penalidades",
    descricao: "Procedimentos de inspeção do trabalho, critérios de autuação e gradação de penalidades aplicáveis às normas de SST.",
    observacoes: [
      "Última modificação: Portaria MTE nº 1.794, de 24 de outubro de 2024.",
    ],
    links: [
      {
        etiqueta: "Versão vigente",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-28-atualizada-2024-i.pdf",
        destaque: true,
      },
    ],
  },
  {
    codigo: "NR-29",
    titulo: "Segurança e Saúde no Trabalho Portuário",
    descricao: "Diretrizes de prevenção para operações portuárias, incluindo requisitos de equipamentos, capacitação e gestão de riscos no ambiente portuário.",
    observacoes: [
      "Última modificação: Portaria MTP nº 4.219, de 20 de dezembro de 2022.",
    ],
    links: [
      {
        etiqueta: "Versão vigente",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-29-atualizada-2023.pdf",
        destaque: true,
      },
      {
        etiqueta: "Guia boas práticas",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/arquivos/normas-regulamentadoras/NR29_GUIA_DE_BOAS_PRATICAS_PARA_TRABALHO_EM_ALTURAS_NAS_ATIVIDADES_PORTURIAS.pdf",
      },
      {
        etiqueta: "Manual usuário SESSTP",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/manual-do-usuario-sesstp-versao-1-0-publicar.pdf",
      },
    ],
  },
  {
    codigo: "NR-30",
    titulo: "Segurança e Saúde no Trabalho Aquaviário",
    descricao: "Requisitos de SST para embarcações marítimas e fluviais, abrangendo tripulações, instalações e operações a bordo.",
    observacoes: [
      "Última modificação: Portaria MTP nº 4.219, de 20 de dezembro de 2022.",
    ],
    links: [
      {
        etiqueta: "Versão vigente",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-30-atualizada-2023.pdf",
        destaque: true,
      },
    ],
  },
  {
    codigo: "NR-31",
    titulo: "Segurança e Saúde no Trabalho na Agricultura, Pecuária, Silvicultura, Exploração Florestal e Aquicultura",
    descricao: "Medidas de prevenção, gerenciamento de riscos e condições de trabalho para atividades rurais e agroindustriais.",
    observacoes: [
      "Última modificação: Portaria MTE nº 342, de 21 de março de 2024.",
    ],
    links: [
      {
        etiqueta: "Versão vigente",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-31-atualizada-2024-2.pdf",
        destaque: true,
      },
      {
        etiqueta: "Manual do usuário SESTR",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/manual-do-usuario-sestr-versao-11-10-2023-para-publicacao.pdf",
      },
    ],
  },
  {
    codigo: "NR-32",
    titulo: "Segurança e Saúde no Trabalho em Serviços de Saúde",
    descricao: "Medidas de proteção para trabalhadores da saúde, com foco em riscos biológicos, químicos, radiações e resíduos.",
    observacoes: [
      "Última modificação: Portaria MTP nº 4.219, de 20 de dezembro de 2022.",
    ],
    links: [
      {
        etiqueta: "Versão vigente",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-32-atualizada-2023-1.pdf",
        destaque: true,
      },
      {
        etiqueta: "Guia riscos biológicos",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/arquivos/normas-regulamentadoras/nr-32_guia_tecnico_de_riscos_biologicos_nr_32.pdf",
      },
    ],
  },
  {
    codigo: "NR-33",
    titulo: "Segurança e Saúde no Trabalho em Espaços Confinados",
    descricao: "Procedimentos de identificação, avaliação, controle e resposta a emergências em espaços confinados.",
    observacoes: [
      "Última modificação: Portaria SEPRT nº 1.690, de 15 de junho de 2022 (retificada em 28/07/2022).",
    ],
    links: [
      {
        etiqueta: "Versão vigente",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/arquivos/normas-regulamentadoras/nr-33-atualizada-2022-_retificada.pdf",
        destaque: true,
      },
      {
        etiqueta: "Guia técnico",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/arquivos/normas-regulamentadoras/nr-33_guia_tecnico_da_nr_33.pdf",
      },
    ],
  },
  {
    codigo: "NR-34",
    titulo: "Condições e Meio Ambiente de Trabalho na Indústria da Construção, Reparação e Desmonte Naval",
    descricao: "Requisitos de segurança para atividades em estaleiros, incluindo soldagem, corte, montagem e operações em embarcações.",
    observacoes: [
      "Última modificação: Portaria MTP nº 4.219, de 20 de dezembro de 2022.",
    ],
    links: [
      {
        etiqueta: "Versão vigente",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-34-atualizada-2023-2.pdf",
        destaque: true,
      },
    ],
  },
  {
    codigo: "NR-35",
    titulo: "Trabalho em Altura",
    descricao: "Planejamento, organização e execução segura de atividades acima de 2 metros, incluindo capacitação, equipamentos e procedimentos de emergência.",
    observacoes: [
      "Última modificação: Portaria MTE nº 1.680, de 2 de outubro de 2025.",
    ],
    links: [
      {
        etiqueta: "Versão vigente",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-35-atualizada-2025.pdf",
        destaque: true,
      },
      {
        etiqueta: "Manual consolidado",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/manuais-e-publicacoes/manual_consolidado_da_nr_35.pdf",
      },
    ],
  },
  {
    codigo: "NR-36",
    titulo: "Segurança e Saúde no Trabalho no Abate e Processamento de Carnes e Derivados",
    descricao: "Requisitos ergonômicos, organizacionais e de proteção coletiva para frigoríficos e unidades de processamento de carnes.",
    observacoes: [
      "Última modificação: Portaria MTE nº 1.065, de 1º de julho de 2024.",
    ],
    links: [
      {
        etiqueta: "Versão vigente",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-36-atualizada-2024-1.pdf",
        destaque: true,
      },
      {
        etiqueta: "Manual interpretação",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/arquivos/normas-regulamentadoras/nr-36_manual_nr_36_compilado.pdf",
      },
    ],
  },
  {
    codigo: "NR-37",
    titulo: "Segurança e Saúde em Plataformas de Petróleo",
    descricao: "Requisitos de SST, vivência a bordo e gestão de emergências para plataformas e unidades de manutenção em águas jurisdicionais brasileiras.",
    observacoes: [
      "Última modificação: Portaria MTP nº 4.219, de 20 de dezembro de 2022.",
    ],
    links: [
      {
        etiqueta: "Versão vigente",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/seguranca-e-saude-no-trabalho/ctpp-nrs/nr-37-atualizada-2023.pdf",
        destaque: true,
      },
      {
        etiqueta: "Manual registro SESMT PP",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/seguranca-e-saude-no-trabalho/ctpp-nrs/manual-do-usuario-registro-de-sesmt-pp-publicar.pdf",
      },
    ],
  },
  {
    codigo: "NR-38",
    titulo: "Segurança e Saúde no Trabalho na Limpeza Urbana e Manejo de Resíduos Sólidos",
    descricao: "Diretrizes de prevenção para coleta, transporte, triagem e destinação de resíduos sólidos urbanos, com ênfase em ergonomia, biossegurança e gestão de riscos.",
    observacoes: [
      "Última modificação: Portaria MTE nº 1.065, de 1º de julho de 2024 (vigência consolidada em 2025).",
    ],
    links: [
      {
        etiqueta: "Versão vigente",
        url: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-38-atualizada-2025-3.pdf",
        destaque: true,
      },
    ],
  },
  {
    codigo: "NHO 01",
    titulo: "Avaliação da exposição ocupacional ao ruído",
    descricao: "Procedimento técnico para medições integradoras de ruído, cálculo de dose sonora e definição do tempo de exposição permitido.",
    url: "http://arquivosbiblioteca.fundacentro.gov.br/exlibris/aleph/a23_1/apache_media/A5RGFHYSQ5TA7P816K7QPT4AB9KDFP.pdf",
  },
  {
    codigo: "NHO 02",
    titulo: "Análise qualitativa da fração volátil (vapores orgânicos)",
    descricao: "Nota oficial: norma em revisão; versão atualizada será publicada após conclusão dos trabalhos técnicos.",
    url: "http://arquivosbiblioteca.fundacentro.gov.br/exlibris/aleph/a23_1/apache_media/S5HNYKPE45RQCDMGXJ73JNCRKGDY41.pdf",
  },
  {
    codigo: "NHO 03",
    titulo: "Análise gravimétrica de aerodispersóides sólidos",
    descricao: "Método de ensaio para quantificação de partículas coletadas sobre filtros de membrana em avaliações de higiene ocupacional.",
    url: "http://arquivosbiblioteca.fundacentro.gov.br/exlibris/aleph/a23_1/apache_media/F54LD4NBJ1FEA9J36JM9DECLBJ4UMS.pdf",
  },
  {
    codigo: "NHO 04",
    titulo: "Coleta e análise de fibras de amianto",
    descricao: "Procedimento para amostragem e contagem de fibras respiráveis por microscopia óptica de contraste de fase em ambientes de trabalho.",
    url: "http://arquivosbiblioteca.fundacentro.gov.br/exlibris/aleph/a23_1/apache_media/BJKMGEIP1CYHUEDMM9Q3JK4DHXAL24.pdf",
  },
  {
    codigo: "NHO 05",
    titulo: "Avaliação da exposição ocupacional aos raios X",
    descricao: "Procedimento técnico para levantamento radiométrico e determinação da dose equivalente em serviços de radiologia diagnóstica.",
    url: "http://arquivosbiblioteca.fundacentro.gov.br/exlibris/aleph/a23_1/apache_media/9JFIF3EK2XQT5TDIC4P3B67CHKQK4M.pdf",
  },
  {
    codigo: "NHO 06",
    titulo: "Avaliação da exposição ocupacional ao calor (3ª ed., 2025)",
    descricao: "Procedimento técnico revisado para cálculo do IBUTG, análise de taxa metabólica e definição de limites de exposição ao calor em ambientes internos ou externos.",
    url: "http://arquivosbiblioteca.fundacentro.gov.br/exlibris/aleph/a23_1/apache_media/7DSKT5D4SHH4FVGY2MHH6UYBV5CX5L.pdf",
  },
  {
    codigo: "NHO 07",
    titulo: "Avaliação da exposição a vibração de mãos e braços",
    descricao: "Procedimento técnico para determinação da aceleração equivalente de vibrações transmitidas a segmentos de membros superiores.",
    url: "http://arquivosbiblioteca.fundacentro.gov.br/exlibris/aleph/a23_1/apache_media/C187BQUBSQU4RF4SMFG8AYG5D76526.pdf",
  },
  {
    codigo: "NHO 08",
    titulo: "Avaliação da exposição a vibrações locais",
    descricao: "Diretrizes para medições de vibrações localizadas geradas por ferramentas e equipamentos portáteis de uso manual.",
    url: "http://arquivosbiblioteca.fundacentro.gov.br/exlibris/aleph/a23_1/apache_media/4QQHR2N9RV6C5RVMED6993BHNLG9P3.pdf",
  },
  {
    codigo: "NHO 09",
    titulo: "Avaliação da exposição a radiações ópticas não ionizantes",
    descricao: "Procedimento técnico para caracterização e controle de radiações ultravioleta, visível e infravermelha em ambientes ocupacionais.",
    url: "http://arquivosbiblioteca.fundacentro.gov.br/exlibris/aleph/a23_1/apache_media/3X1GPGJ77HRGRNDFIDSR4M18G4LE1S.pdf",
  },
  {
    codigo: "NHO 10",
    titulo: "Avaliação da exposição a radiações ionizantes",
    descricao: "Diretrizes para monitoramento ambiental e pessoal em atividades com fontes de radiação ionizante em ambientes de trabalho.",
    url: "http://arquivosbiblioteca.fundacentro.gov.br/exlibris/aleph/a23_1/apache_media/AQPLEUS9PB3GF9CJH8H9F3HG9U2V6C.pdf",
  },
  {
    codigo: "NHO 11",
    titulo: "Iluminância em ambientes de trabalho",
    descricao: "Procedimento técnico para avaliação de níveis de iluminância, uniformidade e ofuscamento em postos de trabalho internos.",
    url: "http://arquivosbiblioteca.fundacentro.gov.br/exlibris/aleph/a23_1/apache_media/33PMBTUV2X3HFYSPGQFENQ6VSHA35H.pdf",
  },
];

const referenciasFundacentro: ReferenciaFundacentro[] = [
  {
    codigo: "NHO 01",
    titulo: "Avaliação da exposição ocupacional ao ruído",
    descricao: "Procedimento técnico para medições integradoras de ruído, cálculo de dose sonora e definição do tempo de exposição permitido.",
    url: "http://arquivosbiblioteca.fundacentro.gov.br/exlibris/aleph/a23_1/apache_media/A5RGFHYSQ5TA7P816K7QPT4AB9KDFP.pdf",
  },
  {
    codigo: "NHO 02",
    titulo: "Análise qualitativa da fração volátil (vapores orgânicos)",
    descricao: "Nota oficial: norma em revisão; versão atualizada será publicada após conclusão dos trabalhos técnicos.",
    url: "http://arquivosbiblioteca.fundacentro.gov.br/exlibris/aleph/a23_1/apache_media/S5HNYKPE45RQCDMGXJ73JNCRKGDY41.pdf",
  },
  {
    codigo: "NHO 03",
    titulo: "Análise gravimétrica de aerodispersóides sólidos",
    descricao: "Método de ensaio para quantificação de partículas coletadas sobre filtros de membrana em avaliações de higiene ocupacional.",
    url: "http://arquivosbiblioteca.fundacentro.gov.br/exlibris/aleph/a23_1/apache_media/F54LD4NBJ1FEA9J36JM9DECLBJ4UMS.pdf",
  },
  {
    codigo: "NHO 04",
    titulo: "Coleta e análise de fibras de amianto",
    descricao: "Procedimento para amostragem e contagem de fibras respiráveis por microscopia óptica de contraste de fase em ambientes de trabalho.",
    url: "http://arquivosbiblioteca.fundacentro.gov.br/exlibris/aleph/a23_1/apache_media/BJKMGEIP1CYHUEDMM9Q3JK4DHXAL24.pdf",
  },
  {
    codigo: "NHO 05",
    titulo: "Avaliação da exposição ocupacional aos raios X",
    descricao: "Procedimento técnico para levantamento radiométrico e determinação da dose equivalente em serviços de radiologia diagnóstica.",
    url: "http://arquivosbiblioteca.fundacentro.gov.br/exlibris/aleph/a23_1/apache_media/9JFIF3EK2XQT5TDIC4P3B67CHKQK4M.pdf",
  },
  {
    codigo: "NHO 06",
    titulo: "Avaliação da exposição ocupacional ao calor (3ª ed., 2025)",
    descricao: "Procedimento técnico revisado para cálculo do IBUTG, análise de taxa metabólica e definição de limites de exposição ao calor em ambientes internos ou externos.",
    url: "http://arquivosbiblioteca.fundacentro.gov.br/exlibris/aleph/a23_1/apache_media/7DSKT5D4SHH4FVGY2MHH6UYBV5CX5L.pdf",
  },
  {
    codigo: "NHO 07",
    titulo: "Avaliação da exposição a vibração de mãos e braços",
    descricao: "Procedimento técnico para determinação da aceleração equivalente de vibrações transmitidas a segmentos de membros superiores.",
    url: "http://arquivosbiblioteca.fundacentro.gov.br/exlibris/aleph/a23_1/apache_media/C187BQUBSQU4RF4SMFG8AYG5D76526.pdf",
  },
  {
    codigo: "NHO 08",
    titulo: "Avaliação da exposição a vibrações locais",
    descricao: "Diretrizes para medições de vibrações localizadas geradas por ferramentas e equipamentos portáteis de uso manual.",
    url: "http://arquivosbiblioteca.fundacentro.gov.br/exlibris/aleph/a23_1/apache_media/4QQHR2N9RV6C5RVMED6993BHNLG9P3.pdf",
  },
  {
    codigo: "NHO 09",
    titulo: "Avaliação da exposição a radiações ópticas não ionizantes",
    descricao: "Procedimento técnico para caracterização e controle de radiações ultravioleta, visível e infravermelha em ambientes ocupacionais.",
    url: "http://arquivosbiblioteca.fundacentro.gov.br/exlibris/aleph/a23_1/apache_media/3X1GPGJ77HRGRNDFIDSR4M18G4LE1S.pdf",
  },
  {
    codigo: "NHO 10",
    titulo: "Avaliação da exposição a radiações ionizantes",
    descricao: "Diretrizes para monitoramento ambiental e pessoal em atividades com fontes de radiação ionizante em ambientes de trabalho.",
    url: "http://arquivosbiblioteca.fundacentro.gov.br/exlibris/aleph/a23_1/apache_media/AQPLEUS9PB3GF9CJH8H9F3HG9U2V6C.pdf",
  },
  {
    codigo: "NHO 11",
    titulo: "Iluminância em ambientes de trabalho",
    descricao: "Procedimento técnico para avaliação de níveis de iluminância, uniformidade e ofuscamento em postos de trabalho internos.",
    url: "http://arquivosbiblioteca.fundacentro.gov.br/exlibris/aleph/a23_1/apache_media/33PMBTUV2X3HFYSPGQFENQ6VSHA35H.pdf",
  },
];

type SecaoAcervo = "normas-regulamentadoras" | "normas-seguranca" | "ebooks-instrucao" | "materiais-apoio";

const secoesAcervoMenu: { id: SecaoAcervo; titulo: string; descricao: string; icon: LucideIcon }[] = [
  {
    id: "normas-regulamentadoras",
    titulo: "Normas Regulamentadoras",
    descricao: "Consulta completa às NRs oficiais atualizadas.",
    icon: BookOpen,
  },
  {
    id: "normas-seguranca",
    titulo: "Referências Fundacentro",
    descricao: "Coleção de publicações técnicas e guias da Fundacentro.",
    icon: Shield,
  },
  {
    id: "ebooks-instrucao",
    titulo: "Ebooks de Instrução",
    descricao: "Guias didáticos para treinamentos internos.",
    icon: GraduationCap,
  },
  {
    id: "materiais-apoio",
    titulo: "Material de Apoio",
    descricao: "Checklists, formulários e ferramentas do dia a dia.",
    icon: LifeBuoy,
  },
];


export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [now, setNow] = useState(() => new Date());
  const [anotacoes, setAnotacoes] = useState<Nota[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = window.localStorage.getItem(HOME_NOTAS_STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed as Nota[];
    } catch (error) {
      console.error("[Home] Erro ao carregar anotações:", error);
      return [];
    }
  });
  const [notaTitulo, setNotaTitulo] = useState("");
  const [notaDescricao, setNotaDescricao] = useState("");
  const [notaPrioridade, setNotaPrioridade] = useState<NotaPrioridade>("media");
  const [filtroNotas, setFiltroNotas] = useState<"todas" | NotaPrioridade>("todas");
  const [rotinas, setRotinas] = useState<Rotina[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = window.localStorage.getItem(HOME_ROTINAS_STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed as Rotina[];
    } catch (error) {
      console.error("[Home] Erro ao carregar rotinas:", error);
      return [];
    }
  });
  const [rotinaTitulo, setRotinaTitulo] = useState("");
  const [rotinaDescricao, setRotinaDescricao] = useState("");
  const [rotinaData, setRotinaData] = useState("");
  const [rotinaHora, setRotinaHora] = useState("");
  const [rotinaRecorrencia, setRotinaRecorrencia] = useState<Recorrencia>("unica");
  const [filtroRecorrencia, setFiltroRecorrencia] = useState<"todas" | Recorrencia>("todas");
  const [secaoAcervoSelecionada, setSecaoAcervoSelecionada] = useState<SecaoAcervo>("normas-regulamentadoras");

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(HOME_NOTAS_STORAGE_KEY, JSON.stringify(anotacoes));
  }, [anotacoes]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(HOME_ROTINAS_STORAGE_KEY, JSON.stringify(rotinas));
  }, [rotinas]);

  const primeiroNome = useMemo(() => {
    if (!user?.name) return "Usuário";
    const [first] = user.name.trim().split(" ");
    return first || user.name;
  }, [user?.name]);

  const saudacao = useMemo(() => {
    const hora = now.getHours();
    if (hora < 12) return "Bom dia";
    if (hora < 18) return "Boa tarde";
    return "Boa noite";
  }, [now]);

  const dataCompleta = useMemo(() => {
    const texto = new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(now);
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }, [now]);

  const horaAtual = useMemo(() => {
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(now);
  }, [now]);

  const infoSecaoAcervo = useMemo(() => {
    return secoesAcervoMenu.find((secao) => secao.id === secaoAcervoSelecionada) ?? secoesAcervoMenu[0];
  }, [secaoAcervoSelecionada]);


  const notasFiltradas = useMemo(() => {
    const base =
      filtroNotas === "todas"
        ? anotacoes
        : anotacoes.filter((nota) => nota.prioridade === filtroNotas);
    return [...base].sort((a, b) => {
      if (prioridadePeso[a.prioridade] === prioridadePeso[b.prioridade]) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return prioridadePeso[a.prioridade] - prioridadePeso[b.prioridade];
    });
  }, [anotacoes, filtroNotas]);

  const contagemNotas = useMemo(() => {
    const totais = {
      total: anotacoes.length,
      alta: 0,
      media: 0,
      baixa: 0,
    };

    anotacoes.forEach((nota) => {
      totais[nota.prioridade] += 1;
    });

    return totais;
  }, [anotacoes]);

  const contagemRotinas = useMemo(() => {
    const totais = {
      total: rotinas.length,
      unica: 0,
      diaria: 0,
      semanal: 0,
      mensal: 0,
    } as Record<"total" | Recorrencia, number>;

    rotinas.forEach((rotina) => {
      totais[rotina.recorrencia] += 1;
    });

    return totais;
  }, [rotinas]);

  const handleAdicionarNota = () => {
    if (!notaTitulo.trim() && !notaDescricao.trim()) {
      toast.error("Informe ao menos um título ou descrição para a anotação.");
      return;
    }

    const novaNota: Nota = {
      id: nanoid(),
      titulo: notaTitulo.trim() || "Anotação sem título",
      descricao: notaDescricao.trim(),
      prioridade: notaPrioridade,
      createdAt: new Date().toISOString(),
    };

    setAnotacoes((prev) => [novaNota, ...prev]);
    setNotaTitulo("");
    setNotaDescricao("");
    setNotaPrioridade("media");
  };

  const handleRemoverNota = (id: string) => {
    setAnotacoes((prev) => prev.filter((nota) => nota.id !== id));
  };

  const rotinasOrdenadas = useMemo(() => {
    const lista =
      filtroRecorrencia === "todas"
        ? rotinas
        : rotinas.filter((rotina) => rotina.recorrencia === filtroRecorrencia);

    return [...lista].sort((a, b) => {
      const dataHoraA = new Date(`${a.data || "1970-01-01"}T${a.hora || "00:00"}:00`).getTime();
      const dataHoraB = new Date(`${b.data || "1970-01-01"}T${b.hora || "00:00"}:00`).getTime();
      if (dataHoraA === dataHoraB) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return dataHoraA - dataHoraB;
    });
  }, [rotinas, filtroRecorrencia]);

  const formatoDataCurta = (dataStr: string) => {
    if (!dataStr) return "Sem data";
    const data = new Date(dataStr);
    if (Number.isNaN(data.getTime())) return "Sem data";
    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleAdicionarRotina = () => {
    if (!rotinaTitulo.trim()) {
      toast.error("Defina um título para a rotina.");
      return;
    }

    const novaRotina: Rotina = {
      id: nanoid(),
      titulo: rotinaTitulo.trim(),
      descricao: rotinaDescricao.trim(),
      data: rotinaData,
      hora: rotinaHora,
      recorrencia: rotinaRecorrencia,
      createdAt: new Date().toISOString(),
    };

    setRotinas((prev) => [novaRotina, ...prev]);
    setRotinaTitulo("");
    setRotinaDescricao("");
    setRotinaData("");
    setRotinaHora("");
    setRotinaRecorrencia("unica");
  };

  const handleRemoverRotina = (id: string) => {
    setRotinas((prev) => prev.filter((rotina) => rotina.id !== id));
  };

  const normasDisponiveis = useMemo(() => normasRegulamentadoras, []);
  const totalNormas = useMemo(() => normasDisponiveis.length, [normasDisponiveis]);
  const referenciasDisponiveis = useMemo(() => referenciasFundacentro, []);
  const totalReferenciasFundacentro = useMemo(() => referenciasDisponiveis.length, [referenciasDisponiveis]);

  const resumoSecaoAcervo = useMemo(() => {
    switch (secaoAcervoSelecionada) {
      case "normas-regulamentadoras":
        return { label: "Total de NRs", value: totalNormas.toString() };
      case "normas-seguranca":
        return { label: "Referências", value: totalReferenciasFundacentro.toString() };
      case "ebooks-instrucao":
        return { label: "Status", value: "Em construção" };
      case "materiais-apoio":
        return { label: "Status", value: "Em construção" };
      default:
        return { label: "Status", value: "Em construção" };
    }
  }, [secaoAcervoSelecionada, totalNormas, totalReferenciasFundacentro]);

  return (
    <DashboardLayout>
      <div className="relative -m-4 min-h-screen px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="absolute bottom-[-180px] right-[-120px] h-[360px] w-[360px] rounded-full bg-blue-400/20 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,118,215,0.08),_transparent_60%)]" />
        </div>

        <div className="mx-auto flex max-w-6xl flex-col gap-10">
          <section className="relative overflow-hidden rounded-[32px] border border-white/20 bg-gradient-to-r from-sky-600 via-sky-500 to-blue-500 text-white shadow-2xl shadow-sky-900/30">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_60%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0)_55%)]" />
            <div className="relative z-10 flex flex-col gap-8 p-8 lg:p-12">
              <div className="flex flex-col gap-3">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
                  <Sparkles className="h-3.5 w-3.5" />
                  {saudacao}, {primeiroNome}
                </span>
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl">
                  Seu hub inteligente para Segurança &amp; Saúde do Trabalho
                </h1>
                <p className="max-w-2xl text-base text-slate-100/90 md:text-lg">
                  Conecte tarefas essenciais, monitore compromissos críticos e mantenha a equipe alinhada com uma visão clara das prioridades do dia.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 text-sm font-medium">
                <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/15 px-4 py-2 backdrop-blur">
                  <CalendarDays className="h-4 w-4" />
                  <span>{dataCompleta}</span>
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/15 px-4 py-2 backdrop-blur">
                  <Clock className="h-4 w-4" />
                  <span>{horaAtual}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
                  {[
                    {
                      label: "Organize prioridades",
                      description: "Anote pontos críticos e mantenha a equipe informada.",
                    },
                    {
                      label: "Programe rotinas",
                      description: "Agende checklists, inspeções e treinamentos.",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="group rounded-2xl border border-white/15 bg-white/10 p-4 transition hover:bg-white/15"
                    >
                      <p className="text-sm font-semibold text-white">{item.label}</p>
                      <p className="mt-1 text-xs text-white/80">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <Card className="rounded-[28px] border border-slate-200/80 bg-white/95 shadow-xl shadow-sky-100/60 backdrop-blur">
            <CardHeader>
              <div className="flex flex-col gap-1">
                <CardTitle className="text-xl font-semibold text-slate-900">Anotações de prioridades</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Registre pontos críticos, organize planos de ação por prioridade e mantenha o time sincronizado.
                </p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-4">
                {[
                  {
                    label: "Total",
                    valor: contagemNotas.total,
                    destaque: "border-transparent bg-slate-900 text-white shadow-lg shadow-slate-900/20",
                    legenda: "Todas as anotações",
                  },
                  {
                    label: "Alta",
                    valor: contagemNotas.alta,
                    destaque: "border-red-200 bg-red-50 text-red-700",
                    legenda: "Prioridade crítica",
                  },
                  {
                    label: "Média",
                    valor: contagemNotas.media,
                    destaque: "border-amber-200 bg-amber-50 text-amber-700",
                    legenda: "Acompanhar em breve",
                  },
                  {
                    label: "Baixa",
                    valor: contagemNotas.baixa,
                    destaque: "border-emerald-200 bg-emerald-50 text-emerald-700",
                    legenda: "Monitorar quando possível",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={cn(
                      "flex flex-col gap-1 rounded-2xl border p-4 text-sm shadow-sm transition",
                      item.destaque
                    )}
                  >
                    <span
                      className={cn(
                        "text-xs font-medium uppercase tracking-wide",
                        item.label === "Total" ? "text-slate-100/80" : "text-muted-foreground"
                      )}
                    >
                      {item.label}
                    </span>
                    <span className="text-2xl font-semibold">{item.valor}</span>
                    <span
                      className={cn(
                        "text-[11px] font-medium",
                        item.label === "Total" ? "text-slate-200/80" : "text-muted-foreground/80"
                      )}
                    >
                      {item.legenda}
                    </span>
                  </div>
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid gap-6 md:grid-cols-[minmax(0,320px)_1fr]">
                <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-5 shadow-inner">
                  <div className="space-y-1.5">
                    <Label htmlFor="notaTitulo">Título</Label>
                    <Input
                      id="notaTitulo"
                      placeholder="Ex.: Renovar ASO periódico do setor X"
                      value={notaTitulo}
                      onChange={(e) => setNotaTitulo(e.target.value)}
                      className="rounded-2xl border-slate-200 bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="notaPrioridade">Prioridade</Label>
                    <Select value={notaPrioridade} onValueChange={(value) => setNotaPrioridade(value as NotaPrioridade)}>
                      <SelectTrigger id="notaPrioridade" className="rounded-2xl border-slate-200 bg-white">
                        <SelectValue placeholder="Defina a prioridade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alta">Alta prioridade</SelectItem>
                        <SelectItem value="media">Prioridade média</SelectItem>
                        <SelectItem value="baixa">Prioridade baixa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="notaDescricao">Descrição</Label>
                    <Textarea
                      id="notaDescricao"
                      placeholder="Detalhe próximos passos, responsáveis ou datas importantes."
                      value={notaDescricao}
                      onChange={(e) => setNotaDescricao(e.target.value)}
                      rows={4}
                      className="rounded-2xl border-slate-200 bg-white"
                    />
                  </div>

                  <Button onClick={handleAdicionarNota} className="w-full rounded-2xl">
                    Adicionar anotação
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "todas" as const, label: "Todas" },
                      { id: "alta" as const, label: "Alta" },
                      { id: "media" as const, label: "Média" },
                      { id: "baixa" as const, label: "Baixa" },
                    ].map((opcao) => (
                      <Button
                        key={opcao.id}
                        size="sm"
                        variant={filtroNotas === opcao.id ? "default" : "outline"}
                        className={cn(
                          "rounded-full",
                          opcao.id !== "todas" && filtroNotas === opcao.id
                            ? prioridadeEstilos[opcao.id].badgeClass
                            : "border-slate-200"
                        )}
                        onClick={() => setFiltroNotas(opcao.id)}
                      >
                        {opcao.label}
                      </Button>
                    ))}
                  </div>

                  <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2">
                    {notasFiltradas.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-6 text-center text-sm text-slate-500">
                        Nenhuma anotação criada ainda. Use o formulário para planejar suas próximas ações.
                      </div>
                    ) : (
                      notasFiltradas.map((nota) => {
                        const dataCriacao = (() => {
                          const data = new Date(nota.createdAt);
                          if (Number.isNaN(data.getTime())) return "-";
                          return data.toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          });
                        })();

                        return (
                          <div
                            key={nota.id}
                            className={cn(
                              "relative overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg",
                              prioridadeEstilos[nota.prioridade].containerClass,
                              "max-w-2xl"
                            )}
                          >
                            <div className="absolute inset-y-0 left-0 w-1 rounded-2xl bg-gradient-to-b from-sky-400/70 via-sky-300/40 to-transparent" />
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={cn("h-2.5 w-2.5 rounded-full", prioridadeEstilos[nota.prioridade].dotClass)}
                                  />
                                  <h3 className="text-sm font-semibold text-foreground">{nota.titulo}</h3>
                                </div>
                                <Badge className={cn("w-fit", prioridadeEstilos[nota.prioridade].badgeClass)}>
                                  {prioridadeEstilos[nota.prioridade].label}
                                </Badge>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                                onClick={() => handleRemoverNota(nota.id)}
                                title="Remover anotação"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            {nota.descricao && (
                              <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">{nota.descricao}</p>
                            )}

                            <p className="mt-4 text-xs font-medium text-muted-foreground/90">Criada em {dataCriacao}</p>
    </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border border-slate-200/80 bg-white/95 shadow-xl shadow-sky-100/60 backdrop-blur">
            <CardHeader>
              <div className="flex flex-col gap-1">
                <CardTitle className="text-xl font-semibold text-slate-900">Rotina de trabalho &amp; programações</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Estruture cronogramas, defina recorrências e mantenha as entregas de SST sempre em dia.
                </p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-5">
                {[
                  {
                    label: "Total",
                    valor: contagemRotinas.total,
                    destaque: "border-transparent bg-slate-900 text-white shadow-lg shadow-slate-900/20",
                    legenda: "Todas as rotinas",
                  },
                  {
                    label: "Única",
                    valor: contagemRotinas.unica,
                    destaque: "border-slate-200 bg-slate-50 text-slate-700",
                    legenda: "Programação pontual",
                  },
                  {
                    label: "Diária",
                    valor: contagemRotinas.diaria,
                    destaque: "border-sky-200 bg-sky-50 text-sky-700",
                    legenda: "Execução recorrente",
                  },
                  {
                    label: "Semanal",
                    valor: contagemRotinas.semanal,
                    destaque: "border-indigo-200 bg-indigo-50 text-indigo-700",
                    legenda: "Checklists semanais",
                  },
                  {
                    label: "Mensal",
                    valor: contagemRotinas.mensal,
                    destaque: "border-purple-200 bg-purple-50 text-purple-700",
                    legenda: "Processos mensais",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={cn(
                      "flex flex-col gap-1 rounded-2xl border p-4 text-sm shadow-sm transition",
                      item.destaque
                    )}
                  >
                    <span
                      className={cn(
                        "text-xs font-medium uppercase tracking-wide",
                        item.label === "Total" ? "text-slate-100/80" : "text-muted-foreground"
                      )}
                    >
                      {item.label}
                    </span>
                    <span className="text-2xl font-semibold">{item.valor}</span>
                    <span
                      className={cn(
                        "text-[11px] font-medium",
                        item.label === "Total" ? "text-slate-200/80" : "text-muted-foreground/80"
                      )}
                    >
                      {item.legenda}
                    </span>
                  </div>
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid gap-6 md:grid-cols-[minmax(0,340px)_1fr]">
                <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-5 shadow-inner">
                  <div className="space-y-1.5">
                    <Label htmlFor="rotinaTitulo">Título</Label>
                    <Input
                      id="rotinaTitulo"
                      placeholder="Ex.: Checklist de inspeção semanal"
                      value={rotinaTitulo}
                      onChange={(e) => setRotinaTitulo(e.target.value)}
                      className="rounded-2xl border-slate-200 bg-white"
                    />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="rotinaData">Data inicial</Label>
                      <Input
                        id="rotinaData"
                        type="date"
                        value={rotinaData}
                        onChange={(e) => setRotinaData(e.target.value)}
                        className="rounded-2xl border-slate-200 bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="rotinaHora">Horário</Label>
                      <Input
                        id="rotinaHora"
                        type="time"
                        value={rotinaHora}
                        onChange={(e) => setRotinaHora(e.target.value)}
                        className="rounded-2xl border-slate-200 bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="rotinaRecorrencia">Recorrência</Label>
                    <Select value={rotinaRecorrencia} onValueChange={(value) => setRotinaRecorrencia(value as Recorrencia)}>
                      <SelectTrigger id="rotinaRecorrencia" className="rounded-2xl border-slate-200 bg-white">
                        <SelectValue placeholder="Periodicidade das atividades" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unica">Única</SelectItem>
                        <SelectItem value="diaria">Diária</SelectItem>
                        <SelectItem value="semanal">Semanal</SelectItem>
                        <SelectItem value="mensal">Mensal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="rotinaDescricao">Detalhes</Label>
                    <Textarea
                      id="rotinaDescricao"
                      placeholder="Inclua checklist de tarefas, responsáveis ou documentos necessários."
                      value={rotinaDescricao}
                      onChange={(e) => setRotinaDescricao(e.target.value)}
                      rows={4}
                      className="rounded-2xl border-slate-200 bg-white"
                    />
                  </div>

                  <Button onClick={handleAdicionarRotina} className="w-full rounded-2xl">
                    Registrar programação
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "todas" as const, label: "Todas" },
                      { id: "unica" as const, label: "Única" },
                      { id: "diaria" as const, label: "Diária" },
                      { id: "semanal" as const, label: "Semanal" },
                      { id: "mensal" as const, label: "Mensal" },
                    ].map((opcao) => (
                      <Button
                        key={opcao.id}
                        size="sm"
                        variant={filtroRecorrencia === opcao.id ? "default" : "outline"}
                        className="rounded-full border-slate-200"
                        onClick={() => setFiltroRecorrencia(opcao.id)}
                      >
                        {opcao.label}
                      </Button>
                    ))}
                  </div>

                  <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2">
                    {rotinasOrdenadas.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-6 text-center text-sm text-slate-500">
                        Nenhuma programação registrada. Cadastre rotinas para estruturar o fluxo de trabalho.
                      </div>
                    ) : (
                      rotinasOrdenadas.map((rotina) => (
                        <div
                          key={rotina.id}
                          className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg max-w-2xl"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                <ListChecks className="h-4 w-4 text-sky-600" />
                                {rotina.titulo}
                              </div>
                              <Badge variant="outline" className="flex items-center gap-1 rounded-full border-sky-200 bg-sky-50 text-sky-700">
                                <Repeat className="h-3.5 w-3.5" />
                                {recorrenciaLabels[rotina.recorrencia]}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                              onClick={() => handleRemoverRotina(rotina.id)}
                              title="Remover programação"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                              <Calendar className="h-3.5 w-3.5 text-slate-600" />
                              {formatoDataCurta(rotina.data)}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                              <Clock className="h-3.5 w-3.5 text-slate-600" />
                              {rotina.hora || "Sem horário"}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                              Criada em {new Date(rotina.createdAt).toLocaleString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          {rotina.descricao && (
                            <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">{rotina.descricao}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border border-slate-200/70 bg-white/95 shadow-xl shadow-sky-100/60 backdrop-blur">
            <CardHeader>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                    <BookOpen className="h-3.5 w-3.5" />
                    Acervo técnico
                  </span>
                  <h2 className="text-2xl font-semibold text-slate-900 md:text-3xl">
                    {infoSecaoAcervo.titulo}
                  </h2>
                  <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
                    {infoSecaoAcervo.descricao}
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-right shadow-inner">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {resumoSecaoAcervo.label}
                  </span>
                  <p className="text-3xl font-semibold text-slate-900">{resumoSecaoAcervo.value}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {secoesAcervoMenu.map((secao) => {
                  const Icon = secao.icon;
                  const ativa = secao.id === secaoAcervoSelecionada;
                  return (
                    <button
                      key={secao.id}
                      type="button"
                      onClick={() => setSecaoAcervoSelecionada(secao.id)}
                      className={cn(
                        "group flex h-full flex-col rounded-3xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg",
                        ativa ? "border-sky-400 bg-sky-50/80" : "border-slate-200 bg-white/95"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600",
                            ativa && "bg-sky-500 text-white"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className={cn("text-xs font-semibold uppercase tracking-wide", ativa ? "text-sky-600" : "text-slate-400")}>Selecionar</span>
                      </div>
                      <div className="mt-4 space-y-2">
                        <p className="text-base font-semibold text-slate-900">{secao.titulo}</p>
                        <p className="text-sm text-muted-foreground">{secao.descricao}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {secaoAcervoSelecionada === "normas-regulamentadoras" ? (
                <div className="grid gap-3">
                  {normasDisponiveis.map((norma) => {
                    const cardContainerClass = "flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg";
                    const botoesClasse = "flex flex-wrap items-center gap-2 justify-start";
                    return (
                      <div
                        key={norma.codigo}
                        className={cardContainerClass}
                      >
                        <div className="space-y-2">
                          <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700">
                            {norma.codigo}
                          </span>
                          <h3 className="text-base font-semibold text-slate-900">{norma.titulo}</h3>
                          <p className="text-sm text-muted-foreground">{norma.descricao}</p>
                          {norma.observacoes && norma.observacoes.length > 0 && (
                            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                              {norma.observacoes.map((texto, index) => (
                                <li key={index} className="flex gap-2">
                                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                                  <span>{texto}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        {norma.links && norma.links.length > 0 ? (
                          norma.codigo === "NR-15" ? (
                            <div className="flex w-full flex-col gap-2 mt-2">
                              <div className="flex flex-wrap items-center gap-2">
                                {norma.links.slice(0, 7).map((link) => (
                                  <Button
                                    key={link.url}
                                    asChild
                                    variant={link.destaque ? "default" : "outline"}
                                    className={cn(
                                      "h-10 rounded-2xl px-4",
                                      link.destaque
                                        ? "bg-sky-600 text-white shadow-sky-900/10 hover:-translate-y-0.5 hover:bg-sky-500"
                                        : "border-slate-300 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-sky-300 hover:text-sky-700"
                                    )}
                                  >
                                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                                      <Download className="mr-2 h-4 w-4" />
                                      {link.etiqueta}
                                    </a>
                                  </Button>
                                ))}
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                {norma.links.slice(7).map((link) => (
                                  <Button
                                    key={link.url}
                                    asChild
                                    variant={link.destaque ? "default" : "outline"}
                                    className={cn(
                                      "h-10 rounded-2xl px-4",
                                      link.destaque
                                        ? "bg-sky-600 text-white shadow-sky-900/10 hover:-translate-y-0.5 hover:bg-sky-500"
                                        : "border-slate-300 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-sky-300 hover:text-sky-700"
                                    )}
                                  >
                                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                                      <Download className="mr-2 h-4 w-4" />
                                      {link.etiqueta}
                                    </a>
                                  </Button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              {norma.links.map((link) => (
                                <Button
                                  key={link.url}
                                  asChild
                                  variant={link.destaque ? "default" : "outline"}
                                  className={cn(
                                    "h-10 rounded-2xl px-4",
                                    link.destaque
                                      ? "bg-sky-600 text-white shadow-sky-900/10 hover:-translate-y-0.5 hover:bg-sky-500"
                                      : "border-slate-300 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-sky-300 hover:text-sky-700"
                                  )}
                                >
                                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                                    <Download className="mr-2 h-4 w-4" />
                                    {link.etiqueta}
                                  </a>
                                </Button>
                              ))}
                            </div>
                          )
                        ) : (
                          <Button
                            asChild
                            variant="secondary"
                            className="mt-2 h-10 rounded-2xl bg-sky-600 text-white shadow-sky-900/10 transition hover:-translate-y-0.5 hover:bg-sky-500 sm:mt-0"
                          >
                            <a href={norma.pdfUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="mr-2 h-4 w-4" />
                              Baixar PDF
                            </a>
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : secaoAcervoSelecionada === "normas-seguranca" ? (
                <div className="grid gap-3">
                  {referenciasDisponiveis.map((referencia) => (
                    <div key={referencia.codigo} className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                      <div className="space-y-2">
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                          {referencia.codigo}
                        </span>
                        <h3 className="text-base font-semibold text-slate-900">{referencia.titulo}</h3>
                        <p className="text-sm text-muted-foreground">{referencia.descricao}</p>
                      </div>
                      <Button
                        asChild
                        variant="outline"
                        className="mt-2 h-10 w-full justify-center rounded-2xl border-emerald-300 text-emerald-700 transition hover:-translate-y-0.5 hover:border-emerald-400 hover:text-emerald-800 sm:w-auto"
                      >
                        <a href={referencia.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Acesso on-line
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 p-10 text-center text-sm text-muted-foreground">
                  <p className="text-base font-semibold text-slate-900">Conteúdo em preparação</p>
                  <p className="mt-2 max-w-xl mx-auto">
                    Estamos curando materiais exclusivos para esta categoria. Em breve, ebooks, normas complementares e ferramentas do dia a dia estarão disponíveis aqui.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
    </div>
    </DashboardLayout>
  );
}
