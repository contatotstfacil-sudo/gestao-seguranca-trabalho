import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Eye, Download, X, Check, ChevronsUpDown, Trash2, FileText } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function EmissaoCertificados({ showLayout = true }: { showLayout?: boolean }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModeloId, setSelectedModeloId] = useState<string>("");
  const [selectedColaboradorId, setSelectedColaboradorId] = useState<string>("");
  const [selectedResponsavelId, setSelectedResponsavelId] = useState<string>("");
  const [datasRealizacao, setDatasRealizacao] = useState<string[]>([]);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [orientacaoPreview, setOrientacaoPreview] = useState<"portrait" | "landscape">("landscape");
  const [colaboradorOpen, setColaboradorOpen] = useState(false);
  const [colaboradorSearch, setColaboradorSearch] = useState("");

  const utils = trpc.useUtils();
  const { data: modelos = [], isLoading: isLoadingModelos } = trpc.modelosCertificados.list.useQuery();
  const { data: colaboradores = [], isLoading: isLoadingColaboradores } = trpc.colaboradores.list.useQuery({});
  const { data: responsaveis = [] } = trpc.responsaveis.list.useQuery();
  const [searchCertificados, setSearchCertificados] = useState("");
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>("");
  const [filtroMes, setFiltroMes] = useState<string>("");
  const [filtroAno, setFiltroAno] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [certificadoToDelete, setCertificadoToDelete] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  const { data: empresas } = trpc.empresas.list.useQuery();
  
  const { data: certificadosEmitidos = [], isLoading: isLoadingCertificados } = trpc.certificadosEmitidos.list.useQuery({
    searchTerm: searchCertificados || undefined,
    empresaId: filtroEmpresa ? parseInt(filtroEmpresa) : undefined,
    mes: filtroMes || undefined,
    ano: filtroAno || undefined,
  });
  
  const createCertificadoMutation = trpc.certificadosEmitidos.create.useMutation({
    onSuccess: () => {
      utils.certificadosEmitidos.list.invalidate();
      toast.success("Certificado emitido com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao emitir certificado: ${error.message}`);
    },
  });
  
  const deleteCertificadoMutation = trpc.certificadosEmitidos.delete.useMutation({
    onSuccess: () => {
      utils.certificadosEmitidos.list.invalidate();
      toast.success("Certificado excluído com sucesso!");
      setDeleteDialogOpen(false);
      setCertificadoToDelete(null);
    },
    onError: (error) => {
      toast.error(`Erro ao excluir certificado: ${error.message}`);
    },
  });

  const deleteManyMutation = trpc.certificadosEmitidos.deleteMany.useMutation({
    onSuccess: () => {
      utils.certificadosEmitidos.list.invalidate();
      toast.success(`${selectedIds.length} certificado(s) excluído(s) com sucesso!`);
      setSelectedIds([]);
    },
    onError: (error) => {
      toast.error(`Erro ao excluir certificados: ${error.message}`);
    },
  });
  
  // Buscar empresa do colaborador quando selecionado
  const colaboradorSelecionado = useMemo(() => {
    if (!selectedColaboradorId) return null;
    return colaboradores.find((c: any) => c.id.toString() === selectedColaboradorId);
  }, [colaboradores, selectedColaboradorId]);

  const { data: empresa } = trpc.empresas.getById.useQuery(
    { id: colaboradorSelecionado?.empresaId || 0 },
    { enabled: !!colaboradorSelecionado?.empresaId }
  );

  // Responsável selecionado
  const responsavelSelecionado = useMemo(() => {
    if (!selectedResponsavelId) return null;
    return responsaveis.find((r: any) => r.id.toString() === selectedResponsavelId);
  }, [responsaveis, selectedResponsavelId]);

  // Filtrar modelos - sempre usar apenas o "Modelo Padrão"
  const modelosFiltrados = useMemo(() => {
    // Buscar modelo padrão pelos modelos cadastrados que tenham nome "Modelo Padrão" ou similar
    const modeloPadrao = modelos.find((m: any) => 
      m.nome?.toLowerCase().includes("padrão") || 
      m.nome?.toLowerCase().includes("padrao") ||
      m.nome?.toLowerCase().includes("padr")
    );
    return modeloPadrao ? [modeloPadrao] : (modelos.length > 0 ? [modelos[0]] : []);
  }, [modelos]);
  
  // Garantir que o modelo padrão seja selecionado automaticamente
  useEffect(() => {
    if (modelosFiltrados.length > 0 && !selectedModeloId) {
      const modeloId = modelosFiltrados[0].id.toString();
      setSelectedModeloId(modeloId);
      // Inicializar as datas baseado no número de dias do modelo
      const modelo = modelos.find((m: any) => m.id.toString() === modeloId);
      if (modelo) {
        const dias = modelo.datas ? JSON.parse(modelo.datas || "[]").length : 1;
        setDatasRealizacao(Array(dias).fill(""));
        // Atualizar orientação do preview para a orientação do modelo
        if (modelo.orientacao) {
          setOrientacaoPreview(modelo.orientacao as "portrait" | "landscape");
        }
      }
    }
  }, [modelosFiltrados.length, modelos]);

  // Filtrar colaboradores baseado no termo de busca
  const colaboradoresFiltrados = useMemo(() => {
    if (!colaboradorSearch.trim()) return colaboradores;
    const termo = colaboradorSearch.toLowerCase();
    return colaboradores.filter((colaborador: any) => 
      colaborador.nomeCompleto?.toLowerCase().includes(termo)
    );
  }, [colaboradores, colaboradorSearch]);

  // Modelo selecionado
  const modeloSelecionado = useMemo(() => {
    if (!selectedModeloId) return null;
    return modelos.find((m: any) => m.id.toString() === selectedModeloId);
  }, [modelos, selectedModeloId]);


  // Quando selecionar um modelo, inicializar as datas baseado no número de dias
  const handleModeloChange = (modeloId: string) => {
    setSelectedModeloId(modeloId);
    const modelo = modelos.find((m: any) => m.id.toString() === modeloId);
    if (modelo) {
      const dias = modelo.datas ? JSON.parse(modelo.datas || "[]").length : 1;
      setDatasRealizacao(Array(dias).fill(""));
      // Atualizar orientação do preview para a orientação do modelo
      if (modelo.orientacao) {
        setOrientacaoPreview(modelo.orientacao);
      }
    }
  };

  // Função para processar o template HTML e substituir variáveis
  const processarTemplate = (template: string, dados: any, diasTreinamento: number) => {
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
    
    // FORÇAR atualização da estrutura de assinatura do colaborador - SEMPRE garantir que tenha cargo e RG
    // Tentar múltiplos padrões para garantir que funcione
    const padroesAssinatura = [
      // Padrão 1: estrutura com inline styles
      /(<div[^>]*style="[^"]*display:\s*flex[^"]*flex-direction:\s*column[^"]*align-items:\s*center[^"]*">\s*<div[^>]*style="[^"]*width:\s*192px[^"]*border-top:[^"]*"><\/div>\s*<p[^>]*>\[NOME DO COLABORADOR\]<\/p>)(\s*(?:<p[^>]*>.*?<\/p>)?\s*)(<\/div>)/gi,
      // Padrão 2: estrutura mais simples
      /(<div[^>]*class="assinatura"[^>]*>\s*<div[^>]*class="assinatura-linha"[^>]*><\/div>\s*<p[^>]*class="assinatura-nome"[^>]*>\[NOME DO COLABORADOR\]<\/p>)(\s*(?:<p[^>]*>.*?<\/p>)?\s*)(<\/div>)/gi,
      // Padrão 3: padrão mais genérico - qualquer p com [NOME DO COLABORADOR] dentro de div
      /(<div[^>]*>\s*<div[^>]*><\/div>\s*<p[^>]*>\[NOME DO COLABORADOR\]<\/p>)(\s*(?:<p[^>]*>.*?<\/p>)?\s*)(<\/div>)/gi,
    ];
    
    let estruturaAtualizada = false;
    for (const padrao of padroesAssinatura) {
      if (padrao.test(html)) {
        html = html.replace(
          padrao,
          '$1\n          <p style="font-size: 10px; line-height: 1.2; color: #374151; margin: 0; padding: 0; margin-top: 1px;">\n            [CARGO DO COLABORADOR]\n          </p>\n          <p style="font-size: 10px; line-height: 1.2; color: #374151; margin: 0; padding: 0; margin-top: 1px;">\n            RG: [RG DO COLABORADOR]\n          </p>\n        $3'
        );
        estruturaAtualizada = true;
        break;
      }
    }
    
    // Se nenhum padrão funcionou, tentar substituição direta após [NOME DO COLABORADOR]
    if (!estruturaAtualizada && html.includes('[NOME DO COLABORADOR]') && !html.includes('[CARGO DO COLABORADOR]')) {
      html = html.replace(
        /(<p[^>]*>\[NOME DO COLABORADOR\]<\/p>)(\s*(?:<p[^>]*>.*?<\/p>)?\s*)(<\/div>)/gi,
        '$1\n          <p style="font-size: 10px; line-height: 1.2; color: #374151; margin: 0; padding: 0; margin-top: 1px;">\n            [CARGO DO COLABORADOR]\n          </p>\n          <p style="font-size: 10px; line-height: 1.2; color: #374151; margin: 0; padding: 0; margin-top: 1px;">\n            RG: [RG DO COLABORADOR]\n          </p>\n        $3'
      );
    }
    
    // Remover campos que não devem aparecer
    html = html.replace(/<div[^>]*><strong>Norma\s+Regulamentadora\s*-\s*\[NR\][^<]*<\/strong><\/div>/gi, '');
    html = html.replace(/Norma\s+Regulamentadora\s*-\s*\[NR\][,]*/gi, '');
    html = html.replace(/com\s+carga\s+horária\s+de\s+<strong>\[CARGA\s+HORÁRIA\]\s+horas\.<\/strong>/gi, '');
    html = html.replace(/com\s+carga\s+horária\s+de\s+\[CARGA\s+HORÁRIA\]\s+horas\./gi, '');
    
    // Converter estrutura antiga para nova: mover data de emissão do rodape para ao lado do conteúdo programático
    if (html.includes('rodape-data') || (html.includes('[DATA DE EMISSÃO]') && !html.includes('data-emissao-lateral'))) {
      // Remover data do rodape se existir lá
      html = html.replace(/<div[^>]*class="rodape-data"[^>]*>.*?<\/div>/gi, '');
      
      // Verificar se já não tem a nova estrutura
      if (!html.includes('conteudo-programatico-wrapper')) {
        // Envolver conteúdo programático com wrapper e adicionar data
        html = html.replace(
          /(<div[^>]*class="conteudo-programatico"[^>]*>[\s\S]*?<\/div>)/gi,
          '<div class="conteudo-programatico-wrapper">$1<div class="data-emissao-lateral">[DATA DE EMISSÃO]</div></div>'
        );
      }
    }
    
    // Adicionar CSS do wrapper se não existir
    if (!html.includes('.conteudo-programatico-wrapper')) {
      const cssWrapper = `.conteudo-programatico-wrapper { display: flex; justify-content: space-between; align-items: flex-start; margin: 12px 0; gap: 20px; }
    .conteudo-programatico { flex: 1; padding: 8px 12px; background: transparent; }
    .data-emissao-lateral { text-align: right; font-size: 12px; color: #000000; white-space: nowrap; padding-top: 8px; }`;
      if (html.includes('</style>')) {
        html = html.replace('</style>', '\n    ' + cssWrapper + '\n  </style>');
      }
    }
    
    // Remover fundo acinzentado do conteúdo programático - abordagem mais agressiva
    // Substituir qualquer background dentro da classe conteudo-programatico
    html = html.replace(/(\.conteudo-programatico\s*\{)([^}]*)(background:\s*[^;]+)([^}]*)(\})/gi, (match, p1, p2, p3, p4, p5) => {
      // Remover background e border-radius se existirem
      let newContent = p2.replace(/background:\s*[^;]+;?\s*/gi, '');
      newContent = newContent.replace(/border-radius:\s*[^;]+;?\s*/gi, '');
      // Adicionar background transparente
      return p1 + newContent + 'background: transparent; ' + p5;
    });
    
    // Também remover qualquer fundo rgba ou similar
    html = html.replace(/background:\s*rgba\(0,\s*0,\s*0,\s*0\.?\d*\)/gi, 'background: transparent');
    html = html.replace(/background:\s*#[a-fA-F0-9]{6,8}/gi, (match) => {
      // Se for fundo branco ou muito claro, manter transparente
      if (match.includes('#fff') || match.includes('#ffffff')) {
        return 'background: transparent';
      }
      return match;
    });
    
    // FORÇAR atualização do rodapé e assinaturas - SEMPRE atualizar
    html = html.replace(/(\.rodape\s*\{[^}]*bottom:\s*)[^;]+(;)/gi, '$1 3cm$2');
    html = html.replace(/(\.endereco-treinamento\s*\{[^}]*bottom:\s*)[^;]+(;)/gi, '$1 0.5cm$2');
    html = html.replace(/(\.endereco-treinamento[^}]*z-index:\s*)[^;]+(;)/gi, '$1 0$2');
    html = html.replace(/(\.rodape[^}]*z-index:\s*)[^;]+(;)/gi, '$1 1$2');
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
    
    // Adicionar CSS para certificacao-empresa se não existir
    if (!html.includes('.certificacao-empresa')) {
      const cssCertificacao = `.certificacao-empresa { font-size: 16px; text-align: center; margin-bottom: 12px; color: #000000; line-height: 1.5; }`;
      if (html.includes('</style>')) {
        html = html.replace('</style>', '\n    ' + cssCertificacao + '\n  </style>');
      }
    }
    
    // Adicionar/atualizar CSS de assinaturas - FORÇAR atualização
    const cssAssinaturas = `.rodape { position: absolute; bottom: 3cm !important; left: 0; right: 0; width: 100%; padding: 0 50px; z-index: 1 !important; }
    .endereco-treinamento { position: absolute; bottom: 0.5cm !important; left: 50px; font-size: 10px; color: #000000; opacity: 0.7; z-index: 0 !important; max-width: 400px !important; }
    .assinaturas { display: flex !important; justify-content: space-between !important; gap: 96px !important; margin-top: 64px !important; align-items: flex-start !important; }
    .assinatura { display: flex !important; flex-direction: column !important; align-items: center !important; }
    .assinatura-linha { width: 192px !important; border-top: 1px solid #000000 !important; margin-bottom: 0px !important; }
    .assinatura-nome { font-size: 12px !important; font-weight: 600 !important; line-height: 1.2 !important; color: #000000 !important; margin-top: 1px !important; }
    .assinatura-cargo { font-size: 10px !important; line-height: 1.2 !important; color: #374151 !important; margin-top: 1px !important; }`;
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
    
    // Substituir dados do colaborador (DEPOIS de atualizar a estrutura)
    // IMPORTANTE: Substituir cargo ANTES de substituir nome para evitar conflitos
    const cargoColaboradorFinal = (dados.cargoColaborador && typeof dados.cargoColaborador === 'string' && dados.cargoColaborador.trim() !== "" && dados.cargoColaborador !== "[CARGO DO COLABORADOR]")
      ? dados.cargoColaborador.trim()
      : "";
    
    const nomeColaboradorFinal = (dados.nomeColaborador && typeof dados.nomeColaborador === 'string' && dados.nomeColaborador.trim() !== "" && dados.nomeColaborador !== "[NOME DO COLABORADOR]")
      ? dados.nomeColaborador.trim()
      : "[NOME DO COLABORADOR]";
    
    const rgColaboradorFinal = (dados.rgColaborador && typeof dados.rgColaborador === 'string' && dados.rgColaborador.trim() !== "" && dados.rgColaborador !== "[RG DO COLABORADOR]")
      ? dados.rgColaborador.trim()
      : "[RG DO COLABORADOR]";
    
    console.log("=== SUBSTITUIÇÃO DE PLACEHOLDERS ===");
    console.log("CargoColaboradorFinal:", cargoColaboradorFinal);
    console.log("NomeColaboradorFinal:", nomeColaboradorFinal);
    console.log("RGColaboradorFinal:", rgColaboradorFinal);
    console.log("Dados completos:", dados);
    
    // Substituir todos os placeholders - usar replaceAll para garantir que todos sejam substituídos
    // IMPORTANTE: Sempre manter a estrutura, mesmo se cargo ou RG estiverem vazios
    // Primeiro substituir cargo (sempre manter a linha, mesmo se vazio)
    if (cargoColaboradorFinal) {
      html = html.replace(/\[CARGO DO COLABORADOR\]/g, cargoColaboradorFinal);
    } else {
      // Se não há cargo, substituir por string vazia mas manter a estrutura
      html = html.replace(/\[CARGO DO COLABORADOR\]/g, '');
      // Se a linha ficou vazia, ainda manter o elemento HTML
      html = html.replace(/<p[^>]*>\[CARGO DO COLABORADOR\]<\/p>/gi, '<p style="font-size: 10px; line-height: 1.2; color: #374151; margin: 0; padding: 0; margin-top: 1px;"></p>');
    }
    
    // Depois substituir nome
    html = html.replace(/\[NOME DO COLABORADOR\]/g, nomeColaboradorFinal);
    
    // Por último substituir RG (sempre manter a linha, mesmo se vazio)
    if (rgColaboradorFinal && rgColaboradorFinal !== "[RG DO COLABORADOR]") {
      html = html.replace(/\[RG DO COLABORADOR\]/g, rgColaboradorFinal);
    } else {
      // Se não há RG, substituir por string vazia mas manter a estrutura
      html = html.replace(/\[RG DO COLABORADOR\]/g, '');
      // Se a linha ficou vazia, ainda manter o elemento HTML
      html = html.replace(/<p[^>]*>RG:\s*\[RG DO COLABORADOR\]<\/p>/gi, '<p style="font-size: 10px; line-height: 1.2; color: #374151; margin: 0; padding: 0; margin-top: 1px;">RG: </p>');
    }
    
    // Verificar se os placeholders foram substituídos
    if (html.includes("[CARGO DO COLABORADOR]")) {
      console.error("ERRO: Placeholder [CARGO DO COLABORADOR] não foi substituído!");
      console.error("Dados recebidos:", dados);
      console.error("CargoColaboradorFinal:", cargoColaboradorFinal);
      const cargoIndex = html.indexOf("[CARGO");
      if (cargoIndex > -1) {
        console.error("HTML snippet:", html.substring(Math.max(0, cargoIndex - 50), Math.min(html.length, cargoIndex + 300)));
      }
    } else {
      console.log("✓ Placeholder [CARGO DO COLABORADOR] substituído com sucesso!");
    }
    if (html.includes("[RG DO COLABORADOR]")) {
      console.error("ERRO: Placeholder [RG DO COLABORADOR] não foi substituído! Dados:", dados);
    } else {
      console.log("✓ Placeholder [RG DO COLABORADOR] substituído com sucesso!");
    }
    
    // Substituir dados da empresa (se disponível)
    html = html.replace(/\[NOME DA EMPRESA\]/g, dados.nomeEmpresa || "[NOME DA EMPRESA]");
    html = html.replace(/\[CNPJ DA EMPRESA\]/g, dados.cnpjEmpresa || "[CNPJ DA EMPRESA]");
    
    // Remover placeholder [NOME DO TREINAMENTO] do HTML
    // Se não há nome de treinamento, remove o padrão completo " de [NOME DO TREINAMENTO],"
    html = html.replace(/\s+de\s+\[NOME DO TREINAMENTO\]\s*,/gi, "");
    html = html.replace(/\s+de\s+\[NOME DO TREINAMENTO\]/gi, "");
    html = html.replace(/\[NOME DO TREINAMENTO\]/g, "");
    
    // Substituir descrição do certificado (remover "Participou do" duplicado se existir)
    let descricaoFinal = dados.descricaoCertificado || "[DESCRIÇÃO DO CERTIFICADO]";
    if (html.includes("Participou") && descricaoFinal.trim().toLowerCase().startsWith("participou")) {
      descricaoFinal = descricaoFinal.replace(/^participou\s+do\s+/i, "").trim();
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
    
    // Gerar texto de data de realização com singular/plural
    // Usar o número real de datas preenchidas, não o diasTreinamento
    const numeroDatas = dados.datasRealizacao && dados.datasRealizacao.length > 0 
      ? dados.datasRealizacao.filter((d: string) => d && d.trim() !== "").length 
      : 0;
    const diasLimitados = numeroDatas > 0 ? numeroDatas : Math.min(diasTreinamento, 10);
    let textoDataRealizacao: string;
    
    if (diasLimitados === 1) {
      const dataFormatada = dados.datasRealizacao && dados.datasRealizacao.length > 0 && dados.datasRealizacao[0]
        ? (() => {
            // Garantir que a data seja formatada corretamente, evitando problemas de fuso horário
            const data = new Date(dados.datasRealizacao[0] + 'T00:00:00');
            if (isNaN(data.getTime())) {
              return dados.datasRealizacao[0]; // Se não conseguir parsear, retorna como está
            }
            return data.toLocaleDateString('pt-BR');
          })()
        : "[DATA REALIZAÇÃO]";
      textoDataRealizacao = `Realizado no dia <strong>${dataFormatada}</strong>`;
    } else {
      const datasFormatadas = dados.datasRealizacao && dados.datasRealizacao.length > 0
        ? dados.datasRealizacao
            .filter((data: string) => data && data.trim() !== "")
            .map((data: string) => {
              // Garantir que a data seja formatada corretamente, evitando problemas de fuso horário
              const dataObj = new Date(data + 'T00:00:00');
              if (isNaN(dataObj.getTime())) {
                return data; // Se não conseguir parsear, retorna como está
              }
              return dataObj.toLocaleDateString('pt-BR');
            })
            .filter(Boolean)
            .join(", ")
        : Array(diasLimitados).fill("[DATA REALIZAÇÃO]").join(", ");
      textoDataRealizacao = `Realizados nos dias <strong>${datasFormatadas}</strong>`;
    }
    
    // Substituir [TEXTO_DATA_REALIZACAO] ou padrões antigos
    html = html.replace(/\[TEXTO_DATA_REALIZACAO\]/g, textoDataRealizacao);
    html = html.replace(/realizado\s+no\s+dia\s+<strong>\[DATA\s+REALIZAÇÃO\]<\/strong>/gi, textoDataRealizacao);
    html = html.replace(/realizados\s+nos\s+dias\s+<strong>\[DATA\s+REALIZAÇÃO\]<\/strong>/gi, textoDataRealizacao);
    
    // Substituir endereço do treinamento
    html = html.replace(/\[ENDERECO_TREINAMENTO\]/g, dados.enderecoTreinamento || "[ENDEREÇO DO TREINAMENTO]");
    
    // Substituir conteúdo programático
    let conteudoLista = "";
    if (dados.conteudoProgramatico && Array.isArray(dados.conteudoProgramatico) && dados.conteudoProgramatico.length > 0) {
      conteudoLista = dados.conteudoProgramatico.map((item: string, index: number) => 
        `<li>${String.fromCharCode(97 + index)}) ${item}</li>`
      ).join("");
      console.log("Conteúdo programático processado:", conteudoLista, "Itens:", dados.conteudoProgramatico);
    } else {
      // Fallback: usar conteúdo padrão se não houver conteúdo programático
      conteudoLista = `<li>a) Item 1 do conteúdo programático</li><li>b) Item 2 do conteúdo programático</li>`;
      console.log("Usando conteúdo programático padrão (fallback) - dados:", dados.conteudoProgramatico);
    }
    
    // Substituir o placeholder - tentar múltiplas abordagens
    // 1. Substituição direta do placeholder
    html = html.replace(/\[CONTEUDO_PROGRAMATICO_LISTA\]/g, conteudoLista);
    html = html.replace(/\[CONTEÚDO_PROGRAMÁTICO_LISTA\]/gi, conteudoLista);
    html = html.replace(/\[CONTEUDO PROGRAMATICO LISTA\]/gi, conteudoLista);
    
    // 2. Substituir dentro de tags <ul> (caso o placeholder esteja dentro)
    html = html.replace(/(<ul[^>]*>)\s*\[CONTEUDO[^\]]*\]\s*(<\/ul>)/gi, `$1${conteudoLista}$2`);
    html = html.replace(/(<ul[^>]*>)\s*\[CONTEÚDO[^\]]*\]\s*(<\/ul>)/gi, `$1${conteudoLista}$2`);
    
    // 3. Substituir qualquer variação restante do placeholder
    html = html.replace(/\[CONTEUDO[^\]]*\]/gi, conteudoLista);
    html = html.replace(/\[CONTEÚDO[^\]]*\]/gi, conteudoLista);
    
    // 4. Verificação final - se ainda há placeholder, substituir dentro de qualquer tag <ul>
    if (html.includes("[CONTEUDO") || html.includes("[CONTEÚDO")) {
      // Buscar qualquer tag <ul> que contenha o placeholder
      html = html.replace(/(<ul[^>]*>)([\s\S]*?)(\[CONTEUDO[^\]]*\])([\s\S]*?)(<\/ul>)/gi, (match, p1, p2, p3, p4, p5) => {
        return p1 + conteudoLista + p5;
      });
      // Última tentativa: substituir qualquer placeholder restante
      html = html.replace(/\[CONTEUDO[^\]]*\]/gi, conteudoLista);
      html = html.replace(/\[CONTEÚDO[^\]]*\]/gi, conteudoLista);
    }
    
    // Substituir data de emissão - sempre a última data do treinamento
    let dataEmissao = "[DATA DE EMISSÃO]";
    if (dados.datasRealizacao && dados.datasRealizacao.length > 0) {
      // Pegar a última data do array (filtrar datas vazias primeiro)
      const datasValidas = dados.datasRealizacao.filter((d: string) => d && d.trim() !== "");
      if (datasValidas.length > 0) {
        const ultimaData = datasValidas[datasValidas.length - 1];
        if (ultimaData) {
          // Garantir que a data seja formatada corretamente, evitando problemas de fuso horário
          const data = new Date(ultimaData + 'T00:00:00');
          if (!isNaN(data.getTime())) {
            const dia = data.getDate().toString().padStart(2, '0');
            const meses = [
              'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
              'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
            ];
            const mes = meses[data.getMonth()];
            const ano = data.getFullYear();
            dataEmissao = `${dia} de ${mes} de ${ano}`;
          }
        }
      }
    }
    html = html.replace(/\[DATA DE EMISSÃO\]/g, dataEmissao);
    
    // Substituir responsável (se disponível)
    html = html.replace(/\[NOME DO RESPONSÁVEL\]/g, dados.nomeResponsavel || "[NOME DO RESPONSÁVEL]");
    html = html.replace(/\[CARGO DO RESPONSÁVEL\]/g, dados.cargoResponsavel || "[CARGO DO RESPONSÁVEL]");
    
    return html;
  };

  // Gerar HTML do preview
  const previewHtml = useMemo(() => {
    if (!modeloSelecionado || !modeloSelecionado.htmlTemplate) return "";
    
    // Usar o número de datas preenchidas pelo usuário, não o número de dias do modelo
    const diasTreinamento = datasRealizacao.length > 0 ? datasRealizacao.length : (modeloSelecionado.datas ? JSON.parse(modeloSelecionado.datas || "[]").length : 1);
    
    // Parse do conteúdo programático
    let conteudoProgramaticoArray: string[] = [];
    if (modeloSelecionado.conteudoProgramatico) {
      try {
        const parsed = JSON.parse(modeloSelecionado.conteudoProgramatico);
        if (Array.isArray(parsed) && parsed.length > 0) {
          conteudoProgramaticoArray = parsed;
        }
      } catch (e) {
        console.error("Erro ao parsear conteúdo programático:", e, modeloSelecionado.conteudoProgramatico);
      }
    }
    
    // Debug: log do conteúdo programático
    console.log("Conteúdo Programático do Modelo:", {
      raw: modeloSelecionado.conteudoProgramatico,
      parsed: conteudoProgramaticoArray,
      length: conteudoProgramaticoArray.length
    });
    
    // Buscar cargo do colaborador - priorizar nomeCargo, depois funcao
    const cargoColaborador = colaboradorSelecionado?.nomeCargo 
      ? colaboradorSelecionado.nomeCargo 
      : (colaboradorSelecionado?.funcao ? colaboradorSelecionado.funcao : "");
    
    console.log("=== DEBUG CARGO ===");
    console.log("Colaborador selecionado:", colaboradorSelecionado);
    console.log("Cargo do colaborador (nomeCargo):", colaboradorSelecionado?.nomeCargo);
    console.log("Cargo do colaborador (funcao):", colaboradorSelecionado?.funcao);
    console.log("Cargo final calculado:", cargoColaborador);
    
    const dados = {
      nomeColaborador: colaboradorSelecionado?.nomeCompleto || "[NOME DO COLABORADOR]",
      rgColaborador: colaboradorSelecionado?.rg || "[RG DO COLABORADOR]",
      cargoColaborador: cargoColaborador,
      nomeEmpresa: empresa?.razaoSocial || "[NOME DA EMPRESA]",
      cnpjEmpresa: empresa?.cnpj || "[CNPJ DA EMPRESA]",
      descricaoCertificado: modeloSelecionado.descricaoCertificado || modeloSelecionado.descricao || "",
      datasRealizacao: datasRealizacao.filter(d => d && d.trim() !== ""), // Filtrar datas vazias
      enderecoTreinamento: modeloSelecionado.textoRodape || "",
      conteudoProgramatico: conteudoProgramaticoArray,
      nomeResponsavel: responsavelSelecionado?.nomeCompleto || "[NOME DO RESPONSÁVEL]",
      cargoResponsavel: responsavelSelecionado?.funcao || "[CARGO DO RESPONSÁVEL]",
    };
    
    const htmlProcessado = processarTemplate(modeloSelecionado.htmlTemplate, dados, diasTreinamento);
    
    // Debug: verificar se os placeholders foram substituídos
    if (htmlProcessado.includes("[CONTEUDO")) {
      console.warn("Placeholder de conteúdo programático não foi substituído:", htmlProcessado.match(/\[CONTEUDO[^\]]*\]/g));
    }
    if (htmlProcessado.includes("[CARGO DO COLABORADOR]")) {
      console.error("ERRO CRÍTICO: [CARGO DO COLABORADOR] não foi substituído! Dados:", dados);
      const cargoIndex = htmlProcessado.indexOf("[CARGO");
      if (cargoIndex > -1) {
        console.error("HTML snippet:", htmlProcessado.substring(Math.max(0, cargoIndex - 50), Math.min(htmlProcessado.length, cargoIndex + 300)));
      }
    }
    if (htmlProcessado.includes("[RG DO COLABORADOR]") && !htmlProcessado.includes("RG: [RG DO COLABORADOR]")) {
      console.error("ERRO CRÍTICO: [RG DO COLABORADOR] não foi substituído! Dados:", dados);
    }
    
    return htmlProcessado;
  }, [modeloSelecionado, colaboradorSelecionado, empresa, responsavelSelecionado, datasRealizacao, orientacaoPreview]);

  const handleVisualizar = () => {
    if (!selectedModeloId) {
      toast.error("Selecione um modelo de certificado");
      return;
    }
    if (!selectedColaboradorId) {
      toast.error("Selecione um colaborador");
      return;
    }
    setPreviewDialogOpen(true);
  };

  const handleDownload = () => {
    if (!previewHtml || !modeloSelecionado || !colaboradorSelecionado) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    // Validar datas de realização
    if (datasRealizacao.length === 0 || datasRealizacao.some(d => !d)) {
      toast.error("Preencha todas as datas de realização");
      return;
    }

    // Salvar certificado no banco
    createCertificadoMutation.mutate({
      modeloCertificadoId: parseInt(selectedModeloId),
      colaboradorId: parseInt(selectedColaboradorId),
      responsavelId: selectedResponsavelId ? parseInt(selectedResponsavelId) : undefined,
      nomeColaborador: colaboradorSelecionado.nomeCompleto,
      rgColaborador: colaboradorSelecionado.rg || undefined,
      nomeEmpresa: empresa?.razaoSocial || undefined,
      cnpjEmpresa: empresa?.cnpj || undefined,
      datasRealizacao: JSON.stringify(datasRealizacao),
      htmlGerado: previewHtml,
    });

    // Criar uma nova janela para impressão/download
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      // Adicionar CSS de impressão para evitar quebra de página
      let htmlComPrint = previewHtml;
      const cssPrint = `
    @page { size: auto; margin: 0; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
    @media print {
      html, body { margin: 0; padding: 0; overflow: hidden; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
      .certificado { page-break-after: avoid !important; page-break-inside: avoid !important; break-inside: avoid !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
      .cabecalho { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; background: #1e40af !important; background-color: #1e40af !important; color: #ffffff !important; }
      .conteudo { page-break-inside: avoid !important; break-inside: avoid !important; }
      .rodape { page-break-inside: avoid !important; break-inside: avoid !important; }
    }`;
      
      if (htmlComPrint.includes('</style>')) {
        htmlComPrint = htmlComPrint.replace('</style>', cssPrint + '\n  </style>');
      } else if (htmlComPrint.includes('</head>')) {
        htmlComPrint = htmlComPrint.replace('</head>', '<style>' + cssPrint + '</style>\n</head>');
      }
      printWindow.document.write(htmlComPrint);
      printWindow.document.close();
      // Aguardar um pouco para garantir que o conteúdo foi carregado
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  const handleVisualizarCertificado = (htmlGerado: string, certificado?: any) => {
    // Remover fundo acinzentado do conteúdo programático antes de exibir
    let htmlProcessado = htmlGerado;
    
    // Buscar dados do colaborador se o certificado foi passado
    let cargoColaborador = "";
    let rgColaborador = "";
    if (certificado) {
      // Buscar colaborador pelo ID
      const colaborador = colaboradores.find((c: any) => c.id === certificado.colaboradorId);
      if (colaborador) {
        cargoColaborador = colaborador.nomeCargo || colaborador.funcao || "";
        rgColaborador = colaborador.rg || certificado.rgColaborador || "";
      } else {
        rgColaborador = certificado.rgColaborador || "";
      }
    }
    
    // FORÇAR atualização da estrutura de assinatura para incluir cargo e RG do colaborador
    // Tentar múltiplos padrões para garantir que funcione
    const padroesAssinatura = [
      // Padrão 1: estrutura com inline styles
      /(<div[^>]*style="[^"]*display:\s*flex[^"]*flex-direction:\s*column[^"]*align-items:\s*center[^"]*">\s*<div[^>]*style="[^"]*width:\s*192px[^"]*border-top:[^"]*"><\/div>\s*<p[^>]*>([^<]+)<\/p>)(\s*(?:<p[^>]*>.*?<\/p>)?\s*)(<\/div>)/gi,
      // Padrão 2: estrutura mais simples
      /(<div[^>]*class="assinatura"[^>]*>\s*<div[^>]*class="assinatura-linha"[^"]*><\/div>\s*<p[^>]*class="assinatura-nome"[^>]*>([^<]+)<\/p>)(\s*(?:<p[^>]*>.*?<\/p>)?\s*)(<\/div>)/gi,
      // Padrão 3: padrão mais genérico - qualquer p dentro de div de assinatura
      /(<div[^>]*>\s*<div[^>]*><\/div>\s*<p[^>]*>([^<]+)<\/p>)(\s*(?:<p[^>]*>.*?<\/p>)?\s*)(<\/div>)/gi,
    ];
    
    // Verificar se a primeira assinatura (do colaborador) tem cargo e RG
    // Procurar pelo nome do colaborador na primeira assinatura
    const nomeColaboradorNoHtml = certificado?.nomeColaborador || "";
    if (nomeColaboradorNoHtml && !htmlProcessado.includes('<p[^>]*>' + cargoColaborador + '</p>') && !htmlProcessado.includes('RG: ' + rgColaborador)) {
      // Tentar encontrar a estrutura de assinatura do colaborador e adicionar cargo/RG
      for (const padrao of padroesAssinatura) {
        const match = htmlProcessado.match(padrao);
        if (match && match[0]) {
          // Verificar se contém o nome do colaborador
          if (match[0].includes(nomeColaboradorNoHtml)) {
            // Substituir para adicionar cargo e RG
            htmlProcessado = htmlProcessado.replace(
              padrao,
              (matchStr: string, p1: string, p2: string, p3: string, p4: string) => {
                // Verificar se já tem cargo e RG
                if (!matchStr.includes('RG:') && !matchStr.includes('CARGO')) {
                  return p1 + 
                    '\n          <p style="font-size: 10px; line-height: 1.2; color: #374151; margin: 0; padding: 0; margin-top: 1px;">\n            ' + (cargoColaborador || '') + 
                    '\n          </p>\n          <p style="font-size: 10px; line-height: 1.2; color: #374151; margin: 0; padding: 0; margin-top: 1px;">\n            RG: ' + (rgColaborador || '') + 
                    '\n          </p>\n        ' + p4;
                }
                return matchStr;
              }
            );
            break;
          }
        }
      }
      
      // Se não encontrou pelo padrão, tentar substituição direta após o nome
      if (nomeColaboradorNoHtml && !htmlProcessado.includes('RG: ' + rgColaborador)) {
        htmlProcessado = htmlProcessado.replace(
          new RegExp(`(<p[^>]*>${nomeColaboradorNoHtml.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<\/p>)(\\s*(?:<p[^>]*>.*?<\/p>)?\\s*)(<\/div>)`, 'gi'),
          (match: string, p1: string, p2: string, p3: string) => {
            if (!match.includes('RG:') && !match.includes(cargoColaborador)) {
              return p1 + 
                '\n          <p style="font-size: 10px; line-height: 1.2; color: #374151; margin: 0; padding: 0; margin-top: 1px;">\n            ' + (cargoColaborador || '') + 
                '\n          </p>\n          <p style="font-size: 10px; line-height: 1.2; color: #374151; margin: 0; padding: 0; margin-top: 1px;">\n            RG: ' + (rgColaborador || '') + 
                '\n          </p>\n        ' + p3;
            }
            return match;
          }
        );
      }
    }
    
    // Remover placeholder [NOME DO TREINAMENTO] do HTML
    htmlProcessado = htmlProcessado.replace(/\s+de\s+\[NOME DO TREINAMENTO\]\s*,/gi, "");
    htmlProcessado = htmlProcessado.replace(/\s+de\s+\[NOME DO TREINAMENTO\]/gi, "");
    htmlProcessado = htmlProcessado.replace(/\[NOME DO TREINAMENTO\]/g, "");
    
    // FORÇAR atualização do rodapé e assinaturas - SEMPRE atualizar
    htmlProcessado = htmlProcessado.replace(/(\.rodape\s*\{[^}]*bottom:\s*)[^;]+(;)/gi, '$1 3cm$2');
    htmlProcessado = htmlProcessado.replace(/(\.endereco-treinamento\s*\{[^}]*bottom:\s*)[^;]+(;)/gi, '$1 2.5cm$2');
    // Ajustar CSS de assinaturas conforme especificações
    htmlProcessado = htmlProcessado.replace(/(\.assinaturas[^}]*gap:\s*)[^;]+(;)/gi, '$1 96px$2');
    htmlProcessado = htmlProcessado.replace(/(\.assinaturas[^}]*justify-content:\s*)[^;]+(;)/gi, '$1 space-between$2');
    htmlProcessado = htmlProcessado.replace(/(\.assinaturas[^}]*margin-top:\s*)[^;]+(;)/gi, '$1 64px$2');
    htmlProcessado = htmlProcessado.replace(/(\.assinatura[^}]*display:\s*)[^;]+(;)/gi, '$1 flex$2');
    htmlProcessado = htmlProcessado.replace(/(\.assinatura[^}]*flex-direction:\s*)[^;]+(;)/gi, '$1 column$2');
    htmlProcessado = htmlProcessado.replace(/(\.assinatura[^}]*align-items:\s*)[^;]+(;)/gi, '$1 center$2');
    htmlProcessado = htmlProcessado.replace(/(\.assinatura-linha[^}]*width:\s*)[^;]+(;)/gi, '$1 192px$2');
    htmlProcessado = htmlProcessado.replace(/(\.assinatura-linha[^}]*border-top:\s*)[^;]+(;)/gi, '$1 1px solid #000000$2');
    htmlProcessado = htmlProcessado.replace(/(\.assinatura-linha[^}]*margin-bottom:\s*)[^;]+(;)/gi, '$1 2px$2');
    htmlProcessado = htmlProcessado.replace(/(\.assinatura-nome[^}]*font-size:\s*)[^;]+(;)/gi, '$1 12px$2');
    htmlProcessado = htmlProcessado.replace(/(\.assinatura-nome[^}]*font-weight:\s*)[^;]+(;)/gi, '$1 600$2');
    htmlProcessado = htmlProcessado.replace(/(\.assinatura-nome[^}]*line-height:\s*)[^;]+(;)/gi, '$1 1.25$2');
    htmlProcessado = htmlProcessado.replace(/(\.assinatura-nome[^}]*color:\s*)[^;]+(;)/gi, '$1 #000000$2');
    htmlProcessado = htmlProcessado.replace(/(\.assinatura-cargo[^}]*font-size:\s*)[^;]+(;)/gi, '$1 10px$2');
    htmlProcessado = htmlProcessado.replace(/(\.assinatura-cargo[^}]*line-height:\s*)[^;]+(;)/gi, '$1 1.25$2');
    htmlProcessado = htmlProcessado.replace(/(\.assinatura-cargo[^}]*color:\s*)[^;]+(;)/gi, '$1 #374151$2');
    
    // Converter estrutura antiga para nova: mover data de emissão do rodape para ao lado do conteúdo programático
    if (htmlProcessado.includes('rodape-data') || (htmlProcessado.includes('[DATA DE EMISSÃO]') && !htmlProcessado.includes('data-emissao-lateral'))) {
      htmlProcessado = htmlProcessado.replace(/<div[^>]*class="rodape-data"[^>]*>.*?<\/div>/gi, '');
      if (!htmlProcessado.includes('conteudo-programatico-wrapper')) {
        htmlProcessado = htmlProcessado.replace(
          /(<div[^>]*class="conteudo-programatico"[^>]*>[\s\S]*?<\/div>)/gi,
          '<div class="conteudo-programatico-wrapper">$1<div class="data-emissao-lateral">[DATA DE EMISSÃO]</div></div>'
        );
      }
    }
    if (!htmlProcessado.includes('.conteudo-programatico-wrapper')) {
      const cssWrapper = `.conteudo-programatico-wrapper { display: flex; justify-content: space-between; align-items: flex-start; margin: 12px 0; gap: 20px; }
    .conteudo-programatico { flex: 1; padding: 8px 12px; background: transparent; }
    .data-emissao-lateral { text-align: right; font-size: 12px; color: #000000; white-space: nowrap; padding-top: 8px; }`;
      if (htmlProcessado.includes('</style>')) {
        htmlProcessado = htmlProcessado.replace('</style>', '\n    ' + cssWrapper + '\n  </style>');
      }
    }
    
    // Adicionar/atualizar CSS de assinaturas se não existir ou atualizar
    const cssAssinaturas = `.rodape { position: absolute; bottom: 3cm !important; left: 0; right: 0; width: 100%; padding: 0 50px; z-index: 1 !important; }
    .endereco-treinamento { position: absolute; bottom: 0.5cm !important; left: 50px; font-size: 10px; color: #000000; opacity: 0.7; z-index: 0 !important; max-width: 400px !important; }
    .assinaturas { display: flex !important; justify-content: space-between !important; gap: 96px !important; margin-top: 64px !important; align-items: flex-start !important; }
    .assinatura { display: flex !important; flex-direction: column !important; align-items: center !important; }
    .assinatura-linha { width: 192px !important; border-top: 1px solid #000000 !important; margin-bottom: 2px !important; }
    .assinatura-nome { font-size: 12px !important; font-weight: 600 !important; line-height: 1.25 !important; color: #000000 !important; }
    .assinatura-cargo { font-size: 10px !important; line-height: 1.25 !important; color: #374151 !important; }`;
    if (htmlProcessado.includes('</style>')) {
      // Remover CSS antigo de assinaturas se existir
      htmlProcessado = htmlProcessado.replace(/\.rodape\s*\{[^}]*\}/gi, '');
      htmlProcessado = htmlProcessado.replace(/\.endereco-treinamento\s*\{[^}]*\}/gi, '');
      htmlProcessado = htmlProcessado.replace(/\.assinatura-linha\s*\{[^}]*\}/gi, '');
      htmlProcessado = htmlProcessado.replace(/\.assinatura-nome\s*\{[^}]*\}/gi, '');
      htmlProcessado = htmlProcessado.replace(/\.assinatura-cargo\s*\{[^}]*\}/gi, '');
      // Adicionar CSS novo
      htmlProcessado = htmlProcessado.replace('</style>', '\n    ' + cssAssinaturas + '\n  </style>');
    }
    
    // Pós-processamento AGGRESSIVO: corrigir TODOS os padrões problemáticos no HTML final
    // Remover "Participou do treinamento de ," (com vírgula após "de")
    htmlProcessado = htmlProcessado.replace(/Participou\s+do\s+treinamento\s+de\s*,\s*/gi, "Participou do treinamento ");
    htmlProcessado = htmlProcessado.replace(/Participou\s+do\s+treinamento\s+de\s*,\s*Treinamento/gi, "Participou do treinamento ");
    
    // Remover "treinamento de ," em qualquer lugar
    htmlProcessado = htmlProcessado.replace(/treinamento\s+de\s*,\s*/gi, "treinamento ");
    htmlProcessado = htmlProcessado.replace(/treinamento\s+de\s*,\s*Treinamento/gi, "treinamento ");
    
    // Remover ", Treinamento" quando aparecer após vírgula
    htmlProcessado = htmlProcessado.replace(/,\s*Treinamento\b/gi, "");
    
    // Remover "Participou do treinamento Treinamento" (duplicação)
    htmlProcessado = htmlProcessado.replace(/Participou\s+do\s+treinamento\s+Treinamento/gi, "Participou do treinamento ");
    
    // Remover vírgulas duplas ou múltiplas
    htmlProcessado = htmlProcessado.replace(/,\s*,+/g, ",");
    htmlProcessado = htmlProcessado.replace(/,\s*,\s*/g, ", ");
    
    // Limpar espaços múltiplos
    htmlProcessado = htmlProcessado.replace(/\s{2,}/g, " ");
    
    // Remover fundo acinzentado do conteúdo programático
    htmlProcessado = htmlProcessado.replace(/(\.conteudo-programatico\s*\{)([^}]*)(background:\s*[^;]+)([^}]*)(\})/gi, (match: string, p1: string, p2: string, p3: string, p4: string, p5: string) => {
      let newContent = p2.replace(/background:\s*[^;]+;?\s*/gi, '');
      newContent = newContent.replace(/border-radius:\s*[^;]+;?\s*/gi, '');
      return p1 + newContent + 'background: transparent; ' + p5;
    });
    
    htmlProcessado = htmlProcessado.replace(/background:\s*rgba\(0,\s*0,\s*0,\s*0\.?\d*\)/gi, 'background: transparent');
    
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      // Adicionar CSS de impressão para evitar quebra de página
      let htmlComPrint = htmlProcessado;
      const cssPrint = `
    @page { size: auto; margin: 0; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
    @media print {
      html, body { margin: 0; padding: 0; overflow: hidden; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
      .certificado { page-break-after: avoid !important; page-break-inside: avoid !important; break-inside: avoid !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
      .cabecalho { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; background: #1e40af !important; background-color: #1e40af !important; color: #ffffff !important; }
      .conteudo { page-break-inside: avoid !important; break-inside: avoid !important; }
      .rodape { page-break-inside: avoid !important; break-inside: avoid !important; }
    }`;
      
      if (htmlComPrint.includes('</style>')) {
        htmlComPrint = htmlComPrint.replace('</style>', cssPrint + '\n  </style>');
      } else if (htmlComPrint.includes('</head>')) {
        htmlComPrint = htmlComPrint.replace('</head>', '<style>' + cssPrint + '</style>\n</head>');
      }
      printWindow.document.write(htmlComPrint);
      printWindow.document.close();
    }
  };

  const handleDeleteCertificado = (id: number) => {
    setCertificadoToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (certificadoToDelete) {
      deleteCertificadoMutation.mutate({ id: certificadoToDelete });
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === certificadosEmitidos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(certificadosEmitidos.map((c: any) => c.id));
    }
  };

  const handleDeleteMany = () => {
    if (selectedIds.length === 0) {
      toast.error("Selecione pelo menos um certificado para excluir");
      return;
    }
    if (window.confirm(`Tem certeza que deseja excluir ${selectedIds.length} certificado(s)?`)) {
      deleteManyMutation.mutate({ ids: selectedIds });
    }
  };

  const content = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Emitir Certificado</h2>
          <p className="text-muted-foreground">Emita certificados para colaboradores</p>
        </div>
      </div>

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
            <CardTitle>Emitir Certificado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="colaborador">Colaborador *</Label>
              <Popover open={colaboradorOpen} onOpenChange={setColaboradorOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={colaboradorOpen}
                    className="w-full justify-between mt-1.5 h-10"
                  >
                    {selectedColaboradorId
                      ? colaboradores.find((c: any) => c.id.toString() === selectedColaboradorId)?.nomeCompleto || "Selecione um colaborador"
                      : "Selecione um colaborador"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Buscar colaborador por nome..." 
                      value={colaboradorSearch}
                      onValueChange={setColaboradorSearch}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {isLoadingColaboradores ? "Carregando..." : "Nenhum colaborador encontrado."}
                      </CommandEmpty>
                      <CommandGroup>
                        {colaboradoresFiltrados.map((colaborador: any) => (
                          <CommandItem
                            key={colaborador.id}
                            value={colaborador.nomeCompleto}
                            onSelect={() => {
                              setSelectedColaboradorId(
                                colaborador.id.toString() === selectedColaboradorId ? "" : colaborador.id.toString()
                              );
                              setColaboradorOpen(false);
                              setColaboradorSearch("");
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedColaboradorId === colaborador.id.toString()
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {colaborador.nomeCompleto}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="responsavel">Responsável pela Assinatura</Label>
              <Select value={selectedResponsavelId || undefined} onValueChange={(value) => setSelectedResponsavelId(value || "")}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Selecione um responsável (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {responsaveis.map((responsavel: any) => (
                    <SelectItem key={responsavel.id} value={responsavel.id.toString()}>
                      {responsavel.nomeCompleto} - {responsavel.funcao || "Sem função"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {modeloSelecionado && datasRealizacao.length > 0 && (
              <div className="space-y-2">
                <Label>Datas de Realização *</Label>
                {datasRealizacao.map((data, index) => (
                  <div key={index}>
                    <Input
                      type="date"
                      value={data}
                      onChange={(e) => {
                        const novasDatas = [...datasRealizacao];
                        novasDatas[index] = e.target.value;
                        setDatasRealizacao(novasDatas);
                      }}
                      placeholder={`Data ${index + 1}`}
                      className="mt-1"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={handleVisualizar}
                disabled={!selectedModeloId || !selectedColaboradorId}
              >
                <Eye className="mr-2 h-4 w-4" />
                Visualizar
              </Button>
              <Button
                onClick={handleDownload}
                disabled={!selectedModeloId || !selectedColaboradorId || !previewHtml}
              >
                <Download className="mr-2 h-4 w-4" />
                Gerar Certificado
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Dialog de Preview */}
        {previewDialogOpen && (
          <div 
            className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setPreviewDialogOpen(false);
              }
            }}
          >
            <div 
              className="bg-white rounded-lg shadow-2xl flex flex-col w-full h-full max-w-[98vw] max-h-[98vh] relative z-[10000]"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
                <h2 className="text-xl font-semibold">Visualizar Certificado</h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Label className="text-sm">Orientação:</Label>
                    <Select
                      value={orientacaoPreview}
                      onValueChange={(value: "portrait" | "landscape") => {
                        setOrientacaoPreview(value);
                      }}
                    >
                      <SelectTrigger 
                        className="w-40"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent 
                        className="z-[10001]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SelectItem 
                          value="landscape"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Paisagem
                        </SelectItem>
                        <SelectItem 
                          value="portrait"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Retrato
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setPreviewDialogOpen(false);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setPreviewDialogOpen(false);
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
                {previewHtml && (
                  <div 
                    key={`preview-${selectedModeloId}-${orientacaoPreview}`}
                    className="bg-white shadow-2xl"
                    style={{
                      width: orientacaoPreview === "landscape" ? "297mm" : "210mm",
                      height: orientacaoPreview === "landscape" ? "210mm" : "297mm",
                      transform: orientacaoPreview === "landscape" 
                        ? "scale(0.75)" 
                        : "scale(0.65)",
                      transformOrigin: "center center",
                      transition: "transform 0.2s ease",
                      minWidth: orientacaoPreview === "landscape" ? "297mm" : "210mm",
                      minHeight: orientacaoPreview === "landscape" ? "210mm" : "297mm",
                    }}
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Lista de Certificados Emitidos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Certificados Emitidos</CardTitle>
              {selectedIds.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteMany}
                  disabled={deleteManyMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Selecionados ({selectedIds.length})
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <Label htmlFor="search">Pesquisar por Nome</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Buscar por nome..."
                    value={searchCertificados}
                    onChange={(e) => {
                      setSearchCertificados(e.target.value);
                      setSelectedIds([]);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="empresa">Filtrar por Empresa</Label>
                <Select value={filtroEmpresa || "all"} onValueChange={(value) => setFiltroEmpresa(value === "all" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as empresas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as empresas</SelectItem>
                    {empresas?.map((empresa: any) => (
                      <SelectItem key={empresa.id} value={empresa.id.toString()}>
                        {empresa.razaoSocial}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="mes">Filtrar por Mês</Label>
                <Select value={filtroMes || "all"} onValueChange={(value) => setFiltroMes(value === "all" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os meses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os meses</SelectItem>
                    <SelectItem value="1">Janeiro</SelectItem>
                    <SelectItem value="2">Fevereiro</SelectItem>
                    <SelectItem value="3">Março</SelectItem>
                    <SelectItem value="4">Abril</SelectItem>
                    <SelectItem value="5">Maio</SelectItem>
                    <SelectItem value="6">Junho</SelectItem>
                    <SelectItem value="7">Julho</SelectItem>
                    <SelectItem value="8">Agosto</SelectItem>
                    <SelectItem value="9">Setembro</SelectItem>
                    <SelectItem value="10">Outubro</SelectItem>
                    <SelectItem value="11">Novembro</SelectItem>
                    <SelectItem value="12">Dezembro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="ano">Filtrar por Ano</Label>
                <Select value={filtroAno || "all"} onValueChange={(value) => setFiltroAno(value === "all" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os anos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os anos</SelectItem>
                    {Array.from({ length: 10 }, (_, i) => {
                      const ano = new Date().getFullYear() - i;
                      return (
                        <SelectItem key={ano} value={ano.toString()}>
                          {ano}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {(searchCertificados || filtroEmpresa || filtroMes || filtroAno) && (
              <div className="mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchCertificados("");
                    setFiltroEmpresa("");
                    setFiltroMes("");
                    setFiltroAno("");
                    setSelectedIds([]);
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar Filtros
                </Button>
              </div>
            )}

            {isLoadingCertificados ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando certificados...
              </div>
            ) : certificadosEmitidos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum certificado emitido ainda.
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={certificadosEmitidos.length > 0 && certificadosEmitidos.every((c: any) => selectedIds.includes(c.id))}
                          onCheckedChange={handleSelectAll}
                          aria-label="Selecionar todos"
                        />
                      </TableHead>
                      <TableHead>Colaborador</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Data de Emissão</TableHead>
                      <TableHead>Datas de Realização</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {certificadosEmitidos.map((certificado: any) => {
                      const datas = certificado.datasRealizacao 
                        ? JSON.parse(certificado.datasRealizacao || "[]") 
                        : [];
                      const datasFormatadas = datas
                        .map((d: string) => {
                          if (!d) return "";
                          return new Date(d).toLocaleDateString('pt-BR');
                        })
                        .filter(Boolean)
                        .join(", ");
                      
                      return (
                        <TableRow key={certificado.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.includes(certificado.id)}
                              onCheckedChange={() => handleToggleSelect(certificado.id)}
                              aria-label={`Selecionar ${certificado.nomeColaborador}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {certificado.nomeColaborador}
                          </TableCell>
                          <TableCell>
                            {certificado.nomeEmpresa || "-"}
                          </TableCell>
                          <TableCell>
                            {new Date(certificado.dataEmissao).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            {datasFormatadas || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleVisualizarCertificado(certificado.htmlGerado, certificado)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Visualizar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Remover fundo acinzentado do conteúdo programático antes de imprimir
                                  let htmlProcessado = certificado.htmlGerado;
                                  
                                  // Buscar dados do colaborador para adicionar cargo e RG
                                  const colaborador = colaboradores.find((c: any) => c.id === certificado.colaboradorId);
                                  const cargoColaborador = colaborador?.nomeCargo || colaborador?.funcao || "";
                                  const rgColaborador = colaborador?.rg || certificado.rgColaborador || "";
                                  const nomeColaborador = certificado.nomeColaborador || "";
                                  
                                  // FORÇAR atualização da estrutura de assinatura para incluir cargo e RG
                                  // Verificar se a primeira assinatura (do colaborador) tem cargo e RG
                                  if (nomeColaborador && (!htmlProcessado.includes('RG: ' + rgColaborador) || !htmlProcessado.includes(cargoColaborador))) {
                                    // Tentar encontrar a estrutura de assinatura do colaborador e adicionar cargo/RG
                                    const padroesAssinatura = [
                                      /(<div[^>]*style="[^"]*display:\s*flex[^"]*flex-direction:\s*column[^"]*align-items:\s*center[^"]*">\s*<div[^>]*style="[^"]*width:\s*192px[^"]*border-top:[^"]*"><\/div>\s*<p[^>]*>([^<]+)<\/p>)(\s*(?:<p[^>]*>.*?<\/p>)?\s*)(<\/div>)/gi,
                                      /(<div[^>]*class="assinatura"[^>]*>\s*<div[^>]*class="assinatura-linha"[^"]*><\/div>\s*<p[^>]*class="assinatura-nome"[^>]*>([^<]+)<\/p>)(\s*(?:<p[^>]*>.*?<\/p>)?\s*)(<\/div>)/gi,
                                      /(<div[^>]*>\s*<div[^>]*><\/div>\s*<p[^>]*>([^<]+)<\/p>)(\s*(?:<p[^>]*>.*?<\/p>)?\s*)(<\/div>)/gi,
                                    ];
                                    
                                    for (const padrao of padroesAssinatura) {
                                      const match = htmlProcessado.match(padrao);
                                      if (match && match[0] && match[0].includes(nomeColaborador)) {
                                        htmlProcessado = htmlProcessado.replace(
                                          padrao,
                                          (matchStr: string, p1: string, p2: string, p3: string, p4: string) => {
                                            if (!matchStr.includes('RG:') && !matchStr.includes(cargoColaborador)) {
                                              return p1 + 
                                                '\n          <p style="font-size: 10px; line-height: 1.2; color: #374151; margin: 0; padding: 0; margin-top: 1px;">\n            ' + (cargoColaborador || '') + 
                                                '\n          </p>\n          <p style="font-size: 10px; line-height: 1.2; color: #374151; margin: 0; padding: 0; margin-top: 1px;">\n            RG: ' + (rgColaborador || '') + 
                                                '\n          </p>\n        ' + p4;
                                            }
                                            return matchStr;
                                          }
                                        );
                                        break;
                                      }
                                    }
                                    
                                    // Se não encontrou pelo padrão, tentar substituição direta após o nome
                                    if (!htmlProcessado.includes('RG: ' + rgColaborador)) {
                                      htmlProcessado = htmlProcessado.replace(
                                        new RegExp(`(<p[^>]*>${nomeColaborador.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<\/p>)(\\s*(?:<p[^>]*>.*?<\/p>)?\\s*)(<\/div>)`, 'gi'),
                                        (match: string, p1: string, p2: string, p3: string) => {
                                          if (!match.includes('RG:') && !match.includes(cargoColaborador)) {
                                            return p1 + 
                                              '\n          <p style="font-size: 10px; line-height: 1.2; color: #374151; margin: 0; padding: 0; margin-top: 1px;">\n            ' + (cargoColaborador || '') + 
                                              '\n          </p>\n          <p style="font-size: 10px; line-height: 1.2; color: #374151; margin: 0; padding: 0; margin-top: 1px;">\n            RG: ' + (rgColaborador || '') + 
                                              '\n          </p>\n        ' + p3;
                                          }
                                          return match;
                                        }
                                      );
                                    }
                                  }
                                  
                                  // Remover placeholder [NOME DO TREINAMENTO] do HTML
                                  htmlProcessado = htmlProcessado.replace(/\s+de\s+\[NOME DO TREINAMENTO\]\s*,/gi, "");
                                  htmlProcessado = htmlProcessado.replace(/\s+de\s+\[NOME DO TREINAMENTO\]/gi, "");
                                  htmlProcessado = htmlProcessado.replace(/\[NOME DO TREINAMENTO\]/g, "");
                                  
                                  // FORÇAR atualização do rodapé e assinaturas - SEMPRE atualizar
                                  htmlProcessado = htmlProcessado.replace(/(\.rodape\s*\{[^}]*bottom:\s*)[^;]+(;)/gi, '$1 3cm$2');
                                  htmlProcessado = htmlProcessado.replace(/(\.endereco-treinamento\s*\{[^}]*bottom:\s*)[^;]+(;)/gi, '$1 2.5cm$2');
                                  // Ajustar CSS de assinaturas conforme especificações
                                  htmlProcessado = htmlProcessado.replace(/(\.assinaturas[^}]*gap:\s*)[^;]+(;)/gi, '$1 96px$2');
                                  htmlProcessado = htmlProcessado.replace(/(\.assinaturas[^}]*justify-content:\s*)[^;]+(;)/gi, '$1 space-between$2');
                                  htmlProcessado = htmlProcessado.replace(/(\.assinaturas[^}]*margin-top:\s*)[^;]+(;)/gi, '$1 64px$2');
                                  htmlProcessado = htmlProcessado.replace(/(\.assinatura[^}]*display:\s*)[^;]+(;)/gi, '$1 flex$2');
                                  htmlProcessado = htmlProcessado.replace(/(\.assinatura[^}]*flex-direction:\s*)[^;]+(;)/gi, '$1 column$2');
                                  htmlProcessado = htmlProcessado.replace(/(\.assinatura[^}]*align-items:\s*)[^;]+(;)/gi, '$1 center$2');
                                  htmlProcessado = htmlProcessado.replace(/(\.assinatura-linha[^}]*width:\s*)[^;]+(;)/gi, '$1 192px$2');
                                  htmlProcessado = htmlProcessado.replace(/(\.assinatura-linha[^}]*border-top:\s*)[^;]+(;)/gi, '$1 1px solid #000000$2');
                                  htmlProcessado = htmlProcessado.replace(/(\.assinatura-linha[^}]*margin-bottom:\s*)[^;]+(;)/gi, '$1 2px$2');
                                  htmlProcessado = htmlProcessado.replace(/(\.assinatura-nome[^}]*font-size:\s*)[^;]+(;)/gi, '$1 12px$2');
                                  htmlProcessado = htmlProcessado.replace(/(\.assinatura-nome[^}]*font-weight:\s*)[^;]+(;)/gi, '$1 600$2');
                                  htmlProcessado = htmlProcessado.replace(/(\.assinatura-nome[^}]*line-height:\s*)[^;]+(;)/gi, '$1 1.25$2');
                                  htmlProcessado = htmlProcessado.replace(/(\.assinatura-nome[^}]*color:\s*)[^;]+(;)/gi, '$1 #000000$2');
                                  htmlProcessado = htmlProcessado.replace(/(\.assinatura-cargo[^}]*font-size:\s*)[^;]+(;)/gi, '$1 10px$2');
                                  htmlProcessado = htmlProcessado.replace(/(\.assinatura-cargo[^}]*line-height:\s*)[^;]+(;)/gi, '$1 1.25$2');
                                  htmlProcessado = htmlProcessado.replace(/(\.assinatura-cargo[^}]*color:\s*)[^;]+(;)/gi, '$1 #374151$2');
                                  
                                  // Adicionar/atualizar CSS de assinaturas se não existir ou atualizar
                                  const cssAssinaturas = `.rodape { position: absolute; bottom: 3cm !important; left: 0; right: 0; width: 100%; padding: 0 50px; z-index: 1 !important; }
    .endereco-treinamento { position: absolute; bottom: 0.5cm !important; left: 50px; font-size: 10px; color: #000000; opacity: 0.7; z-index: 0 !important; max-width: 400px !important; }
    .assinaturas { display: flex !important; justify-content: space-between !important; gap: 96px !important; margin-top: 64px !important; align-items: flex-start !important; }
    .assinatura { display: flex !important; flex-direction: column !important; align-items: center !important; }
    .assinatura-linha { width: 192px !important; border-top: 1px solid #000000 !important; margin-bottom: 2px !important; }
    .assinatura-nome { font-size: 12px !important; font-weight: 600 !important; line-height: 1.25 !important; color: #000000 !important; }
    .assinatura-cargo { font-size: 10px !important; line-height: 1.25 !important; color: #374151 !important; }`;
                                  if (htmlProcessado.includes('</style>')) {
                                    // Remover CSS antigo de assinaturas se existir
                                    htmlProcessado = htmlProcessado.replace(/\.rodape\s*\{[^}]*\}/gi, '');
                                    htmlProcessado = htmlProcessado.replace(/\.endereco-treinamento\s*\{[^}]*\}/gi, '');
                                    htmlProcessado = htmlProcessado.replace(/\.assinatura-linha\s*\{[^}]*\}/gi, '');
                                    htmlProcessado = htmlProcessado.replace(/\.assinatura-nome\s*\{[^}]*\}/gi, '');
                                    htmlProcessado = htmlProcessado.replace(/\.assinatura-cargo\s*\{[^}]*\}/gi, '');
                                    // Adicionar CSS novo
                                    htmlProcessado = htmlProcessado.replace('</style>', '\n    ' + cssAssinaturas + '\n  </style>');
                                  }
                                  
                                  // Converter estrutura antiga para nova: mover data de emissão do rodape para ao lado do conteúdo programático
                                  if (htmlProcessado.includes('rodape-data') || (htmlProcessado.includes('[DATA DE EMISSÃO]') && !htmlProcessado.includes('data-emissao-lateral'))) {
                                    htmlProcessado = htmlProcessado.replace(/<div[^>]*class="rodape-data"[^>]*>.*?<\/div>/gi, '');
                                    if (!htmlProcessado.includes('conteudo-programatico-wrapper')) {
                                      htmlProcessado = htmlProcessado.replace(
                                        /(<div[^>]*class="conteudo-programatico"[^>]*>[\s\S]*?<\/div>)/gi,
                                        '<div class="conteudo-programatico-wrapper">$1<div class="data-emissao-lateral">[DATA DE EMISSÃO]</div></div>'
                                      );
                                    }
                                  }
                                  if (!htmlProcessado.includes('.conteudo-programatico-wrapper')) {
                                    const cssWrapper = `.conteudo-programatico-wrapper { display: flex; justify-content: space-between; align-items: flex-start; margin: 12px 0; gap: 20px; }
    .conteudo-programatico { flex: 1; padding: 8px 12px; background: transparent; }
    .data-emissao-lateral { text-align: right; font-size: 12px; color: #000000; white-space: nowrap; padding-top: 8px; }`;
                                    if (htmlProcessado.includes('</style>')) {
                                      htmlProcessado = htmlProcessado.replace('</style>', '\n    ' + cssWrapper + '\n  </style>');
                                    }
                                  }
                                  
                                  // Pós-processamento AGGRESSIVO: corrigir TODOS os padrões problemáticos no HTML final
                                  // Remover "Participou do treinamento de ," (com vírgula após "de")
                                  htmlProcessado = htmlProcessado.replace(/Participou\s+do\s+treinamento\s+de\s*,\s*/gi, "Participou do treinamento ");
                                  htmlProcessado = htmlProcessado.replace(/Participou\s+do\s+treinamento\s+de\s*,\s*Treinamento/gi, "Participou do treinamento ");
                                  
                                  // Remover "treinamento de ," em qualquer lugar
                                  htmlProcessado = htmlProcessado.replace(/treinamento\s+de\s*,\s*/gi, "treinamento ");
                                  htmlProcessado = htmlProcessado.replace(/treinamento\s+de\s*,\s*Treinamento/gi, "treinamento ");
                                  
                                  // Remover ", Treinamento" quando aparecer após vírgula
                                  htmlProcessado = htmlProcessado.replace(/,\s*Treinamento\b/gi, "");
                                  
                                  // Remover "Participou do treinamento Treinamento" (duplicação)
                                  htmlProcessado = htmlProcessado.replace(/Participou\s+do\s+treinamento\s+Treinamento/gi, "Participou do treinamento ");
                                  
                                  // Remover vírgulas duplas ou múltiplas
                                  htmlProcessado = htmlProcessado.replace(/,\s*,+/g, ",");
                                  htmlProcessado = htmlProcessado.replace(/,\s*,\s*/g, ", ");
                                  
                                  // Limpar espaços múltiplos
                                  htmlProcessado = htmlProcessado.replace(/\s{2,}/g, " ");
                                  
                                  htmlProcessado = htmlProcessado.replace(/(\.conteudo-programatico\s*\{)([^}]*)(background:\s*[^;]+)([^}]*)(\})/gi, (match: string, p1: string, p2: string, p3: string, p4: string, p5: string) => {
                                    let newContent = p2.replace(/background:\s*[^;]+;?\s*/gi, '');
                                    newContent = newContent.replace(/border-radius:\s*[^;]+;?\s*/gi, '');
                                    return p1 + newContent + 'background: transparent; ' + p5;
                                  });
                                  
                                  htmlProcessado = htmlProcessado.replace(/background:\s*rgba\(0,\s*0,\s*0,\s*0\.?\d*\)/gi, 'background: transparent');
                                  
                                  const printWindow = window.open("", "_blank");
                                  if (printWindow) {
                                    // Adicionar CSS de impressão para evitar quebra de página
                                    let htmlComPrint = htmlProcessado;
                                    const cssPrint = `
    @page { size: auto; margin: 0; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
    @media print {
      html, body { margin: 0; padding: 0; overflow: hidden; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
      .certificado { page-break-after: avoid !important; page-break-inside: avoid !important; break-inside: avoid !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
      .cabecalho { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; background: #1e40af !important; background-color: #1e40af !important; color: #ffffff !important; }
      .conteudo { page-break-inside: avoid !important; break-inside: avoid !important; }
      .rodape { page-break-inside: avoid !important; break-inside: avoid !important; }
    }`;
                                    
                                    if (htmlComPrint.includes('</style>')) {
                                      htmlComPrint = htmlComPrint.replace('</style>', cssPrint + '\n  </style>');
                                    } else if (htmlComPrint.includes('</head>')) {
                                      htmlComPrint = htmlComPrint.replace('</head>', '<style>' + cssPrint + '</style>\n</head>');
                                    }
                                    printWindow.document.write(htmlComPrint);
                                    printWindow.document.close();
                                    // Aguardar um pouco para garantir que o conteúdo foi carregado
                                    setTimeout(() => {
                                      printWindow.print();
                                    }, 250);
                                  }
                                }}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Baixar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteCertificado(certificado.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Confirmação de Exclusão */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este certificado? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setCertificadoToDelete(null)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-500 hover:bg-red-600"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
  );

  if (showLayout) {
    return <DashboardLayout>{content}</DashboardLayout>;
  }

  return content;
}

