import { useState, useRef, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Eye, X, Edit2, Trash2, Search, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

export default function ModelosCertificados({ showLayout = true }: { showLayout?: boolean }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedModeloId, setSelectedModeloId] = useState<string>("");
  const [orientacaoPreview, setOrientacaoPreview] = useState<"portrait" | "landscape">("landscape");
  const [editingId, setEditingId] = useState<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Handler global para fechar o preview
  const handleClosePreview = () => {
    setPreviewDialogOpen(false);
  };

  // Listener para Escape quando preview estiver aberto
  useEffect(() => {
    if (previewDialogOpen) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          handleClosePreview();
        }
      };
      document.addEventListener("keydown", handleEscape, true);
      return () => {
        document.removeEventListener("keydown", handleEscape, true);
      };
    }
  }, [previewDialogOpen]);
  
  const [formData, setFormData] = useState({
    tipoTreinamentoId: "",
    nomeTreinamento: "",
    descricaoCertificado: "",
    diasTreinamento: "",
    modeloCertificadoId: "modelo-1",
    orientacao: "landscape" as "portrait" | "landscape",
    enderecoTreinamento: "",
  });
  const [conteudoProgramaticoItems, setConteudoProgramaticoItems] = useState<string[]>([]);
  const [novoItemConteudo, setNovoItemConteudo] = useState("");
  const [tipoTreinamentoOpen, setTipoTreinamentoOpen] = useState(false);
  const [tipoTreinamentoSearch, setTipoTreinamentoSearch] = useState("");

  // Modelos pré-definidos de certificado
  const modelosPredefinidos = [
    {
      id: "modelo-1",
      nome: "Modelo Padrão",
      descricao: "Modelo clássico de certificado",
    },
  ];

  const utils = trpc.useUtils();
  const { data: modelosRaw = [], isLoading } = trpc.modelosCertificados.list.useQuery();
  const { data: tiposTreinamentos = [] } = trpc.tiposTreinamentos.list.useQuery();
  
  // Filtrar tipos de treinamento baseado no termo de busca
  const tiposTreinamentosFiltrados = useMemo(() => {
    const tiposAtivos = tiposTreinamentos.filter((tipo: any) => tipo.status === "ativo");
    if (!tipoTreinamentoSearch.trim()) return tiposAtivos;
    const termo = tipoTreinamentoSearch.toLowerCase();
    return tiposAtivos.filter((tipo: any) =>
      tipo.nomeTreinamento?.toLowerCase().includes(termo)
    );
  }, [tiposTreinamentos, tipoTreinamentoSearch]);

  // Filtrar modelos baseado no termo de busca
  const modelos = useMemo(() => {
    if (!searchTerm.trim()) return modelosRaw;
    const termo = searchTerm.toLowerCase();
    return modelosRaw.filter((modelo: any) => 
      modelo.nome?.toLowerCase().includes(termo) ||
      modelo.descricao?.toLowerCase().includes(termo) ||
      modelo.descricaoCertificado?.toLowerCase().includes(termo)
    );
  }, [modelosRaw, searchTerm]);

  const createMutation = trpc.modelosCertificados.create.useMutation({
    onSuccess: async (novoModelo) => {
      toast.success("Modelo cadastrado com sucesso!");
      await utils.modelosCertificados.list.invalidate();
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro ao cadastrar modelo: ${error.message}`);
    },
  });

  const updateMutation = trpc.modelosCertificados.update.useMutation({
    onSuccess: () => {
      toast.success("Modelo atualizado com sucesso!");
      utils.modelosCertificados.list.invalidate();
      setDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar modelo: ${error.message}`);
    },
  });

  const deleteMutation = trpc.modelosCertificados.delete.useMutation({
    onSuccess: () => {
      toast.success("Modelo deletado com sucesso!");
      utils.modelosCertificados.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const deleteManyMutation = trpc.modelosCertificados.deleteMany.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.deleted} modelo(s) de certificado deletado(s) com sucesso!`);
      setSelectedIds([]);
      utils.modelosCertificados.list.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao deletar modelos de certificado");
    },
  });

  // Limpar seleção quando o termo de busca mudar
  useEffect(() => {
    setSelectedIds([]);
  }, [searchTerm]);

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja deletar este modelo?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === modelos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(modelos.map((m: any) => m.id));
    }
  };

  const handleDeleteMany = () => {
    if (selectedIds.length === 0) {
      toast.error("Selecione pelo menos um modelo de certificado para excluir");
      return;
    }
    if (
      window.confirm(
        `Tem certeza que deseja excluir ${selectedIds.length} modelo(s) de certificado?`
      )
    ) {
      deleteManyMutation.mutate({ ids: selectedIds });
    }
  };

  // Função para gerar template HTML baseado no modelo e orientação
  const gerarTemplateModelo = (modeloId: string, orientacao: "portrait" | "landscape", modeloCompleto?: any) => {
    // Se for um modelo cadastrado e tiver HTML template salvo, usar ele
    if (modeloCompleto && modeloCompleto.htmlTemplate) {
      let template = modeloCompleto.htmlTemplate;
      // Remover o campo "Norma Regulamentadora - [NR]" do template se existir
      template = template.replace(/<div[^>]*><strong>Norma\s+Regulamentadora\s*-\s*\[NR\][^<]*<\/strong><\/div>/gi, '');
      template = template.replace(/Norma\s+Regulamentadora\s*-\s*\[NR\][,]*/gi, '');
      
      // Substituir padrões antigos de data para usar [TEXTO_DATA_REALIZACAO]
      template = template.replace(/realizado\s+no\s+dia\s+<strong>\[DATA\s+REALIZAÇÃO\]<\/strong>/gi, '[TEXTO_DATA_REALIZACAO]');
      template = template.replace(/realizados\s+nos\s+dias\s+<strong>\[DATA\s+REALIZAÇÃO\]<\/strong>/gi, '[TEXTO_DATA_REALIZACAO]');
      template = template.replace(/realizado\s+no\s+dia\s+<strong>\[DATA\s+REALIZAÇÃO\]<\/strong>/gi, '[TEXTO_DATA_REALIZACAO]');
      
      // Converter estrutura antiga para nova: mover data de emissão do rodape para ao lado do conteúdo programático
      if (template.includes('rodape-data') || (template.includes('[DATA DE EMISSÃO]') && !template.includes('data-emissao-lateral'))) {
        // Remover data do rodape se existir lá
        template = template.replace(/<div[^>]*class="rodape-data"[^>]*>\[DATA DE EMISSÃO\]<\/div>/gi, '');
        template = template.replace(/<div[^>]*class="rodape-data"[^>]*>.*?<\/div>/gi, '');
        
        // Verificar se já não tem a nova estrutura
        if (!template.includes('conteudo-programatico-wrapper')) {
          // Envolver conteúdo programático com wrapper e adicionar data
          template = template.replace(
            /(<div[^>]*class="conteudo-programatico"[^>]*>[\s\S]*?<\/div>)/gi,
            '<div class="conteudo-programatico-wrapper">$1<div class="data-emissao-lateral">[DATA DE EMISSÃO]</div></div>'
          );
        }
      }
      
      // Remover fundo acinzentado do conteúdo programático - abordagem mais agressiva
      template = template.replace(/(\.conteudo-programatico\s*\{)([^}]*)(background:\s*[^;]+)([^}]*)(\})/gi, (match: string, p1: string, p2: string, p3: string, p4: string, p5: string) => {
        // Remover background e border-radius se existirem
        let newContent = p2.replace(/background:\s*[^;]+;?\s*/gi, '');
        newContent = newContent.replace(/border-radius:\s*[^;]+;?\s*/gi, '');
        // Adicionar background transparente
        return p1 + newContent + 'background: transparent; ' + p5;
      });
      
      // Também remover qualquer fundo rgba ou similar
      template = template.replace(/background:\s*rgba\(0,\s*0,\s*0,\s*0\.?\d*\)/gi, 'background: transparent');
      
      // Adicionar CSS do wrapper se não existir
      if (!template.includes('.conteudo-programatico-wrapper')) {
        const cssWrapper = `.conteudo-programatico-wrapper { display: flex; justify-content: space-between; align-items: flex-start; margin: ${orientacao === "landscape" ? "12px 0" : "10px 0"}; gap: ${orientacao === "landscape" ? "20px" : "15px"}; }
    .conteudo-programatico { flex: 1; padding: ${orientacao === "landscape" ? "8px 12px" : "6px 10px"}; background: transparent; }
    .data-emissao-lateral { text-align: right; font-size: ${orientacao === "landscape" ? "12px" : "11px"}; color: #000000; white-space: nowrap; padding-top: ${orientacao === "landscape" ? "8px" : "6px"}; }`;
        if (template.includes('</style>')) {
          template = template.replace('</style>', '\n    ' + cssWrapper + '\n  </style>');
        }
      }
      
      // Atualizar espaçamento do endereço do treinamento para 2.5cm do rodapé
      template = template.replace(/(\.endereco-treinamento\s*\{[^}]*bottom:\s*)[^;]+(;)/gi, '$1 0.5cm$2');
      template = template.replace(/(\.endereco-treinamento\s*\{[^}]*z-index:\s*)[^;]+(;)/gi, '$1 0$2');
      template = template.replace(/(\.rodape\s*\{[^}]*z-index:\s*)[^;]+(;)/gi, '$1 1$2');
      
      // Atualizar posicionamento do rodapé para 3cm do fundo
      template = template.replace(/(\.rodape\s*\{[^}]*bottom:\s*)[^;]+(;)/gi, '$1 3cm$2');
      
      // FORÇAR atualização do rodapé e assinaturas - SEMPRE atualizar
      template = template.replace(/(\.rodape\s*\{[^}]*bottom:\s*)[^;]+(;)/gi, '$1 3cm$2');
      template = template.replace(/(\.endereco-treinamento\s*\{[^}]*bottom:\s*)[^;]+(;)/gi, '$1 0.5cm$2');
      template = template.replace(/(\.endereco-treinamento\s*\{[^}]*z-index:\s*)[^;]+(;)/gi, '$1 0$2');
      template = template.replace(/(\.rodape\s*\{[^}]*z-index:\s*)[^;]+(;)/gi, '$1 1$2');
      // Ajustar CSS de assinaturas conforme especificações
      template = template.replace(/(\.assinaturas[^}]*gap:\s*)[^;]+(;)/gi, '$1 96px$2');
      template = template.replace(/(\.assinaturas[^}]*justify-content:\s*)[^;]+(;)/gi, '$1 space-between$2');
      template = template.replace(/(\.assinaturas[^}]*margin-top:\s*)[^;]+(;)/gi, '$1 64px$2');
      template = template.replace(/(\.assinatura[^}]*display:\s*)[^;]+(;)/gi, '$1 flex$2');
      template = template.replace(/(\.assinatura[^}]*flex-direction:\s*)[^;]+(;)/gi, '$1 column$2');
      template = template.replace(/(\.assinatura[^}]*align-items:\s*)[^;]+(;)/gi, '$1 center$2');
      template = template.replace(/(\.assinatura-linha[^}]*width:\s*)[^;]+(;)/gi, '$1 192px$2');
      template = template.replace(/(\.assinatura-linha[^}]*border-top:\s*)[^;]+(;)/gi, '$1 1px solid #000000$2');
      template = template.replace(/(\.assinatura-linha[^}]*margin-bottom:\s*)[^;]+(;)/gi, '$1 0px$2');
      template = template.replace(/(\.assinatura-nome[^}]*font-size:\s*)[^;]+(;)/gi, '$1 12px$2');
      template = template.replace(/(\.assinatura-nome[^}]*font-weight:\s*)[^;]+(;)/gi, '$1 600$2');
      template = template.replace(/(\.assinatura-nome[^}]*line-height:\s*)[^;]+(;)/gi, '$1 1.2$2');
      template = template.replace(/(\.assinatura-nome[^}]*color:\s*)[^;]+(;)/gi, '$1 #000000$2');
      template = template.replace(/(\.assinatura-nome[^}]*margin-top:\s*)[^;]+(;)/gi, '$1 1px$2');
      template = template.replace(/(\.assinatura-cargo[^}]*font-size:\s*)[^;]+(;)/gi, '$1 10px$2');
      template = template.replace(/(\.assinatura-cargo[^}]*line-height:\s*)[^;]+(;)/gi, '$1 1.2$2');
      template = template.replace(/(\.assinatura-cargo[^}]*color:\s*)[^;]+(;)/gi, '$1 #374151$2');
      template = template.replace(/(\.assinatura-cargo[^}]*margin-top:\s*)[^;]+(;)/gi, '$1 1px$2');
      
      // Adicionar/atualizar CSS de assinaturas - FORÇAR atualização
      const cssAssinaturas = `.rodape { position: absolute; bottom: 3cm !important; left: 0; right: 0; width: 100%; padding: 0 50px; z-index: 1 !important; }
      .endereco-treinamento { position: absolute; bottom: 0.5cm !important; left: ${orientacao === "landscape" ? "50px" : "35px"}; font-size: ${orientacao === "landscape" ? "10px" : "9px"}; color: #000000; opacity: 0.7; z-index: 0 !important; max-width: ${orientacao === "landscape" ? "400px" : "300px"}; }
      .assinaturas { display: flex !important; justify-content: space-between !important; gap: 96px !important; margin-top: 64px !important; align-items: flex-start !important; }
      .assinatura { display: flex !important; flex-direction: column !important; align-items: center !important; }
      .assinatura-linha { width: 192px !important; border-top: 1px solid #000000 !important; margin-bottom: 0px !important; }
      .assinatura-nome { font-size: 12px !important; font-weight: 600 !important; line-height: 1.2 !important; color: #000000 !important; margin-top: 1px !important; }
      .assinatura-cargo { font-size: 10px !important; line-height: 1.2 !important; color: #374151 !important; margin-top: 1px !important; }`;
      if (template.includes('</style>')) {
        // Remover CSS antigo de assinaturas se existir
        template = template.replace(/\.rodape\s*\{[^}]*\}/gi, '');
        template = template.replace(/\.endereco-treinamento\s*\{[^}]*\}/gi, '');
        template = template.replace(/\.assinatura-linha\s*\{[^}]*\}/gi, '');
        template = template.replace(/\.assinatura-nome\s*\{[^}]*\}/gi, '');
        template = template.replace(/\.assinatura-cargo\s*\{[^}]*\}/gi, '');
        // Adicionar CSS novo no final
        template = template.replace('</style>', '\n    ' + cssAssinaturas + '\n  </style>');
      }
      
      // FORÇAR atualização da estrutura para nova estrutura de certificação
      // Substituir padrões antigos: empresa-emissora, cnpj-emissora, certificamos-que, nome-colaborador separados
      const novoFormato = '<div class="certificacao-empresa">Certifico que o Empregado: <strong>[NOME DO COLABORADOR]</strong>, Rg: <strong>[RG DO COLABORADOR]</strong>, da Empresa: <strong>[NOME DA EMPRESA]</strong> e CNPJ: <strong>[CNPJ DA EMPRESA]</strong></div>';
      
      // Remover estrutura antiga se existir (sempre remover, mesmo que já tenha a nova)
      template = template.replace(/<div[^>]*class="empresa-emissora"[^>]*>.*?<\/div>/gi, '');
      template = template.replace(/<div[^>]*class="cnpj-emissora"[^>]*>.*?<\/div>/gi, '');
      template = template.replace(/<div[^>]*class="certificamos-que"[^>]*>.*?<\/div>/gi, '');
      
      // Remover qualquer estrutura de certificacao-empresa antiga (pode ter formato diferente)
      template = template.replace(/<div[^>]*class="certificacao-empresa"[^>]*>.*?<\/div>/gi, '');
      
      // Remover nome-colaborador antigo que estava separado (só o nome)
      template = template.replace(/<div[^>]*class="nome-colaborador"[^>]*>.*?<\/div>/gi, '');
      
      // SEMPRE adicionar a nova estrutura após <div class="conteudo">
      // Usar regex mais específica para garantir que adiciona logo após abertura do conteudo
      if (!template.includes('Certifico que o Empregado:')) {
        template = template.replace(
          /(<div[^>]*class="conteudo"[^>]*>)/gi,
          '$1\n      ' + novoFormato
        );
      }
      
      // FORÇAR atualização da estrutura de assinaturas para incluir cargo e RG do colaborador
      // Se ainda tiver "Instrutor do Treinamento" fixo, substituir
      template = template.replace(/Instrutor do Treinamento/g, "[CARGO DO COLABORADOR]");
      
      // Se a assinatura do colaborador não tiver o campo de cargo ou RG, adicionar
      if (template.includes('[NOME DO COLABORADOR]') && !template.includes('[CARGO DO COLABORADOR]')) {
        template = template.replace(
          /(<p[^>]*>\[NOME DO COLABORADOR\]<\/p>)\s*(<p[^>]*>.*?<\/p>)?\s*(<\/div>)/gi,
          '$1\n          <p style="font-size: 10px; line-height: 1.2; color: #374151; margin: 0; padding: 0; margin-top: 1px;">\n            [CARGO DO COLABORADOR]\n          </p>\n          <p style="font-size: 10px; line-height: 1.2; color: #374151; margin: 0; padding: 0; margin-top: 1px;">\n            RG: [RG DO COLABORADOR]\n          </p>\n        $3'
        );
      }
      
      // Adicionar CSS de impressão para evitar quebra de página se não existir
      const isPaisagem = orientacao === "landscape";
      const width = isPaisagem ? "297mm" : "210mm";
      const height = isPaisagem ? "210mm" : "297mm";
      
      // Adicionar CSS para certificacao-empresa se não existir
      if (!template.includes('.certificacao-empresa')) {
        const cssCertificacao = `.certificacao-empresa { font-size: ${isPaisagem ? "16px" : "15px"}; text-align: center; margin-bottom: ${isPaisagem ? "12px" : "10px"}; color: #000000; line-height: 1.5; }`;
        if (template.includes('</style>')) {
          template = template.replace('</style>', '\n    ' + cssCertificacao + '\n  </style>');
        }
      }
      
      if (!template.includes('@page')) {
        const cssPrint = `
    @page { size: ${isPaisagem ? "297mm 210mm" : "210mm 297mm"}; margin: 0; }
    html, body { width: ${width}; height: ${height}; overflow: hidden; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }
    body { page-break-after: avoid; page-break-inside: avoid; }
    .certificado { page-break-after: avoid; page-break-inside: avoid; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }
    @media print {
      html, body { width: ${width}; height: ${height}; margin: 0; padding: 0; overflow: hidden; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }
      .certificado { width: ${width}; height: ${height}; margin: 0; padding: 0; page-break-after: avoid; page-break-inside: avoid; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }
      .cabecalho { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; background: #1e40af !important; color: #ffffff !important; }
      .conteudo { page-break-inside: avoid; max-height: ${isPaisagem ? "calc(210mm - 120px)" : "calc(297mm - 130px)"}; overflow: hidden; }
      .conteudo-programatico-wrapper { display: flex; justify-content: space-between; align-items: flex-start; }
      .rodape { page-break-inside: avoid; }
    }`;
        
        // Inserir o CSS de impressão antes do fechamento do </style> ou adicionar <style> se não existir
        if (template.includes('</style>')) {
          template = template.replace('</style>', cssPrint + '\n  </style>');
        } else if (template.includes('</head>')) {
          template = template.replace('</head>', '<style>' + cssPrint + '</style>\n</head>');
        }
      }
      
      return template;
    }
    
    // Caso contrário, usar o modelo padrão
    if (modeloId === "modelo-1") {
      const isPaisagem = orientacao === "landscape";
      const width = isPaisagem ? "297mm" : "210mm";
      const height = isPaisagem ? "210mm" : "297mm";
      
      return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificado</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: ${isPaisagem ? "297mm 210mm" : "210mm 297mm"}; margin: 0; }
    html, body { font-family: Arial, sans-serif; background: #ffffff; color: #000000; padding: 0; margin: 0; width: ${width}; height: ${height}; overflow: hidden; }
    body { page-break-after: avoid; page-break-inside: avoid; }
    .certificado { width: ${width}; height: ${height}; background: #ffffff; position: relative; margin: 0; overflow: hidden; page-break-after: avoid; page-break-inside: avoid; }
    @media print {
      html, body { width: ${width}; height: ${height}; margin: 0; padding: 0; overflow: hidden; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }
      .certificado { width: ${width}; height: ${height}; margin: 0; padding: 0; page-break-after: avoid; page-break-inside: avoid; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }
      .cabecalho { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; background: #1e40af !important; color: #ffffff !important; }
      .conteudo { page-break-inside: avoid; }
      .rodape { page-break-inside: avoid; }
    }
    .cabecalho { background: #1e40af !important; background-color: #1e40af !important; color: #ffffff !important; padding: ${isPaisagem ? "15px 20px" : "18px 20px"}; text-align: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }
    .cabecalho h1 { font-size: ${isPaisagem ? "42px" : "38px"}; font-weight: bold; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 2px; }
    .cabecalho h2 { font-size: ${isPaisagem ? "18px" : "16px"}; font-weight: normal; text-transform: uppercase; margin-top: 4px; opacity: 0.95; }
    .conteudo { padding: ${isPaisagem ? "20px 50px" : "18px 35px"}; max-height: ${isPaisagem ? "calc(210mm - 120px)" : "calc(297mm - 130px)"}; display: flex; flex-direction: column; overflow: hidden; page-break-inside: avoid; }
    .certificacao-empresa { font-size: ${isPaisagem ? "16px" : "15px"}; text-align: center; margin-bottom: ${isPaisagem ? "12px" : "10px"}; color: #000000; line-height: 1.5; }
    .nome-colaborador { font-size: ${isPaisagem ? "34px" : "30px"}; font-weight: bold; text-align: center; margin: ${isPaisagem ? "10px 0 12px 0" : "8px 0 10px 0"}; text-transform: uppercase; color: #1e40af; line-height: 1.2; }
    .nome-colaborador .rg { font-size: ${isPaisagem ? "20px" : "18px"}; font-weight: normal; text-transform: none; color: #000000; }
    .texto-treinamento { font-size: ${isPaisagem ? "13px" : "12px"}; line-height: 1.6; margin: ${isPaisagem ? "10px 0" : "8px 0"}; text-align: justify; color: #000000; }
    .detalhes-treinamento { margin: ${isPaisagem ? "10px 0" : "8px 0"}; font-size: ${isPaisagem ? "13px" : "12px"}; line-height: 1.5; color: #000000; }
    .detalhes-treinamento div { margin-bottom: 4px; }
    .conteudo-programatico-wrapper { display: flex; justify-content: space-between; align-items: flex-start; margin: ${isPaisagem ? "12px 0" : "10px 0"}; gap: ${isPaisagem ? "20px" : "15px"}; }
    .conteudo-programatico { flex: 1; padding: ${isPaisagem ? "8px 12px" : "6px 10px"}; background: transparent; }
    .conteudo-programatico h3 { font-weight: bold; font-size: ${isPaisagem ? "13px" : "12px"}; margin-bottom: ${isPaisagem ? "6px" : "5px"}; color: #1e40af; }
    .conteudo-programatico ul { list-style: none; padding-left: 0; font-size: ${isPaisagem ? "11px" : "10px"}; line-height: ${isPaisagem ? "1.5" : "1.4"}; color: #000000; }
    .conteudo-programatico li { margin-bottom: ${isPaisagem ? "3px" : "2px"}; }
    .data-emissao-lateral { text-align: right; font-size: ${isPaisagem ? "12px" : "11px"}; color: #000000; white-space: nowrap; padding-top: ${isPaisagem ? "8px" : "6px"}; }
    .rodape { position: absolute; bottom: 3cm; left: 0; right: 0; width: 100%; padding: 0 ${isPaisagem ? "50px" : "35px"}; z-index: 1; }
    .assinaturas { display: flex; justify-content: space-between; gap: 96px; margin-top: ${isPaisagem ? "64px" : "48px"}; align-items: flex-start; }
    .assinatura { display: flex; flex-direction: column; align-items: center; }
    .assinatura-linha { width: 192px; border-top: 1px solid #000000; margin-bottom: 0px; padding: 0; }
    .assinatura-nome { font-size: 12px; font-weight: 600; line-height: 1.2; color: #000000; margin: 0; padding: 0; margin-top: 1px; }
    .assinatura-cargo { font-size: 10px; line-height: 1.2; color: #374151; margin: 0; padding: 0; margin-top: 1px; }
    .endereco-treinamento { position: absolute; bottom: 0.5cm; left: ${isPaisagem ? "50px" : "35px"}; font-size: ${isPaisagem ? "10px" : "9px"}; color: #000000; opacity: 0.7; z-index: 0; max-width: ${isPaisagem ? "400px" : "300px"}; }
    .endereco-treinamento strong { font-weight: bold; }
  </style>
</head>
<body>
  <div class="certificado">
    <div class="cabecalho">
      <h1>CERTIFICADO</h1>
    </div>
    <div class="conteudo">
      <div class="certificacao-empresa">Certifico que o Empregado: <strong>[NOME DO COLABORADOR]</strong>, Rg: <strong>[RG DO COLABORADOR]</strong>, da Empresa: <strong>[NOME DA EMPRESA]</strong> e CNPJ: <strong>[CNPJ DA EMPRESA]</strong></div>
      <div class="texto-treinamento">[DESCRIÇÃO DO CERTIFICADO]</div>
      <div class="detalhes-treinamento">
        <div>[TEXTO_DATA_REALIZACAO]</div>
      </div>
      <div class="conteudo-programatico-wrapper">
        <div class="conteudo-programatico">
          <h3>Conteúdo Programático:</h3>
          <ul>[CONTEUDO_PROGRAMATICO_LISTA]</ul>
        </div>
        <div class="data-emissao-lateral">[DATA DE EMISSÃO]</div>
      </div>
    </div>
    <div class="endereco-treinamento"><strong>Endereço do Treinamento:</strong> [ENDERECO_TREINAMENTO]</div>
    <div class="rodape">
      <div class="assinaturas" style="margin-top: 64px; display: flex; justify-content: space-between; gap: 96px;">
        <div style="display: flex; flex-direction: column; align-items: center;">
          <div style="width: 192px; border-top: 1px solid #000000; margin-bottom: 0px;"></div>
          <p style="font-size: 12px; font-weight: 600; line-height: 1.2; margin: 0; padding: 0; margin-top: 1px;">
            [NOME DO COLABORADOR]
          </p>
          <p style="font-size: 10px; line-height: 1.2; color: #374151; margin: 0; padding: 0; margin-top: 1px;">
            [CARGO DO COLABORADOR]
          </p>
          <p style="font-size: 10px; line-height: 1.2; color: #374151; margin: 0; padding: 0; margin-top: 1px;">
            RG: [RG DO COLABORADOR]
          </p>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center;">
          <div style="width: 192px; border-top: 1px solid #000000; margin-bottom: 0px;"></div>
          <p style="font-size: 12px; font-weight: 600; line-height: 1.2; margin: 0; padding: 0; margin-top: 1px;">
            [NOME DO RESPONSÁVEL]
          </p>
          <p style="font-size: 10px; line-height: 1.2; color: #374151; margin: 0; padding: 0; margin-top: 1px;">
            [CARGO DO RESPONSÁVEL]
          </p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
    }
    return "";
  };

  const resetForm = () => {
    setTipoTreinamentoSearch("");
    setTipoTreinamentoOpen(false);
    setFormData({
      tipoTreinamentoId: "",
      nomeTreinamento: "",
      descricaoCertificado: "",
      diasTreinamento: "",
      modeloCertificadoId: "modelo-1",
      orientacao: "landscape",
      enderecoTreinamento: "",
    });
    setSelectedModeloId("");
    setConteudoProgramaticoItems([]);
    setNovoItemConteudo("");
    setEditingId(null);
  };

  const handleEdit = (modelo: any) => {
    // Preencher o formulário com os dados do modelo
    setFormData({
      tipoTreinamentoId: modelo.tipoTreinamentoId?.toString() || "",
      nomeTreinamento: modelo.nome || "",
      descricaoCertificado: modelo.descricaoCertificado || modelo.descricao || "",
      diasTreinamento: modelo.datas ? JSON.parse(modelo.datas || "[]").length.toString() : "1",
      modeloCertificadoId: modelo.id?.toString() || "modelo-1",
      orientacao: modelo.orientacao || "landscape",
      enderecoTreinamento: modelo.textoRodape || "",
    });
    
    // Carregar conteúdo programático se existir
    if (modelo.conteudoProgramatico) {
      try {
        const conteudo = JSON.parse(modelo.conteudoProgramatico);
        setConteudoProgramaticoItems(Array.isArray(conteudo) ? conteudo : []);
      } catch {
        setConteudoProgramaticoItems([]);
      }
    } else {
      setConteudoProgramaticoItems([]);
    }
    
    setEditingId(modelo.id);
    setDialogOpen(true);
  };

  // Handler para quando selecionar um tipo de treinamento
  const handleTipoTreinamentoChange = (tipoTreinamentoId: string) => {
    const tipoSelecionado = tiposTreinamentos.find((t: any) => t.id.toString() === tipoTreinamentoId);
    setTipoTreinamentoOpen(false);
    setTipoTreinamentoSearch("");
    
    if (tipoSelecionado) {
      setFormData({
        ...formData,
        tipoTreinamentoId: tipoTreinamentoId,
        nomeTreinamento: tipoSelecionado.nomeTreinamento || "",
        // Se o tipo de treinamento tiver carga horária, preencheria aqui
        // Por enquanto, mantém a carga horária manual
      });
    } else {
      setFormData({
        ...formData,
        tipoTreinamentoId: tipoTreinamentoId,
      });
    }
  };

  const handleAddConteudoItem = () => {
    if (novoItemConteudo.trim()) {
      setConteudoProgramaticoItems([...conteudoProgramaticoItems, novoItemConteudo.trim()]);
      setNovoItemConteudo("");
    }
  };

  const handleRemoveConteudoItem = (index: number) => {
    const novosItems = conteudoProgramaticoItems.filter((_, i) => i !== index);
    setConteudoProgramaticoItems(novosItems);
  };

  const handleVisualizarModelo = () => {
    if (!formData.modeloCertificadoId) {
      toast.error("Selecione um modelo de certificado primeiro");
      return;
    }
    setSelectedModeloId(formData.modeloCertificadoId);
    setOrientacaoPreview(formData.orientacao);
    setPreviewDialogOpen(true);
  };

  // Função para processar o template e substituir variáveis
  const processarTemplatePreview = (template: string) => {
    let html = template;
    
    // FORÇAR atualização da estrutura para nova estrutura de certificação
    // Substituir padrões antigos: empresa-emissora, cnpj-emissora, certificamos-que, nome-colaborador separados
    const novoFormato = '<div class="certificacao-empresa">Certifico que o Empregado: <strong>[NOME DO COLABORADOR]</strong>, Rg: <strong>[RG DO COLABORADOR]</strong>, da Empresa: <strong>[NOME DA EMPRESA]</strong> e CNPJ: <strong>[CNPJ DA EMPRESA]</strong></div>';
    
    // Remover estrutura antiga se existir (sempre remover, mesmo que já tenha a nova)
    html = html.replace(/<div[^>]*class="empresa-emissora"[^>]*>.*?<\/div>/gi, '');
    html = html.replace(/<div[^>]*class="cnpj-emissora"[^>]*>.*?<\/div>/gi, '');
    html = html.replace(/<div[^>]*class="certificamos-que"[^>]*>.*?<\/div>/gi, '');
    
    // Remover qualquer estrutura de certificacao-empresa antiga (pode ter formato diferente)
    html = html.replace(/<div[^>]*class="certificacao-empresa"[^>]*>.*?<\/div>/gi, '');
    
    // Remover nome-colaborador antigo que estava separado (só o nome)
    html = html.replace(/<div[^>]*class="nome-colaborador"[^>]*>.*?<\/div>/gi, '');
    
    // SEMPRE adicionar a nova estrutura após <div class="conteudo">
    if (!html.includes('Certifico que o Empregado:')) {
      html = html.replace(
        /(<div[^>]*class="conteudo"[^>]*>)/gi,
        '$1\n      ' + novoFormato
      );
    }
    
    // FORÇAR atualização da estrutura de assinaturas para incluir cargo e RG do colaborador
    // Se ainda tiver "Instrutor do Treinamento" fixo, substituir
    html = html.replace(/Instrutor do Treinamento/g, "[CARGO DO COLABORADOR]");
    
    // Se a assinatura do colaborador não tiver o campo de cargo ou RG, adicionar
    if (html.includes('[NOME DO COLABORADOR]') && !html.includes('[CARGO DO COLABORADOR]')) {
      html = html.replace(
        /(<p[^>]*>\[NOME DO COLABORADOR\]<\/p>)\s*(<p[^>]*>.*?<\/p>)?\s*(<\/div>)/gi,
        '$1\n          <p style="font-size: 10px; line-height: 1.2; color: #374151; margin: 0; padding: 0; margin-top: 1px;">\n            [CARGO DO COLABORADOR]\n          </p>\n          <p style="font-size: 10px; line-height: 1.2; color: #374151; margin: 0; padding: 0; margin-top: 1px;">\n            RG: [RG DO COLABORADOR]\n          </p>\n        $3'
      );
    }
    
    // Adicionar CSS para certificacao-empresa se não existir
    if (!html.includes('.certificacao-empresa')) {
      const cssCertificacao = `.certificacao-empresa { font-size: 16px; text-align: center; margin-bottom: 12px; color: #000000; line-height: 1.5; }`;
      if (html.includes('</style>')) {
        html = html.replace('</style>', '\n    ' + cssCertificacao + '\n  </style>');
      }
    }
    
    // Converter estrutura antiga para nova: mover data de emissão do rodape para ao lado do conteúdo programático
    if (html.includes('rodape-data') || (html.includes('[DATA DE EMISSÃO]') && !html.includes('data-emissao-lateral'))) {
      html = html.replace(/<div[^>]*class="rodape-data"[^>]*>.*?<\/div>/gi, '');
      if (!html.includes('conteudo-programatico-wrapper')) {
        html = html.replace(
          /(<div[^>]*class="conteudo-programatico"[^>]*>[\s\S]*?<\/div>)/gi,
          '<div class="conteudo-programatico-wrapper">$1<div class="data-emissao-lateral">[DATA DE EMISSÃO]</div></div>'
        );
      }
    }
    if (!html.includes('.conteudo-programatico-wrapper')) {
      const cssWrapper = `.conteudo-programatico-wrapper { display: flex; justify-content: space-between; align-items: flex-start; margin: 12px 0; gap: 20px; }
    .conteudo-programatico { flex: 1; padding: 8px 12px; background: transparent; }
    .data-emissao-lateral { text-align: right; font-size: 12px; color: #000000; white-space: nowrap; padding-top: 8px; }`;
      if (html.includes('</style>')) {
        html = html.replace('</style>', '\n    ' + cssWrapper + '\n  </style>');
      }
    }
    
    // Atualizar espaçamento do endereço do treinamento para 2.5cm do rodapé
    html = html.replace(/(\.endereco-treinamento\s*\{[^}]*bottom:\s*)[^;]+(;)/gi, '$1 2.5cm$2');
    
    // Atualizar posicionamento do rodapé para 3cm do fundo
    html = html.replace(/(\.rodape\s*\{[^}]*bottom:\s*)[^;]+(;)/gi, '$1 3cm$2');
    
    // FORÇAR atualização do rodapé e assinaturas - SEMPRE atualizar
    html = html.replace(/(\.rodape\s*\{[^}]*bottom:\s*)[^;]+(;)/gi, '$1 3cm$2');
    html = html.replace(/(\.endereco-treinamento\s*\{[^}]*bottom:\s*)[^;]+(;)/gi, '$1 2.5cm$2');
    // Ajustar CSS de assinaturas conforme especificações
    html = html.replace(/(\.assinaturas[^}]*gap:\s*)[^;]+(;)/gi, '$1 96px$2');
    html = html.replace(/(\.assinaturas[^}]*justify-content:\s*)[^;]+(;)/gi, '$1 space-between$2');
    html = html.replace(/(\.assinaturas[^}]*margin-top:\s*)[^;]+(;)/gi, '$1 64px$2');
    html = html.replace(/(\.assinatura[^}]*display:\s*)[^;]+(;)/gi, '$1 flex$2');
    html = html.replace(/(\.assinatura[^}]*flex-direction:\s*)[^;]+(;)/gi, '$1 column$2');
    html = html.replace(/(\.assinatura[^}]*align-items:\s*)[^;]+(;)/gi, '$1 center$2');
    html = html.replace(/(\.assinatura-linha[^}]*width:\s*)[^;]+(;)/gi, '$1 192px$2');
    html = html.replace(/(\.assinatura-linha[^}]*border-top:\s*)[^;]+(;)/gi, '$1 1px solid #000000$2');
    html = html.replace(/(\.assinatura-linha[^}]*margin-bottom:\s*)[^;]+(;)/gi, '$1 0px$2');
    html = html.replace(/(\.assinatura-nome[^}]*font-size:\s*)[^;]+(;)/gi, '$1 12px$2');
    html = html.replace(/(\.assinatura-nome[^}]*font-weight:\s*)[^;]+(;)/gi, '$1 600$2');
    html = html.replace(/(\.assinatura-nome[^}]*line-height:\s*)[^;]+(;)/gi, '$1 1.2$2');
    html = html.replace(/(\.assinatura-nome[^}]*color:\s*)[^;]+(;)/gi, '$1 #000000$2');
    html = html.replace(/(\.assinatura-nome[^}]*margin-top:\s*)[^;]+(;)/gi, '$1 1px$2');
    html = html.replace(/(\.assinatura-cargo[^}]*font-size:\s*)[^;]+(;)/gi, '$1 10px$2');
    html = html.replace(/(\.assinatura-cargo[^}]*line-height:\s*)[^;]+(;)/gi, '$1 1.2$2');
    html = html.replace(/(\.assinatura-cargo[^}]*color:\s*)[^;]+(;)/gi, '$1 #374151$2');
    html = html.replace(/(\.assinatura-cargo[^}]*margin-top:\s*)[^;]+(;)/gi, '$1 1px$2');
    
    // Adicionar/atualizar CSS de assinaturas - FORÇAR atualização
    const cssAssinaturas = `.rodape { position: absolute; bottom: 3cm !important; left: 0; right: 0; width: 100%; padding: 0 50px; }
    .endereco-treinamento { position: absolute; bottom: 2.5cm !important; left: 50px; font-size: 10px; color: #000000; opacity: 0.7; }
    .assinaturas { display: flex !important; justify-content: space-between !important; gap: 100px !important; }
    .assinatura { flex: 1 !important; text-align: center !important; }
    .assinatura-linha { border-top: 1px solid #000000 !important; padding-top: 0px !important; margin-bottom: 0px !important; width: 100% !important; }
    .assinatura-nome { font-weight: bold !important; margin-top: 2px !important; font-size: 11px !important; color: #000000 !important; text-align: center !important; }
    .assinatura-cargo { font-size: 10px !important; margin-top: 0px !important; color: #333333 !important; text-align: center !important; }`;
    if (html.includes('</style>')) {
      // Remover CSS antigo de assinaturas se existir
      html = html.replace(/\.rodape\s*\{[^}]*\}/gi, '');
      html = html.replace(/\.endereco-treinamento\s*\{[^}]*\}/gi, '');
      html = html.replace(/\.assinatura-linha\s*\{[^}]*\}/gi, '');
      html = html.replace(/\.assinatura-nome\s*\{[^}]*\}/gi, '');
      html = html.replace(/\.assinatura-cargo\s*\{[^}]*\}/gi, '');
      // Adicionar CSS novo no final
      html = html.replace('</style>', '\n    ' + cssAssinaturas + '\n  </style>');
    }
    
    // Substituir placeholders com dados de exemplo para preview
    html = html.replace(/\[NOME DO COLABORADOR\]/g, "[NOME DO COLABORADOR]");
    html = html.replace(/\[RG DO COLABORADOR\]/g, "[RG DO COLABORADOR]");
    html = html.replace(/\[CARGO DO COLABORADOR\]/g, "[CARGO DO COLABORADOR]");
    html = html.replace(/\[NOME DA EMPRESA\]/g, "[NOME DA EMPRESA]");
    html = html.replace(/\[CNPJ DA EMPRESA\]/g, "[CNPJ DA EMPRESA]");
    
    // Substituir nome do treinamento no HTML
    if (formData.nomeTreinamento && formData.nomeTreinamento.trim()) {
      // Se há nome, substitui o placeholder
      html = html.replace(/\[NOME DO TREINAMENTO\]/g, formData.nomeTreinamento);
    } else {
      // Se não há nome, remove o padrão completo " de [NOME DO TREINAMENTO]," ou " de [NOME DO TREINAMENTO]"
      html = html.replace(/\s+de\s+\[NOME DO TREINAMENTO\]\s*,/gi, "");
      html = html.replace(/\s+de\s+\[NOME DO TREINAMENTO\]/gi, "");
      // Também remove o placeholder se ainda existir
      html = html.replace(/\[NOME DO TREINAMENTO\]/g, "");
    }
    
    // Substituir descrição do certificado
    const descricao = formData.descricaoCertificado || "[DESCRIÇÃO DO CERTIFICADO]";
    
    // Verificar se o template já contém "Participou" e a descrição também começa com "Participou"
    // Se sim, remover o "Participou" da descrição para evitar duplicação
    let descricaoFinal = descricao;
    if (html.includes("Participou") && descricao.trim().toLowerCase().startsWith("participou")) {
      // Remover "Participou" do início da descrição (case-insensitive)
      descricaoFinal = descricao.replace(/^participou\s+do\s+/i, "").trim();
      // Se ainda começar com "Participou" (com maiúscula), remover também
      if (descricaoFinal.toLowerCase().startsWith("participou")) {
        descricaoFinal = descricaoFinal.replace(/^Participou\s+do\s+/i, "").trim();
      }
    }
    
    // Substituir nome do treinamento na descrição (se existir o placeholder)
    descricaoFinal = descricaoFinal.replace(/\[NOME DO TREINAMENTO\]/g, "");
    
    html = html.replace(/\[DESCRIÇÃO DO CERTIFICADO\]/g, descricaoFinal);
    
    // Pós-processamento AGGRESSIVO: corrigir TODOS os padrões problemáticos no HTML final
    // Remover "Participou do treinamento de ," (com vírgula após "de")
    html = html.replace(/Participou\s+do\s+treinamento\s+de\s*,\s*/gi, "Participou do treinamento ");
    html = html.replace(/Participou\s+do\s+treinamento\s+de\s*,\s*Treinamento/gi, "Participou do treinamento ");
    
    // Remover "treinamento de ," em qualquer lugar
    html = html.replace(/treinamento\s+de\s*,\s*/gi, "treinamento ");
    html = html.replace(/treinamento\s+de\s*,\s*Treinamento/gi, "treinamento ");
    
    // Remover ", Treinamento" quando aparecer após vírgula
    html = html.replace(/,\s*Treinamento\b/gi, "");
    
    // Remover "Participou do treinamento Treinamento" (duplicação)
    html = html.replace(/Participou\s+do\s+treinamento\s+Treinamento/gi, "Participou do treinamento ");
    
    // Remover vírgulas duplas ou múltiplas
    html = html.replace(/,\s*,+/g, ",");
    html = html.replace(/,\s*,\s*/g, ", ");
    
    // Limpar espaços múltiplos
    html = html.replace(/\s{2,}/g, " ");
    
    // Remover linha de carga horária do template se existir
    html = html.replace(/<div[^>]*>com\s+carga\s+horária\s+de\s+<strong>\[CARGA\s+HORÁRIA\]\s+horas\.<\/strong><\/div>/gi, '');
    html = html.replace(/com\s+carga\s+horária\s+de\s+<strong>\[CARGA\s+HORÁRIA\]\s+horas\.<\/strong>/gi, '');
    html = html.replace(/com\s+carga\s+horária\s+de\s+\[CARGA\s+HORÁRIA\]\s+horas\./gi, '');
    
    // Gerar texto de data de realização com singular/plural baseado no número de dias (até 10 dias)
    const diasTreinamento = parseInt(formData.diasTreinamento || "1");
    const diasLimitados = Math.min(diasTreinamento, 10); // Limitar a 10 dias
    let textoDataRealizacao: string;
    
    if (diasLimitados === 1) {
      textoDataRealizacao = `Realizado no dia <strong>[DATA REALIZAÇÃO]</strong>`;
    } else {
      // Gerar múltiplos placeholders de [DATA REALIZAÇÃO] separados por vírgulas (até 10)
      const datasPlaceholders = Array(diasLimitados).fill('[DATA REALIZAÇÃO]').join(', ');
      textoDataRealizacao = `Realizados nos dias <strong>${datasPlaceholders}</strong>`;
    }
    
    html = html.replace("[TEXTO_DATA_REALIZACAO]", textoDataRealizacao);
    
    // Substituir endereço do treinamento
    html = html.replace("[ENDERECO_TREINAMENTO]", formData.enderecoTreinamento || "[ENDEREÇO DO TREINAMENTO]");
    
    // Substituir conteúdo programático
    const conteudoLista = conteudoProgramaticoItems.length > 0
      ? conteudoProgramaticoItems.map((item, index) => 
          `<li>${String.fromCharCode(97 + index)}) ${item}</li>`
        ).join("")
      : `<li>a) Item 1 do conteúdo programático</li><li>b) Item 2 do conteúdo programático</li>`;
    
    html = html.replace("[CONTEUDO_PROGRAMATICO_LISTA]", conteudoLista);
    
    return html;
  };

  // Gerar HTML do preview baseado na orientação atual
  const previewHtml = useMemo(() => {
    if (!selectedModeloId) return "";
    
    // Buscar o modelo completo se for um modelo cadastrado
    let modeloCompleto: any = null;
    if (selectedModeloId !== "modelo-1") {
      modeloCompleto = modelos.find((m: any) => m.id.toString() === selectedModeloId);
    }
    
    let template = gerarTemplateModelo(selectedModeloId, orientacaoPreview, modeloCompleto);
    
    // Garantir que o campo [NR] seja removido também do preview
    template = template.replace(/<div[^>]*><strong>Norma\s+Regulamentadora\s*-\s*\[NR\][^<]*<\/strong><\/div>/gi, '');
    template = template.replace(/Norma\s+Regulamentadora\s*-\s*\[NR\][,]*/gi, '');
    
    // Também substituir padrões antigos de data para garantir que use o placeholder dinâmico
    template = template.replace(/realizado\s+no\s+dia\s+<strong>\[DATA\s+REALIZAÇÃO\]<\/strong>/gi, '[TEXTO_DATA_REALIZACAO]');
    template = template.replace(/realizados\s+nos\s+dias\s+<strong>\[DATA\s+REALIZAÇÃO\]<\/strong>/gi, '[TEXTO_DATA_REALIZACAO]');
    
    // Garantir que também substitua padrões que podem estar sem o placeholder [DATA REALIZAÇÃO]
    template = template.replace(/realizado\s+no\s+dia/gi, '[TEXTO_DATA_REALIZACAO]');
    template = template.replace(/realizados\s+nos\s+dias/gi, '[TEXTO_DATA_REALIZACAO]');
    
    return processarTemplatePreview(template);
  }, [selectedModeloId, orientacaoPreview, formData.nomeTreinamento, formData.descricaoCertificado, formData.diasTreinamento, formData.enderecoTreinamento, conteudoProgramaticoItems, modelos]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nomeTreinamento.trim()) {
      toast.error("Nome do Treinamento é obrigatório");
      return;
    }

    if (!formData.descricaoCertificado.trim()) {
      toast.error("Descrição do Certificado é obrigatória");
      return;
    }

    if (!formData.diasTreinamento || parseInt(formData.diasTreinamento) <= 0) {
      toast.error("Dias de Treinamento deve ser maior que zero");
      return;
    }

    if (parseInt(formData.diasTreinamento) > 10) {
      toast.error("Dias de Treinamento não pode ser maior que 10");
      return;
    }

    // Gerar o template HTML baseado no modelo selecionado
    const modeloSelecionado = formData.modeloCertificadoId || "modelo-1";
    
    // Se estiver editando, tentar usar o HTML template salvo do modelo
    let modeloCompleto: any = null;
    if (editingId) {
      modeloCompleto = modelos.find((m: any) => m.id === editingId);
    } else if (modeloSelecionado !== "modelo-1") {
      // Se estiver criando e selecionou um modelo cadastrado, usar ele como base
      modeloCompleto = modelos.find((m: any) => m.id.toString() === modeloSelecionado);
    }
    
    // Se estiver editando e o modelo já tem HTML template, usar ele (mas limpar campo [NR] e atualizar data)
    // Caso contrário, gerar novo template baseado no modelo selecionado
    let htmlTemplate: string;
    if (editingId && modeloCompleto && modeloCompleto.htmlTemplate) {
      htmlTemplate = modeloCompleto.htmlTemplate;
      // Remover o campo "Norma Regulamentadora - [NR]" do template se existir
      htmlTemplate = htmlTemplate.replace(/<div[^>]*><strong>Norma\s+Regulamentadora\s*-\s*\[NR\][^<]*<\/strong><\/div>/gi, '');
      htmlTemplate = htmlTemplate.replace(/Norma\s+Regulamentadora\s*-\s*\[NR\][,]*/gi, '');
      
      // Substituir padrões antigos de data para usar [TEXTO_DATA_REALIZACAO]
      htmlTemplate = htmlTemplate.replace(/realizado\s+no\s+dia\s+<strong>\[DATA\s+REALIZAÇÃO\]<\/strong>/gi, '[TEXTO_DATA_REALIZACAO]');
      htmlTemplate = htmlTemplate.replace(/realizados\s+nos\s+dias\s+<strong>\[DATA\s+REALIZAÇÃO\]<\/strong>/gi, '[TEXTO_DATA_REALIZACAO]');
      
      // Remover fundo acinzentado do conteúdo programático - abordagem mais agressiva
      htmlTemplate = htmlTemplate.replace(/(\.conteudo-programatico\s*\{)([^}]*)(background:\s*[^;]+)([^}]*)(\})/gi, (match, p1, p2, p3, p4, p5) => {
        // Remover background e border-radius se existirem
        let newContent = p2.replace(/background:\s*[^;]+;?\s*/gi, '');
        newContent = newContent.replace(/border-radius:\s*[^;]+;?\s*/gi, '');
        // Adicionar background transparente
        return p1 + newContent + 'background: transparent; ' + p5;
      });
      
      // Também remover qualquer fundo rgba ou similar
      htmlTemplate = htmlTemplate.replace(/background:\s*rgba\(0,\s*0,\s*0,\s*0\.?\d*\)/gi, 'background: transparent');
      
      // Atualizar espaçamento do endereço do treinamento para 2.5cm do rodapé
      htmlTemplate = htmlTemplate.replace(/(\.endereco-treinamento\s*\{[^}]*bottom:\s*)[^;]+(;)/gi, '$1 2.5cm$2');
      
      // Atualizar posicionamento do rodapé para 3cm do fundo
      htmlTemplate = htmlTemplate.replace(/(\.rodape\s*\{[^}]*bottom:\s*)[^;]+(;)/gi, '$1 3cm$2');
      
      // FORÇAR atualização do rodapé e assinaturas - SEMPRE atualizar
      htmlTemplate = htmlTemplate.replace(/(\.rodape\s*\{[^}]*bottom:\s*)[^;]+(;)/gi, '$1 3cm$2');
      htmlTemplate = htmlTemplate.replace(/(\.endereco-treinamento\s*\{[^}]*bottom:\s*)[^;]+(;)/gi, '$1 2.5cm$2');
      // Ajustar CSS de assinaturas conforme especificações
      htmlTemplate = htmlTemplate.replace(/(\.assinaturas[^}]*gap:\s*)[^;]+(;)/gi, '$1 96px$2');
      htmlTemplate = htmlTemplate.replace(/(\.assinaturas[^}]*justify-content:\s*)[^;]+(;)/gi, '$1 space-between$2');
      htmlTemplate = htmlTemplate.replace(/(\.assinaturas[^}]*margin-top:\s*)[^;]+(;)/gi, '$1 64px$2');
      htmlTemplate = htmlTemplate.replace(/(\.assinatura[^}]*display:\s*)[^;]+(;)/gi, '$1 flex$2');
      htmlTemplate = htmlTemplate.replace(/(\.assinatura[^}]*flex-direction:\s*)[^;]+(;)/gi, '$1 column$2');
      htmlTemplate = htmlTemplate.replace(/(\.assinatura[^}]*align-items:\s*)[^;]+(;)/gi, '$1 center$2');
      htmlTemplate = htmlTemplate.replace(/(\.assinatura-linha[^}]*width:\s*)[^;]+(;)/gi, '$1 192px$2');
      htmlTemplate = htmlTemplate.replace(/(\.assinatura-linha[^}]*border-top:\s*)[^;]+(;)/gi, '$1 1px solid #000000$2');
      htmlTemplate = htmlTemplate.replace(/(\.assinatura-linha[^}]*margin-bottom:\s*)[^;]+(;)/gi, '$1 0px$2');
      htmlTemplate = htmlTemplate.replace(/(\.assinatura-nome[^}]*font-size:\s*)[^;]+(;)/gi, '$1 12px$2');
      htmlTemplate = htmlTemplate.replace(/(\.assinatura-nome[^}]*font-weight:\s*)[^;]+(;)/gi, '$1 600$2');
      htmlTemplate = htmlTemplate.replace(/(\.assinatura-nome[^}]*line-height:\s*)[^;]+(;)/gi, '$1 1.2$2');
      htmlTemplate = htmlTemplate.replace(/(\.assinatura-nome[^}]*color:\s*)[^;]+(;)/gi, '$1 #000000$2');
      htmlTemplate = htmlTemplate.replace(/(\.assinatura-nome[^}]*margin-top:\s*)[^;]+(;)/gi, '$1 1px$2');
      htmlTemplate = htmlTemplate.replace(/(\.assinatura-cargo[^}]*font-size:\s*)[^;]+(;)/gi, '$1 10px$2');
      htmlTemplate = htmlTemplate.replace(/(\.assinatura-cargo[^}]*line-height:\s*)[^;]+(;)/gi, '$1 1.2$2');
      htmlTemplate = htmlTemplate.replace(/(\.assinatura-cargo[^}]*color:\s*)[^;]+(;)/gi, '$1 #374151$2');
      htmlTemplate = htmlTemplate.replace(/(\.assinatura-cargo[^}]*margin-top:\s*)[^;]+(;)/gi, '$1 1px$2');
      
      // Adicionar/atualizar CSS de assinaturas - FORÇAR atualização
      const cssAssinaturas = `.rodape { position: absolute; bottom: 3cm !important; left: 0; right: 0; width: 100%; padding: 0 50px; z-index: 1 !important; }
      .endereco-treinamento { position: absolute; bottom: 0.5cm !important; left: 50px; font-size: 10px; color: #000000; opacity: 0.7; z-index: 0 !important; max-width: 400px !important; }
      .assinaturas { display: flex !important; justify-content: space-between !important; gap: 96px !important; margin-top: 64px !important; align-items: flex-start !important; }
      .assinatura { display: flex !important; flex-direction: column !important; align-items: center !important; }
      .assinatura-linha { width: 192px !important; border-top: 1px solid #000000 !important; margin-bottom: 0px !important; }
      .assinatura-nome { font-size: 12px !important; font-weight: 600 !important; line-height: 1.2 !important; color: #000000 !important; margin-top: 1px !important; }
      .assinatura-cargo { font-size: 10px !important; line-height: 1.2 !important; color: #374151 !important; margin-top: 1px !important; }`;
      if (htmlTemplate.includes('</style>')) {
        // Remover CSS antigo de assinaturas se existir
        htmlTemplate = htmlTemplate.replace(/\.rodape\s*\{[^}]*\}/gi, '');
        htmlTemplate = htmlTemplate.replace(/\.endereco-treinamento\s*\{[^}]*\}/gi, '');
        htmlTemplate = htmlTemplate.replace(/\.assinatura-linha\s*\{[^}]*\}/gi, '');
        htmlTemplate = htmlTemplate.replace(/\.assinatura-nome\s*\{[^}]*\}/gi, '');
        htmlTemplate = htmlTemplate.replace(/\.assinatura-cargo\s*\{[^}]*\}/gi, '');
        // Adicionar CSS novo no final
        htmlTemplate = htmlTemplate.replace('</style>', '\n    ' + cssAssinaturas + '\n  </style>');
      }
    } else {
      htmlTemplate = gerarTemplateModelo(modeloSelecionado, formData.orientacao, modeloCompleto);
    }

    // Gerar datas baseado no número de dias (até 10 dias)
    const dias = parseInt(formData.diasTreinamento);
    const diasLimitados = Math.min(dias, 10); // Limitar a 10 dias
    const datasArray = [];
    for (let i = 1; i <= diasLimitados; i++) {
      datasArray.push({
        label: `Data ${i}`,
        valor: "",
      });
    }

    // Processar descrição antes de salvar para remover duplicações
    let descricaoParaSalvar = formData.descricaoCertificado;
    // Substituir nome do treinamento na descrição (se existir o placeholder)
    descricaoParaSalvar = descricaoParaSalvar.replace(/\[NOME DO TREINAMENTO\]/g, "");
    
    // Processar HTML template para remover duplicações também
    let htmlTemplateProcessado = htmlTemplate;
    
    // FORÇAR atualização da estrutura de assinaturas para incluir cargo e RG do colaborador
    // Se ainda tiver "Instrutor do Treinamento" fixo, substituir
    htmlTemplateProcessado = htmlTemplateProcessado.replace(/Instrutor do Treinamento/g, "[CARGO DO COLABORADOR]");
    
    // Se a assinatura do colaborador não tiver o campo de cargo ou RG, adicionar
    if (htmlTemplateProcessado.includes('[NOME DO COLABORADOR]') && !htmlTemplateProcessado.includes('[CARGO DO COLABORADOR]')) {
      htmlTemplateProcessado = htmlTemplateProcessado.replace(
        /(<p[^>]*>\[NOME DO COLABORADOR\]<\/p>)\s*(<p[^>]*>.*?<\/p>)?\s*(<\/div>)/gi,
        '$1\n          <p style="font-size: 10px; line-height: 1.2; color: #374151; margin: 0; padding: 0; margin-top: 1px;">\n            [CARGO DO COLABORADOR]\n          </p>\n          <p style="font-size: 10px; line-height: 1.2; color: #374151; margin: 0; padding: 0; margin-top: 1px;">\n            RG: [RG DO COLABORADOR]\n          </p>\n        $3'
      );
    }
    
    // Remover placeholder [NOME DO TREINAMENTO] do HTML
    if (formData.nomeTreinamento && formData.nomeTreinamento.trim()) {
      htmlTemplateProcessado = htmlTemplateProcessado.replace(/\[NOME DO TREINAMENTO\]/g, formData.nomeTreinamento);
    } else {
      htmlTemplateProcessado = htmlTemplateProcessado.replace(/\s+de\s+\[NOME DO TREINAMENTO\]\s*,/gi, "");
      htmlTemplateProcessado = htmlTemplateProcessado.replace(/\s+de\s+\[NOME DO TREINAMENTO\]/gi, "");
      htmlTemplateProcessado = htmlTemplateProcessado.replace(/\[NOME DO TREINAMENTO\]/g, "");
    }
    
    // Substituir descrição no HTML
    htmlTemplateProcessado = htmlTemplateProcessado.replace(/\[DESCRIÇÃO DO CERTIFICADO\]/g, descricaoParaSalvar);
    
    // Pós-processamento AGGRESSIVO no HTML antes de salvar
    // Remover "Participou do treinamento de ," (com vírgula após "de")
    htmlTemplateProcessado = htmlTemplateProcessado.replace(/Participou\s+do\s+treinamento\s+de\s*,\s*/gi, "Participou do treinamento ");
    htmlTemplateProcessado = htmlTemplateProcessado.replace(/Participou\s+do\s+treinamento\s+de\s*,\s*Treinamento/gi, "Participou do treinamento ");
    
    // Remover "treinamento de ," em qualquer lugar
    htmlTemplateProcessado = htmlTemplateProcessado.replace(/treinamento\s+de\s*,\s*/gi, "treinamento ");
    htmlTemplateProcessado = htmlTemplateProcessado.replace(/treinamento\s+de\s*,\s*Treinamento/gi, "treinamento ");
    
    // Remover ", Treinamento" quando aparecer após vírgula
    htmlTemplateProcessado = htmlTemplateProcessado.replace(/,\s*Treinamento\b/gi, "");
    
    // Remover "Participou do treinamento Treinamento" (duplicação)
    htmlTemplateProcessado = htmlTemplateProcessado.replace(/Participou\s+do\s+treinamento\s+Treinamento/gi, "Participou do treinamento ");
    
    // Remover vírgulas duplas ou múltiplas
    htmlTemplateProcessado = htmlTemplateProcessado.replace(/,\s*,+/g, ",");
    htmlTemplateProcessado = htmlTemplateProcessado.replace(/,\s*,\s*/g, ", ");
    
    // Limpar espaços múltiplos
    htmlTemplateProcessado = htmlTemplateProcessado.replace(/\s{2,}/g, " ");
    
    const dadosParaSalvar = {
      nome: formData.nomeTreinamento,
      descricao: descricaoParaSalvar,
      htmlTemplate: htmlTemplateProcessado,
      orientacao: formData.orientacao,
      conteudoProgramatico: JSON.stringify(conteudoProgramaticoItems),
      tipoTreinamentoId: formData.tipoTreinamentoId ? parseInt(formData.tipoTreinamentoId) : undefined,
      descricaoCertificado: descricaoParaSalvar,
      datas: JSON.stringify(datasArray),
      textoRodape: formData.enderecoTreinamento || undefined, // Usar textoRodape para armazenar o endereço
      mostrarDataEmissao: true,
      mostrarValidade: true,
      mostrarNR: true,
      mostrarConteudoProgramatico: true,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...dadosParaSalvar });
    } else {
      createMutation.mutate(dadosParaSalvar);
    }
  };

  const content = (
    <div className="space-y-6">
      {showLayout && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Modelos de Certificados</h1>
            <p className="text-muted-foreground">Gerencie os modelos de certificados disponíveis.</p>
          </div>
        </div>
      )}
      {!showLayout && (
        <div className="mb-4">
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Modelo
          </Button>
        </div>
      )}
      <Dialog 
            open={dialogOpen} 
            onOpenChange={(open) => {
              if (!open && !previewDialogOpen) {
                setDialogOpen(false);
                resetForm();
              } else if (open) {
                setDialogOpen(true);
              }
            }}
          >
            {showLayout && (
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Modelo
                </Button>
              </DialogTrigger>
            )}
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Modelo de Certificado" : "Novo Modelo de Certificado"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="tipoTreinamentoId">
                      Tipo de Treinamento
                    </Label>
                    <Popover open={tipoTreinamentoOpen} onOpenChange={setTipoTreinamentoOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={tipoTreinamentoOpen}
                          className="w-full justify-between mt-1.5"
                        >
                          {formData.tipoTreinamentoId
                            ? tiposTreinamentos.find((t: any) => t.id.toString() === formData.tipoTreinamentoId)?.nomeTreinamento || "Selecione um tipo de treinamento"
                            : "Selecione um tipo de treinamento"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <Command>
                          <CommandInput 
                            placeholder="Buscar treinamento por nome..." 
                            value={tipoTreinamentoSearch}
                            onValueChange={setTipoTreinamentoSearch}
                          />
                          <CommandList>
                            <CommandEmpty>
                              Nenhum treinamento encontrado.
                            </CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                value=""
                                onSelect={() => {
                                  handleTipoTreinamentoChange("");
                                  setFormData({
                                    ...formData,
                                    tipoTreinamentoId: "",
                                    nomeTreinamento: "",
                                  });
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    !formData.tipoTreinamentoId ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                Nenhum (limpar seleção)
                              </CommandItem>
                              {tiposTreinamentosFiltrados.map((tipo: any) => (
                                <CommandItem
                                  key={tipo.id}
                                  value={tipo.nomeTreinamento}
                                  onSelect={() => {
                                    handleTipoTreinamentoChange(tipo.id.toString());
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.tipoTreinamentoId === tipo.id.toString() ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {tipo.nomeTreinamento}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Ao selecionar um tipo, o nome do treinamento será preenchido automaticamente
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="nomeTreinamento">
                      Nome do Treinamento *
                    </Label>
                    <Input
                      id="nomeTreinamento"
                      value={formData.nomeTreinamento}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nomeTreinamento: e.target.value,
                        })
                      }
                      placeholder="Ex: NR-35 Trabalho em Altura"
                      className="mt-1.5"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="descricaoCertificado">
                      Descrição do Certificado *
                    </Label>
                    <Textarea
                      id="descricaoCertificado"
                      value={formData.descricaoCertificado}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          descricaoCertificado: e.target.value,
                        })
                      }
                      placeholder="Ex: em conformidade com a portaria 3.214/78"
                      rows={3}
                      className="mt-1.5"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4 border-t pt-4">
                  <div>
                    <Label>Conteúdo Programático</Label>
                    <div className="border rounded-lg p-4 space-y-3 mt-1.5 bg-gray-50/50">
                      <div className="flex gap-2">
                        <Input
                          value={novoItemConteudo}
                          onChange={(e) => setNovoItemConteudo(e.target.value)}
                          placeholder="Digite um item do conteúdo programático"
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddConteudoItem();
                            }
                          }}
                          className="flex-1"
                        />
                        <Button type="button" onClick={handleAddConteudoItem} size="sm">
                          Adicionar
                        </Button>
                      </div>
                      {conteudoProgramaticoItems.length > 0 && (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {conteudoProgramaticoItems.map((item, index) => (
                            <div key={index} className="flex items-center justify-between bg-white p-2.5 rounded-md border">
                              <span className="text-sm">
                                <span className="font-medium text-muted-foreground mr-2">
                                  {String.fromCharCode(97 + index)})
                                </span>
                                {item}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveConteudoItem(index)}
                                className="h-7 w-7 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      {conteudoProgramaticoItems.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-3">
                          Nenhum item adicionado. Digite e clique em "Adicionar" para incluir itens.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                  <div>
                    <Label htmlFor="diasTreinamento">Dias de Treinamento *</Label>
                    <Input
                      id="diasTreinamento"
                      type="number"
                      min="1"
                      max="10"
                      value={formData.diasTreinamento}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Limitar a 10 dias
                        if (value === "" || (parseInt(value) >= 1 && parseInt(value) <= 10)) {
                          setFormData({
                            ...formData,
                            diasTreinamento: value,
                          });
                        }
                      }}
                      placeholder="Ex: 1 ou 10"
                      className="mt-1.5"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Número de datas que serão geradas quando o certificado for emitido (máximo 10 dias)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="orientacao">Orientação *</Label>
                    <Select
                      value={formData.orientacao}
                      onValueChange={(value: "portrait" | "landscape") =>
                        setFormData({
                          ...formData,
                          orientacao: value,
                        })
                      }
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Selecione a orientação" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="landscape">Paisagem</SelectItem>
                        <SelectItem value="portrait">Retrato</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="enderecoTreinamento">Endereço do Treinamento</Label>
                    <Textarea
                      id="enderecoTreinamento"
                      value={formData.enderecoTreinamento}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          enderecoTreinamento: e.target.value,
                        })
                      }
                      placeholder="Ex: Rua das Flores, 123 - Centro - São Paulo/SP"
                      rows={2}
                      className="mt-1.5"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Este endereço será exibido no rodapé do certificado
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <Label htmlFor="modeloCertificado">Modelo de Certificado</Label>
                  <div className="flex gap-2 mt-1.5">
                    <Select
                      value={formData.modeloCertificadoId || "modelo-1"}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          modeloCertificadoId: value,
                        })
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecione um modelo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="modelo-1">Modelo Padrão</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleVisualizarModelo}
                      disabled={!formData.modeloCertificadoId}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Visualizar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Selecione um modelo de certificado para usar como base
                  </p>
                </div>

                <div className="flex gap-3 pt-4 border-t sticky bottom-0 bg-white pb-2 -mx-6 px-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      resetForm();
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1"
                  >
                    {editingId ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

      {/* Dialog de Visualização do Modelo - Usa portal para não interferir no dialog principal */}
      {previewDialogOpen && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
          onClick={(e) => {
            // Só fechar se clicar diretamente no overlay
            if (e.target === e.currentTarget) {
              setPreviewDialogOpen(false);
            }
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl flex flex-col w-full h-full max-w-[98vw] max-h-[98vh] relative z-[10000]"
            onClick={(e) => {
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
          >
            <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
              <h2 className="text-xl font-semibold">Visualizar Modelo de Certificado</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Label className="text-sm">Orientações:</Label>
                  <Select
                    value={orientacaoPreview}
                    onValueChange={(value: "portrait" | "landscape") => {
                      console.log("Mudando orientação para:", value);
                      setOrientacaoPreview(value);
                    }}
                  >
                    <SelectTrigger 
                      className="w-40"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent 
                      className="z-[10001]"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <SelectItem 
                        value="landscape"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        Paisagem
                      </SelectItem>
                      <SelectItem 
                        value="portrait"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        Retrato
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleClosePreview();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleClosePreview();
                  }}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3 cursor-pointer z-[10002]"
                  style={{ pointerEvents: 'auto', position: 'relative' }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Fechar
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-8 bg-gray-100 flex items-center justify-center min-h-0">
              {selectedModeloId ? (
                <div 
                  key={`preview-${selectedModeloId}-${orientacaoPreview}`}
                  className="bg-white shadow-2xl"
                  style={{
                    width: orientacaoPreview === "landscape" ? "297mm" : "210mm",
                    height: orientacaoPreview === "landscape" ? "210mm" : "297mm",
                    transform: orientacaoPreview === "landscape" 
                      ? "scale(1.0)" 
                      : "scale(0.9)",
                    transformOrigin: "center center",
                    transition: "transform 0.2s ease",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: previewHtml,
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">
                    Selecione um modelo para visualizar
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Buscar Modelos de Certificados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar modelo de certificado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Modelos de Certificados</CardTitle>
            {selectedIds.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteMany}
                disabled={deleteManyMutation.isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir {selectedIds.length} selecionado(s)
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : modelos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm
                ? "Nenhum modelo de certificado encontrado com o termo de busca."
                : "Nenhum modelo de certificado cadastrado. Clique em 'Novo Modelo' para começar."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={
                          modelos.length > 0 &&
                          selectedIds.length === modelos.length
                        }
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </TableHead>
                    <TableHead>Nome do Modelo</TableHead>
                    <TableHead className="max-w-md">Descrição</TableHead>
                    <TableHead>Orientações</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-20">Visualizar</TableHead>
                    <TableHead className="w-20">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modelos.map((modelo: any) => (
                    <TableRow key={modelo.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(modelo.id)}
                          onChange={() => handleToggleSelect(modelo.id)}
                          className="rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{modelo.nome}</TableCell>
                      <TableCell className="max-w-md whitespace-normal break-words">
                        {modelo.descricao || modelo.descricaoCertificado || "-"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            modelo.orientacao === "landscape"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {modelo.orientacao === "landscape" ? "Paisagem" : "Retrato"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            modelo.status === "ativo" || !modelo.status
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {modelo.status === "ativo" || !modelo.status ? "Ativo" : "Inativo"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedModeloId(modelo.id.toString());
                            setOrientacaoPreview(modelo.orientacao || "landscape");
                            // Preencher formData com dados do modelo para o preview
                            const diasDoModelo = modelo.datas ? JSON.parse(modelo.datas || "[]").length : 1;
                            setFormData({
                              ...formData,
                              nomeTreinamento: modelo.nome || "",
                              descricaoCertificado: modelo.descricaoCertificado || modelo.descricao || "",
                              diasTreinamento: diasDoModelo.toString(),
                              enderecoTreinamento: modelo.textoRodape || "",
                            });
                            // Carregar conteúdo programático se existir
                            if (modelo.conteudoProgramatico) {
                              try {
                                const conteudo = JSON.parse(modelo.conteudoProgramatico);
                                setConteudoProgramaticoItems(Array.isArray(conteudo) ? conteudo : []);
                              } catch {
                                setConteudoProgramaticoItems([]);
                              }
                            } else {
                              setConteudoProgramaticoItems([]);
                            }
                            setPreviewDialogOpen(true);
                          }}
                          title="Visualizar modelo"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(modelo)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(modelo.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  if (showLayout) {
    return <DashboardLayout>{content}</DashboardLayout>;
  }

  return content;
}

