import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Check, ChevronsUpDown, Download, Printer, FileText, Trash2, Eye, Calendar, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import jsPDF from "jspdf";

export default function EmitirFichaEPI({ showLayout = true }: { showLayout?: boolean }) {
  const [empresaId, setEmpresaId] = useState<string>("");
  const [colaboradorId, setColaboradorId] = useState<string>("");
  const [empresaOpen, setEmpresaOpen] = useState(false);
  const [colaboradorOpen, setColaboradorOpen] = useState(false);
  const [empresaSearch, setEmpresaSearch] = useState("");
  const [colaboradorSearch, setColaboradorSearch] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFichas, setSelectedFichas] = useState<Set<number>>(new Set());

  const { data: empresas = [] } = trpc.empresas.list.useQuery();
  const { data: colaboradores = [] } = trpc.colaboradores.list.useQuery();
  const { data: fichasEmitidas = [], isLoading: isLoadingFichas } = trpc.epis.fichasEmitidas.useQuery();
  const utils = trpc.useUtils();
  
  const deleteFichaMutation = trpc.epis.deleteFichaEmitida.useMutation({
    onSuccess: () => {
      utils.epis.fichasEmitidas.invalidate();
      setSelectedFichas(new Set());
      toast.success("Ficha excluída com sucesso!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir ficha: ${error.message}`);
    },
  });

  // Filtrar fichas emitidas
  const fichasFiltradas = useMemo(() => {
    if (!searchTerm.trim()) return fichasEmitidas;
    const termo = searchTerm.toLowerCase();
    return fichasEmitidas.filter((ficha: any) =>
      ficha.colaboradorNome?.toLowerCase().includes(termo) ||
      ficha.empresaNome?.toLowerCase().includes(termo) ||
      ficha.nomeArquivo?.toLowerCase().includes(termo)
    );
  }, [fichasEmitidas, searchTerm]);

  // Seleção de todas as fichas
  const todasSelecionadas = fichasFiltradas.length > 0 && selectedFichas.size === fichasFiltradas.length;
  const algumasSelecionadas = selectedFichas.size > 0 && selectedFichas.size < fichasFiltradas.length;

  const handleToggleAll = () => {
    if (todasSelecionadas) {
      setSelectedFichas(new Set());
    } else {
      setSelectedFichas(new Set(fichasFiltradas.map((f: any) => f.id)));
    }
  };

  const handleToggleFicha = (id: number) => {
    const newSelected = new Set(selectedFichas);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedFichas(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedFichas.size === 0) {
      toast.error("Selecione pelo menos uma ficha para excluir");
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir ${selectedFichas.size} ficha(s)?`)) {
      return;
    }

    // Excluir em lote
    const promises = Array.from(selectedFichas).map((id) =>
      deleteFichaMutation.mutateAsync({ id })
    );

    try {
      await Promise.all(promises);
      toast.success(`${selectedFichas.size} ficha(s) excluída(s) com sucesso!`);
      setSelectedFichas(new Set());
    } catch (error: any) {
      toast.error(`Erro ao excluir fichas: ${error.message}`);
    }
  };

  const handleDownloadSelected = () => {
    if (selectedFichas.size === 0) {
      toast.error("Selecione pelo menos uma ficha para baixar");
      return;
    }

    const fichasParaDownload = fichasFiltradas.filter((f: any) => selectedFichas.has(f.id));
    let sucesso = 0;
    let erros = 0;
    
    fichasParaDownload.forEach((ficha: any) => {
      if (ficha.urlArquivo) {
        // Verificar se é uma URL de blob (temporária)
        if (ficha.urlArquivo.startsWith("blob:")) {
          erros++;
          return;
        }
        // Converter URL relativa para absoluta se necessário
        const urlCompleta = ficha.urlArquivo.startsWith("http") 
          ? ficha.urlArquivo 
          : `${window.location.origin}${ficha.urlArquivo}`;
        const link = document.createElement("a");
        link.href = urlCompleta;
        link.download = ficha.nomeArquivo || `ficha_epi_${ficha.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        sucesso++;
      } else {
        erros++;
      }
    });

    if (sucesso > 0) {
      toast.success(`${sucesso} ficha(s) baixada(s) com sucesso!`);
    }
    if (erros > 0) {
      toast.warning(`${erros} ficha(s) não puderam ser baixadas (geradas antes da atualização)`);
    }
  };

  const handleDownloadFicha = (ficha: any) => {
    if (ficha.urlArquivo) {
      // Verificar se é uma URL de blob (temporária)
      if (ficha.urlArquivo.startsWith("blob:")) {
        toast.error("Esta ficha foi gerada antes da atualização. Por favor, gere uma nova ficha.");
        return;
      }
      // Converter URL relativa para absoluta se necessário
      const urlCompleta = ficha.urlArquivo.startsWith("http") 
        ? ficha.urlArquivo 
        : `${window.location.origin}${ficha.urlArquivo}`;
      const link = document.createElement("a");
      link.href = urlCompleta;
      link.download = ficha.nomeArquivo || `ficha_epi_${ficha.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Ficha baixada com sucesso!");
    } else {
      toast.error("URL da ficha não disponível");
    }
  };

  // Filtrar empresas
  const empresasFiltradas = useMemo(() => {
    if (!empresaSearch.trim()) return empresas;
    const termo = empresaSearch.toLowerCase();
    return empresas.filter((e: any) =>
      e.razaoSocial?.toLowerCase().includes(termo) ||
      e.cnpj?.toLowerCase().includes(termo)
    );
  }, [empresas, empresaSearch]);

  // Filtrar colaboradores por empresa selecionada
  const colaboradoresFiltrados = useMemo(() => {
    let filtrados = colaboradores;
    if (empresaId) {
      filtrados = filtrados.filter((c: any) => c.empresaId.toString() === empresaId);
    }
    if (colaboradorSearch.trim()) {
      const termo = colaboradorSearch.toLowerCase();
      filtrados = filtrados.filter((c: any) =>
        c.nomeCompleto?.toLowerCase().includes(termo)
      );
    }
    return filtrados;
  }, [colaboradores, empresaId, colaboradorSearch]);

  const empresaSelecionada = empresas.find((e: any) => e.id.toString() === empresaId);
  const colaboradorSelecionado = colaboradores.find((c: any) => c.id.toString() === colaboradorId);

  const generatePdfMutation = trpc.epis.generateFichaPDF.useMutation({
    onSuccess: (data) => {
      setIsGenerating(false);
      if (data && data.dados) {
        gerarPDF(data.dados);
      } else {
        toast.error("Erro ao obter dados para gerar PDF");
      }
    },
    onError: (error) => {
      setIsGenerating(false);
      console.error("Erro na mutation:", error);
      toast.error(`Erro ao gerar PDF: ${error.message || "Erro desconhecido"}`);
    },
  });
  
  const saveFichaMutation = trpc.epis.saveFichaPDF.useMutation({
    onSuccess: (data) => {
      utils.epis.fichasEmitidas.invalidate();
      // Atualizar URL com a URL permanente do servidor
      if (data?.url) {
        // Revogar URL temporária se existir
        if (pdfUrl && pdfUrl.startsWith("blob:")) {
          URL.revokeObjectURL(pdfUrl);
        }
        // Converter URL relativa para absoluta se necessário
        const urlCompleta = data.url.startsWith("http") ? data.url : `${window.location.origin}${data.url}`;
        setPdfUrl(urlCompleta);
      }
    },
    onError: (error: any) => {
      console.error("Erro ao salvar ficha:", error);
      toast.error(`Erro ao salvar ficha: ${error.message}`);
    },
  });

  const gerarPDF = (dados: any) => {
    try {
      if (!dados || !dados.empresa || !dados.colaborador) {
        throw new Error("Dados incompletos para gerar PDF");
      }

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Configurações
      const margin = 20;
      const pageWidth = 210;
      const pageHeight = 297;
      let y = margin;

      // Título
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      const title = "FICHA DE ADMISSÃO DE FORNECIMENTO DE EQUIPAMENTO DE PROTEÇÃO INDIVIDUAL - EPI";
      const titleWidth = pdf.getTextWidth(title);
      pdf.text(title, (pageWidth - titleWidth) / 2, y);
      y += 15;

      // Cabeçalho com informações - Layout em 3 linhas
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      
      const lineHeight = 10;
      
      // Linha 1: Empresa e CNPJ
      pdf.setFont("helvetica", "bold");
      pdf.text("Empresa:", margin, y);
      pdf.setFont("helvetica", "normal");
      const empresa = dados.empresa?.razaoSocial || "";
      pdf.text(empresa, margin + 22, y);
      
      pdf.setFont("helvetica", "bold");
      pdf.text("CNPJ:", margin + 120, y);
      pdf.setFont("helvetica", "normal");
      const cnpj = dados.empresa?.cnpj || "";
      pdf.text(cnpj, margin + 142, y);
      y += lineHeight;

      // Linha 2: Nome e RG
      pdf.setFont("helvetica", "bold");
      pdf.text("Nome:", margin, y);
      pdf.setFont("helvetica", "normal");
      const nome = dados.colaborador?.nomeCompleto || "";
      pdf.text(nome, margin + 22, y);
      
      pdf.setFont("helvetica", "bold");
      pdf.text("RG:", margin + 120, y);
      pdf.setFont("helvetica", "normal");
      const rg = dados.colaborador?.rg || "";
      pdf.text(rg, margin + 142, y);
      y += lineHeight;

      // Linha 3: Cargo e Data de Admissão
      pdf.setFont("helvetica", "bold");
      pdf.text("Cargo:", margin, y);
      pdf.setFont("helvetica", "normal");
      const cargo = dados.colaborador?.nomeCargo || "";
      pdf.text(cargo, margin + 22, y);
      
      pdf.setFont("helvetica", "bold");
      const dataLabel = "Data de Admissão:";
      pdf.text(dataLabel, margin + 120, y);
      pdf.setFont("helvetica", "normal");
      const dataAdm = dados.colaborador?.dataAdmissao
        ? new Date(dados.colaborador.dataAdmissao).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
          })
        : "";
      const dataLabelWidth = pdf.getTextWidth(dataLabel);
      pdf.text(dataAdm, margin + 120 + dataLabelWidth + 2, y);
      y += lineHeight + 5;

      // Termo de Responsabilidade
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      
      const termoTexto = [
        "Declaro ter recebido (a) equipamento (s) de proteção (ões) individual (ais) descritos nessa ficha, destinados ao meu uso pessoal durante o serviço.",
        "",
        "Declaro ter recebido treinamento(s) e orientação (ões) sobre o uso, guarda e conservação dos mesmos, responsabilizando-me também por sua devolução à empresa na eventual rescisão do meu contrato de trabalho, ou quando não mais se fizerem necessários ao fim a que se destinam.",
        "",
        "Conforme descrito na 6.7.1 da NR-6 e artigo 461 da CLT, o prejuízo de corrente do extravio ou danificação do equipamento a mim confiado poderá ser descontado do meu salário, salvo quando causado pelo desgaste natural de utilização."
      ];

      const contentWidth = pageWidth - (margin * 2);
      
      termoTexto.forEach((paragrafo) => {
        if (paragrafo === "") {
          y += 5;
        } else {
          const lines = pdf.splitTextToSize(paragrafo, contentWidth);
          lines.forEach((line: string) => {
            if (y > pageHeight - margin - 20) {
              pdf.addPage();
              y = margin;
            }
            pdf.text(line, margin, y);
            y += 6;
          });
        }
      });

      y += 10;

      // Nome do colaborador e assinatura
      pdf.setFontSize(10);
      
      const linhaAssinaturaY = y + 10;
      pdf.setDrawColor(0, 0, 0);
      pdf.line(margin, linhaAssinaturaY, margin + 80, linhaAssinaturaY);
      
      pdf.setFont("helvetica", "bold");
      const nomeColaborador = dados.colaborador?.nomeCompleto || "";
      const nomeWidth = pdf.getTextWidth(nomeColaborador);
      const nomeX = margin + 40 - (nomeWidth / 2);
      pdf.text(nomeColaborador, nomeX, linhaAssinaturaY + 8);
      
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      const assinaturaText = "Assinatura";
      const assinaturaWidth = pdf.getTextWidth(assinaturaText);
      pdf.text(assinaturaText, margin + 40 - (assinaturaWidth / 2), linhaAssinaturaY + 15);

      y = linhaAssinaturaY + 30;

      // Tabela de EPIs registrados
      if (dados.epis && dados.epis.length > 0) {
        if (y > pageHeight - margin - 40) {
          pdf.addPage();
          y = margin;
        }

        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        pdf.text("EQUIPAMENTOS DE PROTEÇÃO INDIVIDUAL REGISTRADOS", margin, y);
        y += 10;

        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        const colWidths = [60, 35, 25, 25, 25];
        const headerY = y;
        
        pdf.text("Tipo de EPI", margin, headerY);
        pdf.text("Data Entrega", margin + colWidths[0], headerY);
        pdf.text("CA", margin + colWidths[0] + colWidths[1], headerY);
        pdf.text("Quantidade", margin + colWidths[0] + colWidths[1] + colWidths[2], headerY);
        pdf.text("Visto", margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], headerY);
        
        pdf.setDrawColor(0, 0, 0);
        const totalWidth = colWidths.reduce((a, b) => a + b, 0);
        pdf.line(margin, headerY + 3, margin + totalWidth, headerY + 3);
        y += 8;

        pdf.setFont("helvetica", "normal");
        dados.epis.forEach((epi: any) => {
          if (y > pageHeight - margin - 15) {
            pdf.addPage();
            y = margin;
          }

          const dataEntrega = epi.dataEntrega
            ? new Date(epi.dataEntrega).toLocaleDateString("pt-BR")
            : "-";
          const ca = epi.caNumero || epi.ca || "-";
          const quantidade = epi.quantidade?.toString().padStart(2, "0") || "01";
          const visto = "";

          const nomeLines = pdf.splitTextToSize(epi.nomeEquipamento || "-", colWidths[0] - 2);
          const lineHeight = 6;
          const maxLines = Math.max(1, nomeLines.length);

          nomeLines.forEach((line: string, idx: number) => {
            pdf.text(line, margin + 1, y + (idx * lineHeight));
          });

          pdf.text(dataEntrega, margin + colWidths[0] + 1, y);
          pdf.text(ca, margin + colWidths[0] + colWidths[1] + 1, y);
          pdf.text(quantidade, margin + colWidths[0] + colWidths[1] + colWidths[2] + 1, y);
          pdf.text(visto, margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 1, y);

          y += maxLines * lineHeight + 2;
        });
      }

      // Gerar PDF como base64 para enviar ao servidor
      const pdfBase64 = pdf.output("datauristring").split(",")[1]; // Remove o prefixo data:application/pdf;base64,
      
      // Salvar registro da ficha emitida no servidor
      const nomeArquivo = `Ficha_EPI_${colaboradorSelecionado?.nomeCompleto?.replace(/\s+/g, "_") || "colaborador"}_${new Date().toISOString().split("T")[0]}_${Date.now()}.pdf`;
      
      // Criar URL temporária para preview imediato
      const blob = pdf.output("blob");
      const tempUrl = URL.createObjectURL(blob);
      setPdfUrl(tempUrl);
      
      // Salvar no servidor (assíncrono, não bloqueia)
      saveFichaMutation.mutate({
        empresaId: parseInt(empresaId),
        colaboradorId: parseInt(colaboradorId),
        nomeArquivo,
        pdfBase64,
      });
      
      toast.success("Ficha de EPI gerada com sucesso!");
    } catch (error: any) {
      console.error("Erro ao gerar PDF:", error);
      toast.error(`Erro ao gerar PDF: ${error?.message || "Erro desconhecido"}`);
    }
  };

  const handleGenerate = () => {
    if (!empresaId || !colaboradorId) {
      toast.error("Selecione a empresa e o colaborador");
      return;
    }

    setIsGenerating(true);
    generatePdfMutation.mutate({
      empresaId: parseInt(empresaId),
      colaboradorId: parseInt(colaboradorId),
    });
  };

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement("a");
      link.href = pdfUrl;
      const nomeArquivo = `Ficha_EPI_${colaboradorSelecionado?.nomeCompleto?.replace(/\s+/g, "_") || "colaborador"}_${new Date().toISOString().split("T")[0]}.pdf`;
      link.download = nomeArquivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePrint = () => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank");
    }
  };

  const content = (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Emitir Ficha de EPI</h1>
        <p className="text-muted-foreground mt-1">
          Gere fichas de admissão de fornecimento de EPI em formato PDF.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Emitir Ficha de Admissão de Fornecimento de EPI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Empresa *</Label>
            <Popover open={empresaOpen} onOpenChange={setEmpresaOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={empresaOpen}
                  className="w-full justify-between"
                >
                  {empresaId
                    ? empresas.find((e: any) => e.id.toString() === empresaId)?.razaoSocial || "Selecione uma empresa"
                    : "Selecione uma empresa"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Buscar empresa por nome ou CNPJ..."
                    value={empresaSearch}
                    onValueChange={setEmpresaSearch}
                  />
                  <CommandList>
                    <CommandEmpty>Nenhuma empresa encontrada.</CommandEmpty>
                    <CommandGroup>
                      {empresasFiltradas.map((empresa: any) => (
                        <CommandItem
                          key={empresa.id}
                          value={empresa.razaoSocial}
                          onSelect={() => {
                            setEmpresaId(empresa.id.toString());
                            setEmpresaOpen(false);
                            setColaboradorId("");
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              empresaId === empresa.id.toString() ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {empresa.razaoSocial} - {empresa.cnpj}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Colaborador *</Label>
            <Popover open={colaboradorOpen} onOpenChange={setColaboradorOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={colaboradorOpen}
                  className="w-full justify-between"
                  disabled={!empresaId}
                >
                  {colaboradorId
                    ? colaboradores.find((c: any) => c.id.toString() === colaboradorId)?.nomeCompleto || "Selecione um colaborador"
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
                    <CommandEmpty>Nenhum colaborador encontrado.</CommandEmpty>
                    <CommandGroup>
                      {colaboradoresFiltrados.map((colaborador: any) => (
                        <CommandItem
                          key={colaborador.id}
                          value={colaborador.nomeCompleto}
                          onSelect={() => {
                            setColaboradorId(colaborador.id.toString());
                            setColaboradorOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              colaboradorId === colaborador.id.toString() ? "opacity-100" : "opacity-0"
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

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleGenerate}
              disabled={!empresaId || !colaboradorId || isGenerating}
              className="flex-1"
            >
              {isGenerating ? "Gerando PDF..." : "Gerar Ficha de EPI"}
            </Button>
            {pdfUrl && (
              <>
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar
                </Button>
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Fichas Emitidas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Fichas de EPI Emitidas
            </CardTitle>
            {selectedFichas.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {selectedFichas.size} selecionada(s)
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadSelected}
                  className="h-8"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Selecionadas
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteSelected}
                  className="h-8"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Selecionadas
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingFichas ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
              <p className="text-gray-500">Carregando fichas...</p>
            </div>
          ) : fichasEmitidas && fichasEmitidas.length > 0 ? (
            <div className="space-y-4">
              {/* Barra de busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por colaborador, empresa ou nome do arquivo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Tabela */}
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={todasSelecionadas}
                          onCheckedChange={handleToggleAll}
                          className={algumasSelecionadas ? "data-[state=checked]:bg-blue-600" : ""}
                        />
                      </TableHead>
                      <TableHead className="font-semibold">Colaborador</TableHead>
                      <TableHead className="font-semibold">Empresa</TableHead>
                      <TableHead className="font-semibold">Nome do Arquivo</TableHead>
                      <TableHead className="font-semibold">Data de Emissão</TableHead>
                      <TableHead className="text-right font-semibold">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fichasFiltradas.length > 0 ? (
                      fichasFiltradas.map((ficha: any) => (
                        <TableRow key={ficha.id} className="hover:bg-gray-50/50 transition-colors">
                          <TableCell>
                            <Checkbox
                              checked={selectedFichas.has(ficha.id)}
                              onCheckedChange={() => handleToggleFicha(ficha.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {ficha.colaboradorNome || "-"}
                          </TableCell>
                      <TableCell>{ficha.empresaNome || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{ficha.nomeArquivo}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {ficha.dataEmissao
                              ? new Date(ficha.dataEmissao).toLocaleDateString("pt-BR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "-"}
                          </span>
                        </div>
                      </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {ficha.urlArquivo && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDownloadFicha(ficha)}
                                    className="h-8 w-8 hover:bg-green-50 hover:text-green-600"
                                    title="Baixar PDF"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      // Verificar se é uma URL de blob (temporária)
                                      if (ficha.urlArquivo && ficha.urlArquivo.startsWith("blob:")) {
                                        toast.error("Esta ficha foi gerada antes da atualização. Por favor, gere uma nova ficha.");
                                        return;
                                      }
                                      if (ficha.urlArquivo) {
                                        // Converter URL relativa para absoluta se necessário
                                        const urlCompleta = ficha.urlArquivo.startsWith("http") 
                                          ? ficha.urlArquivo 
                                          : `${window.location.origin}${ficha.urlArquivo}`;
                                        window.open(urlCompleta, "_blank");
                                      } else {
                                        toast.error("URL da ficha não disponível");
                                      }
                                    }}
                                    className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                                    title="Visualizar PDF"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (confirm("Tem certeza que deseja excluir esta ficha?")) {
                                    deleteFichaMutation.mutate({ id: ficha.id });
                                  }
                                }}
                                className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          Nenhuma ficha encontrada com o termo de busca "{searchTerm}"
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma ficha emitida
              </h3>
              <p className="text-gray-500">
                As fichas de EPI emitidas aparecerão aqui
              </p>
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

