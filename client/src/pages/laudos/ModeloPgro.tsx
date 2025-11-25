import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, FileText, Eye } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

type ModeloPgro = {
  id: string;
  nome: string;
  descricao: string;
  objetivos: string;
  fundamentacaoLegal: string;
  informacaoDivulgacao: string;
  periodicidadeAnalise: string;
  monitoramentoExposicao: string;
  analiseExposicao: string;
  responsabilidades: string;
  inventarioReconhecimento: string;
};

export default function ModeloPgro() {
  const inventarioRef = useRef<HTMLDivElement>(null);
  const [modelos, setModelos] = useState<ModeloPgro[]>(() => {
    const saved = localStorage.getItem("modelos-pgro");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migrar modelos antigos que tinham apenas "conteudo"
        const modelosMigrados = parsed.map((m: any) => {
          if (m.conteudo && !m.objetivos) {
            // Modelo antigo - criar campos vazios
            return {
              ...m,
              objetivos: "",
              fundamentacaoLegal: "",
              informacaoDivulgacao: "",
              periodicidadeAnalise: "",
              monitoramentoExposicao: "",
              analiseExposicao: "",
              responsabilidades: "",
              inventarioReconhecimento: "",
            };
          }
          return m;
        });
        // Se não houver modelos, criar o modelo padrão
        if (modelosMigrados.length === 0) {
          const modeloInicial: ModeloPgro = {
            id: "padrao",
            nome: "Modelo PGRO Padrão",
            descricao: "Modelo padrão com estrutura completa de tabelas",
            objetivos: "",
            fundamentacaoLegal: "",
            informacaoDivulgacao: "",
            periodicidadeAnalise: "",
            monitoramentoExposicao: "",
            analiseExposicao: "",
            responsabilidades: "",
            inventarioReconhecimento: "",
          };
          return [modeloInicial];
        }
        return modelosMigrados;
      } catch {
        return [];
      }
    }
    // Criar modelo padrão se não existir nenhum
    const modeloInicial: ModeloPgro = {
      id: "padrao",
      nome: "Modelo PGRO Padrão",
      descricao: "Modelo padrão com estrutura completa de tabelas",
      objetivos: "",
      fundamentacaoLegal: "",
      informacaoDivulgacao: "",
      periodicidadeAnalise: "",
      monitoramentoExposicao: "",
      analiseExposicao: "",
      responsabilidades: "",
      inventarioReconhecimento: "",
    };
    return [modeloInicial];
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    objetivos: "",
    fundamentacaoLegal: "",
    informacaoDivulgacao: "",
    periodicidadeAnalise: "",
    monitoramentoExposicao: "",
    analiseExposicao: "",
    responsabilidades: "",
    inventarioReconhecimento: "",
  });

  const gerarConteudoHTML = (dados: typeof formData) => {
    // Converter quebras de linha para <br> e preservar HTML se houver
    const formatarTexto = (texto: string) => {
      if (!texto) return "";
      // Se já contém HTML (tags), preservar
      if (texto.includes("<img") || texto.includes("<table") || texto.includes("<div")) {
        return texto;
      }
      // Caso contrário, converter quebras de linha
      return texto.replace(/\n/g, "<br>");
    };

    return `PLANO DE GERENCIAMENTO DE RISCOS OCUPACIONAIS - PGRO

<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
  <tr>
    <td style="border: 1px solid #000; padding: 10px; background-color: #f0f0f0; font-weight: bold; width: 30%;">OBJETIVOS</td>
    <td style="border: 1px solid #000; padding: 10px;">
      ${dados.objetivos || ""}
    </td>
  </tr>
</table>

<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
  <tr>
    <td style="border: 1px solid #000; padding: 10px; background-color: #f0f0f0; font-weight: bold; width: 30%;">FUNDAMENTAÇÃO LEGAL</td>
    <td style="border: 1px solid #000; padding: 10px;">
      ${dados.fundamentacaoLegal || ""}
    </td>
  </tr>
</table>

<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
  <tr>
    <td style="border: 1px solid #000; padding: 10px; background-color: #f0f0f0; font-weight: bold; width: 30%;">INFORMAÇÃO/DIVULGAÇÃO DOS DADOS</td>
    <td style="border: 1px solid #000; padding: 10px;">
      ${dados.informacaoDivulgacao || ""}
    </td>
  </tr>
</table>

<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
  <tr>
    <td style="border: 1px solid #000; padding: 10px; background-color: #f0f0f0; font-weight: bold; width: 30%;">PERIODICIDADE E ANÁLISE GLOBAL DO PGR</td>
    <td style="border: 1px solid #000; padding: 10px;">
      ${dados.periodicidadeAnalise || ""}
    </td>
  </tr>
</table>

<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
  <tr>
    <td style="border: 1px solid #000; padding: 10px; background-color: #f0f0f0; font-weight: bold; width: 30%;">MONITORAMENTO DA EXPOSIÇÃO AOS RISCOS</td>
    <td style="border: 1px solid #000; padding: 10px;">
      ${dados.monitoramentoExposicao || ""}
    </td>
  </tr>
</table>

<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
  <tr>
    <td style="border: 1px solid #000; padding: 10px; background-color: #f0f0f0; font-weight: bold; width: 30%;">ANÁLISE DE EXPOSIÇÃO DOS RISCOS</td>
    <td style="border: 1px solid #000; padding: 10px;">
      ${dados.analiseExposicao || ""}
    </td>
  </tr>
</table>

<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
  <tr>
    <td style="border: 1px solid #000; padding: 10px; background-color: #f0f0f0; font-weight: bold; width: 30%;">RESPONSABILIDADES</td>
    <td style="border: 1px solid #000; padding: 10px;">
      ${dados.responsabilidades || ""}
    </td>
  </tr>
</table>

<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
  <tr>
    <td style="border: 1px solid #000; padding: 10px; background-color: #f0f0f0; font-weight: bold; width: 30%;">INVENTÁRIO DE RECONHECIMENTO AVALIAÇÃO E CONTROLE</td>
    <td style="border: 1px solid #000; padding: 10px;">
      ${formatarTexto(dados.inventarioReconhecimento)}
    </td>
  </tr>
</table>

`;
  };

  const salvarModelos = (novosModelos: ModeloPgro[]) => {
    setModelos(novosModelos);
    localStorage.setItem("modelos-pgro", JSON.stringify(novosModelos));
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      descricao: "",
      objetivos: "",
      fundamentacaoLegal: "",
      informacaoDivulgacao: "",
      periodicidadeAnalise: "",
      monitoramentoExposicao: "",
      analiseExposicao: "",
      responsabilidades: "",
      inventarioReconhecimento: "",
    });
    setEditingId(null);
    if (inventarioRef.current) {
      inventarioRef.current.innerHTML = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast.error("Nome do modelo é obrigatório");
      return;
    }

    if (editingId) {
      const novosModelos = modelos.map((m) =>
        m.id === editingId
          ? { ...m, ...formData }
          : m
      );
      salvarModelos(novosModelos);
      toast.success("Modelo atualizado com sucesso!");
    } else {
      const novoModelo: ModeloPgro = {
        id: Date.now().toString(),
        ...formData,
      };
      salvarModelos([...modelos, novoModelo]);
      toast.success("Modelo criado com sucesso!");
    }

    setDialogOpen(false);
    resetForm();
  };

  const handleEdit = (modelo: ModeloPgro) => {
    setEditingId(modelo.id);
    setFormData({
      nome: modelo.nome,
      descricao: modelo.descricao,
      objetivos: modelo.objetivos || "",
      fundamentacaoLegal: modelo.fundamentacaoLegal || "",
      informacaoDivulgacao: modelo.informacaoDivulgacao || "",
      periodicidadeAnalise: modelo.periodicidadeAnalise || "",
      monitoramentoExposicao: modelo.monitoramentoExposicao || "",
      analiseExposicao: modelo.analiseExposicao || "",
      responsabilidades: modelo.responsabilidades || "",
      inventarioReconhecimento: modelo.inventarioReconhecimento || "",
    });
    setDialogOpen(true);
    // Atualizar o conteúdo do editor após um pequeno delay
    setTimeout(() => {
      if (inventarioRef.current) {
        inventarioRef.current.innerHTML = modelo.inventarioReconhecimento || "";
      }
    }, 100);
  };

  useEffect(() => {
    if (dialogOpen && inventarioRef.current) {
      // Só atualizar se o conteúdo for diferente para evitar loops
      if (inventarioRef.current.innerHTML !== formData.inventarioReconhecimento) {
        inventarioRef.current.innerHTML = formData.inventarioReconhecimento || "";
      }
    }
  }, [dialogOpen, formData.inventarioReconhecimento]);

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este modelo?")) {
      const novosModelos = modelos.filter((m) => m.id !== id);
      salvarModelos(novosModelos);
      toast.success("Modelo excluído com sucesso!");
    }
  };

  const visualizarModeloPadrao = () => {
    // Gerar HTML do modelo padrão (capa em branco com margens estreitas de 1,27 cm e cabeçalho)
    const htmlContent = `
      <!DOCTYPE html>
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns:v="urn:schemas-microsoft-com:vml" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="UTF-8">
          <meta name="ProgId" content="Word.Document">
          <meta name="Generator" content="Microsoft Word">
          <meta name="Originator" content="Microsoft Word">
          <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>100</w:Zoom>
              <w:DoNotOptimizeForBrowser/>
            </w:WordDocument>
          </xml>
          <![endif]-->
          <style>
            @page {
              size: A4 portrait;
              margin-top: 1.27cm;
              margin-bottom: 1.27cm;
              margin-left: 1.27cm;
              margin-right: 1.27cm;
            }
            body {
              font-family: "Calibri Light", Calibri, sans-serif;
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
              background-color: #ffffff;
            }
            .capa {
              width: 100%;
              height: 100%;
              min-height: calc(100vh - 60px);
              background-color: #ffffff;
              page-break-after: always;
            }
            .pagina {
              page-break-after: always;
            }
            .pagina:last-child {
              page-break-after: auto;
            }
          </style>
          <!--[if gte mso 9]>
          <style>
            @page Section1 {
              size: 21.0cm 29.7cm;
              margin: 1.27cm 1.27cm 1.27cm 1.27cm;
              mso-header-margin: 0cm;
              mso-footer-margin: 0cm;
              mso-paper-source: 0;
            }
            div.Section1 {
              page: Section1;
            }
          </style>
          <![endif]-->
        </head>
        <body>
          <!--[if gte mso 9]>
          <div class="Section1">
          <![endif]-->
          <!-- Cabeçalho que se repete em todas as páginas -->
          <table style="mso-element:header; width: 100%; border: 1px solid #000000; border-collapse: collapse; margin: 0; padding: 0; font-family: 'Calibri Light', Calibri, sans-serif;">
            <tr>
              <td style="width: 70%; padding: 8px 12px; vertical-align: middle; border-right: 1px solid #000000; font-weight: bold; text-transform: uppercase; white-space: nowrap; text-align: center; font-family: 'Calibri Light', Calibri, sans-serif;">PGRO – PROGRAMA DE GERENCIAMENTO DE RISCOS OCUPACIONAIS</td>
              <td style="width: 30%; padding: 8px 12px; vertical-align: middle; text-align: center; white-space: nowrap; font-family: 'Calibri Light', Calibri, sans-serif;">
                Página <span style="mso-field-code: ' PAGE '"></span> de <span style="mso-field-code: ' NUMPAGES '"></span>
              </td>
            </tr>
          </table>
          <div style="line-height: 1.5; font-family: 'Calibri Light', Calibri, sans-serif;">
            <br/><br/><br/><br/><br/><br/><br/><br/>
            <div style="text-align: center; font-family: 'Calibri Light', Calibri, sans-serif;">
              <div style="font-size: 20pt; font-weight: bold; font-family: 'Calibri Light', Calibri, sans-serif;">PROGRAMA DE GERENCIAMENTO DE RISCO</div>
              <div style="font-size: 20pt; font-weight: bold; font-family: 'Calibri Light', Calibri, sans-serif;">OCUPACIONAIS</div>
              <div style="font-size: 12pt; font-weight: bold; font-family: 'Calibri Light', Calibri, sans-serif; margin-top: 20px;">Referencias Normativas: NR01 – NR09</div>
            </div>
          </div>
          <!--[if gte mso 9]>
          </div>
          <![endif]-->
        </body>
      </html>
    `;

    // Abrir em nova janela para visualização
    const previewWindow = window.open("", "_blank", "width=800,height=1000");
    if (previewWindow) {
      previewWindow.document.write(htmlContent);
      previewWindow.document.close();
      toast.success("Modelo padrão aberto para visualização!");
    } else {
      toast.error("Não foi possível abrir a janela de visualização. Verifique se o bloqueador de pop-ups está desativado.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Modelo de PGRO</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie modelos de documentos PGRO para facilitar a criação de novos laudos.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={visualizarModeloPadrao}>
            <Eye className="mr-2 h-4 w-4" /> Visualizar Modelo Padrão
          </Button>
          <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" /> Novo Modelo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Modelo" : "Novo Modelo de PGRO"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Modelo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Modelo PGRO Padrão, Modelo PGRO Construção Civil..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Breve descrição do modelo..."
                />
              </div>
              
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold text-sm">Campos do Modelo</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="objetivos">Objetivos</Label>
                  <Textarea
                    id="objetivos"
                    value={formData.objetivos}
                    onChange={(e) => setFormData({ ...formData, objetivos: e.target.value })}
                    placeholder="Digite os objetivos..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fundamentacaoLegal">Fundamentação Legal</Label>
                  <Textarea
                    id="fundamentacaoLegal"
                    value={formData.fundamentacaoLegal}
                    onChange={(e) => setFormData({ ...formData, fundamentacaoLegal: e.target.value })}
                    placeholder="Digite a fundamentação legal..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="informacaoDivulgacao">Informação/Divulgação dos Dados</Label>
                  <Textarea
                    id="informacaoDivulgacao"
                    value={formData.informacaoDivulgacao}
                    onChange={(e) => setFormData({ ...formData, informacaoDivulgacao: e.target.value })}
                    placeholder="Digite as informações sobre divulgação dos dados..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="periodicidadeAnalise">Periodicidade e Análise Global do PGR</Label>
                  <Textarea
                    id="periodicidadeAnalise"
                    value={formData.periodicidadeAnalise}
                    onChange={(e) => setFormData({ ...formData, periodicidadeAnalise: e.target.value })}
                    placeholder="Digite a periodicidade e análise global..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monitoramentoExposicao">Monitoramento da Exposição aos Riscos</Label>
                  <Textarea
                    id="monitoramentoExposicao"
                    value={formData.monitoramentoExposicao}
                    onChange={(e) => setFormData({ ...formData, monitoramentoExposicao: e.target.value })}
                    placeholder="Digite o monitoramento da exposição aos riscos..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="analiseExposicao">Análise de Exposição dos Riscos</Label>
                  <Textarea
                    id="analiseExposicao"
                    value={formData.analiseExposicao}
                    onChange={(e) => setFormData({ ...formData, analiseExposicao: e.target.value })}
                    placeholder="Digite a análise de exposição dos riscos..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsabilidades">Responsabilidades</Label>
                  <Textarea
                    id="responsabilidades"
                    value={formData.responsabilidades}
                    onChange={(e) => setFormData({ ...formData, responsabilidades: e.target.value })}
                    placeholder="Digite as responsabilidades..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inventarioReconhecimento">Inventário de Reconhecimento Avaliação e Controle</Label>
                  <div
                    ref={inventarioRef}
                    contentEditable
                    onPaste={(e) => {
                      e.preventDefault();
                      const items = e.clipboardData.items;
                      
                      for (let i = 0; i < items.length; i++) {
                        const item = items[i];
                        
                        if (item.type.indexOf("image") !== -1) {
                          const blob = item.getAsFile();
                          if (blob) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const base64 = event.target?.result as string;
                              const img = document.createElement("img");
                              img.src = base64;
                              img.style.maxWidth = "100%";
                              img.style.height = "auto";
                              img.style.display = "block";
                              img.style.margin = "10px 0";
                              
                              const selection = window.getSelection();
                              if (selection && selection.rangeCount > 0) {
                                const range = selection.getRangeAt(0);
                                range.deleteContents();
                                range.insertNode(img);
                                range.collapse(false);
                                selection.removeAllRanges();
                                selection.addRange(range);
                              } else {
                                const div = e.currentTarget;
                                div.appendChild(img);
                              }
                              
                              // Atualizar formData com o HTML atualizado
                              setFormData({ ...formData, inventarioReconhecimento: e.currentTarget.innerHTML });
                            };
                            reader.readAsDataURL(blob);
                          }
                        } else if (item.type === "text/plain") {
                          item.getAsString((text) => {
                            const selection = window.getSelection();
                            if (selection && selection.rangeCount > 0) {
                              const range = selection.getRangeAt(0);
                              range.deleteContents();
                              const textNode = document.createTextNode(text);
                              range.insertNode(textNode);
                              range.collapse(false);
                              selection.removeAllRanges();
                              selection.addRange(range);
                            } else {
                              const div = e.currentTarget;
                              div.appendChild(document.createTextNode(text));
                            }
                            
                            // Atualizar formData
                            setFormData({ ...formData, inventarioReconhecimento: e.currentTarget.innerHTML });
                          });
                        } else if (item.type === "text/html") {
                          item.getAsString((html) => {
                            const selection = window.getSelection();
                            if (selection && selection.rangeCount > 0) {
                              const range = selection.getRangeAt(0);
                              range.deleteContents();
                              const tempDiv = document.createElement("div");
                              tempDiv.innerHTML = html;
                              const fragment = document.createDocumentFragment();
                              while (tempDiv.firstChild) {
                                fragment.appendChild(tempDiv.firstChild);
                              }
                              range.insertNode(fragment);
                              range.collapse(false);
                              selection.removeAllRanges();
                              selection.addRange(range);
                            } else {
                              const div = e.currentTarget;
                              const tempDiv = document.createElement("div");
                              tempDiv.innerHTML = html;
                              while (tempDiv.firstChild) {
                                div.appendChild(tempDiv.firstChild);
                              }
                            }
                            
                            // Atualizar formData
                            setFormData({ ...formData, inventarioReconhecimento: e.currentTarget.innerHTML });
                          });
                        }
                      }
                    }}
                    onInput={(e) => {
                      setFormData({ ...formData, inventarioReconhecimento: e.currentTarget.innerHTML });
                    }}
                    className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ whiteSpace: "pre-wrap" }}
                    data-placeholder="Digite texto normalmente ou cole imagens (Ctrl+V ou Cmd+V)..."
                  />
                  <style>{`
                    [contenteditable][data-placeholder]:empty:before {
                      content: attr(data-placeholder);
                      color: #9ca3af;
                      pointer-events: none;
                    }
                  `}</style>
                  <p className="text-xs text-muted-foreground">
                    Você pode digitar texto normalmente e colar imagens (Ctrl+V ou Cmd+V). As imagens serão incluídas no documento gerado.
                  </p>
                </div>

              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                </DialogClose>
                <Button type="submit">{editingId ? "Atualizar" : "Criar"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {modelos.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum modelo cadastrado</h3>
            <p className="text-muted-foreground mb-4">
              Crie seu primeiro modelo de PGRO para facilitar a emissão de novos laudos.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Criar Primeiro Modelo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modelos.map((modelo) => (
            <Card key={modelo.id}>
              <CardHeader>
                <CardTitle className="text-lg">{modelo.nome}</CardTitle>
                {modelo.descricao && (
                  <p className="text-sm text-muted-foreground mt-1">{modelo.descricao}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    {Object.values(modelo).filter(v => typeof v === 'string' && v.length > 0).length} campos preenchidos
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(modelo)}
                    >
                      <Pencil className="h-4 w-4 mr-2" /> Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleDelete(modelo.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

