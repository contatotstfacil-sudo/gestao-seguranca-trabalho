import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { Check, ChevronsUpDown, Download, Printer, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface EmissaoFichaEPIProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EmissaoFichaEPI({ open, onOpenChange }: EmissaoFichaEPIProps) {
  const [empresaId, setEmpresaId] = useState<string>("");
  const [colaboradorId, setColaboradorId] = useState<string>("");
  const [empresaOpen, setEmpresaOpen] = useState(false);
  const [colaboradorOpen, setColaboradorOpen] = useState(false);
  const [empresaSearch, setEmpresaSearch] = useState("");
  const [colaboradorSearch, setColaboradorSearch] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: empresas = [] } = trpc.empresas.list.useQuery();
  const { data: colaboradores = [] } = trpc.colaboradores.list.useQuery();

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
      y += 15; // Duas linhas para baixo

      // Cabeçalho com informações - Layout em 3 linhas
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      
      // Espaçamento entre linhas
      const lineHeight = 10;
      
      // Linha 1: Empresa e CNPJ
      pdf.setFont("helvetica", "bold");
      pdf.text("Empresa:", margin, y);
      pdf.setFont("helvetica", "normal");
      const empresa = dados.empresa?.razaoSocial || "";
      pdf.text(empresa, margin + 22, y);
      
      // CNPJ com espaçamento maior à direita
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
      
      // RG com espaçamento maior à direita
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
      
      // Data de Admissão à direita - alinhado com CNPJ e RG
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
      // Calcular posição X do valor para alinhar com outros campos da direita
      const dataLabelWidth = pdf.getTextWidth(dataLabel);
      pdf.text(dataAdm, margin + 120 + dataLabelWidth + 2, y);
      y += lineHeight + 5; // Espaço após cabeçalho

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
          y += 5; // Espaço entre parágrafos
        } else {
          const lines = pdf.splitTextToSize(paragrafo, contentWidth);
          lines.forEach((line: string) => {
            if (y > pageHeight - margin - 20) {
              pdf.addPage();
              y = margin;
            }
            pdf.text(line, margin, y);
            y += 6; // Espaçamento entre linhas
          });
        }
      });

      y += 10; // Espaço após o termo

      // Nome do colaborador e assinatura
      pdf.setFontSize(10);
      
      // Linha para assinatura (80mm de largura)
      const linhaAssinaturaY = y + 10;
      pdf.setDrawColor(0, 0, 0);
      pdf.line(margin, linhaAssinaturaY, margin + 80, linhaAssinaturaY);
      
      // Nome do colaborador centralizado abaixo da linha
      pdf.setFont("helvetica", "bold");
      const nomeColaborador = dados.colaborador?.nomeCompleto || "";
      const nomeWidth = pdf.getTextWidth(nomeColaborador);
      const nomeX = margin + 40 - (nomeWidth / 2); // Centralizar em relação à linha
      pdf.text(nomeColaborador, nomeX, linhaAssinaturaY + 8);
      
      // Texto "Assinatura" abaixo do nome
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      const assinaturaText = "Assinatura";
      const assinaturaWidth = pdf.getTextWidth(assinaturaText);
      pdf.text(assinaturaText, margin + 40 - (assinaturaWidth / 2), linhaAssinaturaY + 15);

      y = linhaAssinaturaY + 30; // Espaço após assinatura

      // Tabela de EPIs registrados
      if (dados.epis && dados.epis.length > 0) {
        // Verificar se precisa de nova página
        if (y > pageHeight - margin - 40) {
          pdf.addPage();
          y = margin;
        }

        // Título da tabela
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        pdf.text("EQUIPAMENTOS DE PROTEÇÃO INDIVIDUAL REGISTRADOS", margin, y);
        y += 10;

        // Cabeçalho da tabela
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        const colWidths = [60, 35, 25, 25, 25]; // Tipo de EPI, Data Entrega, CA, Quantidade, Visto
        const headerY = y;
        
        pdf.text("Tipo de EPI", margin, headerY);
        pdf.text("Data Entrega", margin + colWidths[0], headerY);
        pdf.text("CA", margin + colWidths[0] + colWidths[1], headerY);
        pdf.text("Quantidade", margin + colWidths[0] + colWidths[1] + colWidths[2], headerY);
        pdf.text("Visto", margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], headerY);
        
        // Linha abaixo do cabeçalho
        pdf.setDrawColor(0, 0, 0);
        const totalWidth = colWidths.reduce((a, b) => a + b, 0);
        pdf.line(margin, headerY + 3, margin + totalWidth, headerY + 3);
        y += 8;

        // Dados dos EPIs
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
          const visto = ""; // Campo vazio para visto

          // Quebrar nome do equipamento se muito longo
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

          y += maxLines * lineHeight + 2; // Espaço entre linhas
        });
      }

      // Gerar PDF
      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
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

  const handleClose = () => {
    setEmpresaId("");
    setColaboradorId("");
    setEmpresaSearch("");
    setColaboradorSearch("");
    setPdfUrl(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Emitir Ficha de Admissão de Fornecimento de EPI
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
