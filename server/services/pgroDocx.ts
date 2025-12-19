import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

export type PgroDocxPayload = {
  emissao: {
    id: string;
    empresaId: string;
    empresaNome: string;
    responsavelNome: string;
    responsavelFuncao?: string | null;
    responsavelRegistro?: string | null;
    vigenciaInicio: string;
    vigenciaFim: string;
    observacoes?: string;
    cargos: { id: string; cargoNome: string; setorNome: string; cbo?: string }[];
    cronogramaAcoes?: {
      id: string;
      descricao: string;
      metaDiaria: boolean;
      metaMensal: boolean;
      metaTrimestral: boolean;
      metaAnual: boolean;
      estrategiaMetodologia: string;
    }[];
    cidadeEmissao?: string;
    estadoEmissao?: string;
    dataEmissao?: string;
  };
  empresa?: {
    cnpj?: string | null;
    descricaoAtividade?: string | null;
    tipoLogradouro?: string | null;
    nomeLogradouro?: string | null;
    numeroEndereco?: string | null;
    complementoEndereco?: string | null;
    cidadeEndereco?: string | null;
    estadoEndereco?: string | null;
    cep?: string | null;
    emailContato?: string | null;
  } | null;
  totais?: {
    totalEmpregados: number;
    empregadosHomens: number;
    empregadosMulheres: number;
  };
};

const safe = (val?: string | null) => (val ? String(val) : "");

const tableBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
  insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
};

const paragraph = (
  text: string,
  opts: { bold?: boolean; heading?: HeadingLevel; align?: AlignmentType; spacing?: number } = {}
) =>
  new Paragraph({
    text,
    heading: opts.heading,
    alignment: opts.align,
    spacing: opts.spacing ? { after: opts.spacing } : undefined,
    children: opts.bold ? [new TextRun({ text, bold: true })] : [new TextRun({ text })],
  });

export async function gerarDocxPgro(payload: PgroDocxPayload): Promise<Buffer> {
  const { emissao, empresa, totais } = payload;

  const doc = new Document({
    creator: "TST Fácil",
    title: `PGRO - ${safe(emissao.empresaNome)}`,
    description: "PGRO gerado no servidor",
    sections: [
      {
        children: [
          paragraph("PGRO – Programa de Gerenciamento de Riscos Ocupacionais", {
            heading: HeadingLevel.TITLE,
            align: AlignmentType.CENTER,
            spacing: 300,
            bold: true,
          }),
          paragraph(`Empresa: ${safe(emissao.empresaNome)}`, { bold: true }),
          paragraph(`CNPJ: ${safe(empresa?.cnpj)}`),
          paragraph(`Atividade: ${safe(empresa?.descricaoAtividade)}`),
          paragraph(
            `Endereço: ${[
              safe(empresa?.tipoLogradouro),
              safe(empresa?.nomeLogradouro),
              empresa?.numeroEndereco ? `Nº ${empresa.numeroEndereco}` : "",
              safe(empresa?.complementoEndereco),
              safe(empresa?.cidadeEndereco),
              safe(empresa?.estadoEndereco),
              empresa?.cep ? `CEP ${empresa.cep}` : "",
            ]
              .filter(Boolean)
              .join(", ")}`
          ),
          paragraph(`Contato: ${safe(empresa?.emailContato)}`, { spacing: 200 }),

          paragraph("Responsável Técnico", { heading: HeadingLevel.HEADING_2, spacing: 100 }),
          paragraph(`Nome: ${safe(emissao.responsavelNome)}`),
          paragraph(`Função: ${safe(emissao.responsavelFuncao)}`),
          paragraph(`Registro: ${safe(emissao.responsavelRegistro)}`, { spacing: 200 }),

          paragraph("Vigência", { heading: HeadingLevel.HEADING_2, spacing: 100 }),
          paragraph(`Início: ${safe(emissao.vigenciaInicio)}`),
          paragraph(`Fim: ${safe(emissao.vigenciaFim)}`, { spacing: 200 }),

          paragraph("Empregados", { heading: HeadingLevel.HEADING_2, spacing: 100 }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorders,
            rows: [
              new TableRow({
                tableHeader: true,
                children: ["Total", "Homens", "Mulheres"].map(
                  (t) => new TableCell({ children: [paragraph(t, { bold: true, align: AlignmentType.CENTER })] })
                ),
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [paragraph(String(totais?.totalEmpregados ?? 0), { align: AlignmentType.CENTER })] }),
                  new TableCell({ children: [paragraph(String(totais?.empregadosHomens ?? 0), { align: AlignmentType.CENTER })] }),
                  new TableCell({ children: [paragraph(String(totais?.empregadosMulheres ?? 0), { align: AlignmentType.CENTER })] }),
                ],
              }),
            ],
          }),
          paragraph("", { spacing: 200 }),

          paragraph("Cargos e Setores", { heading: HeadingLevel.HEADING_2, spacing: 100 }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorders,
            rows: [
              new TableRow({
                tableHeader: true,
                children: ["Cargo", "Setor", "CBO"].map(
                  (t) => new TableCell({ children: [paragraph(t, { bold: true, align: AlignmentType.CENTER })] })
                ),
              }),
              ...(emissao.cargos || []).map(
                (c) =>
                  new TableRow({
                    children: [
                      new TableCell({ children: [paragraph(safe(c.cargoNome))] }),
                      new TableCell({ children: [paragraph(safe(c.setorNome))] }),
                      new TableCell({ children: [paragraph(safe(c.cbo))] }),
                    ],
                  })
              ),
            ],
          }),
          paragraph("", { spacing: 200 }),

          paragraph("Cronograma de Ações", { heading: HeadingLevel.HEADING_2, spacing: 100 }),
          emissao.cronogramaAcoes && emissao.cronogramaAcoes.length > 0
            ? new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: tableBorders,
                rows: [
                  new TableRow({
                    tableHeader: true,
                    children: ["Descrição", "Metas", "Estratégia"].map(
                      (t) => new TableCell({ children: [paragraph(t, { bold: true })] })
                    ),
                  }),
                  ...emissao.cronogramaAcoes.map(
                    (acao) =>
                      new TableRow({
                        children: [
                          new TableCell({ children: [paragraph(safe(acao.descricao))] }),
                          new TableCell({
                            children: [
                              paragraph(
                                [
                                  acao.metaDiaria ? "Diária" : "",
                                  acao.metaMensal ? "Mensal" : "",
                                  acao.metaTrimestral ? "Trimestral" : "",
                                  acao.metaAnual ? "Anual" : "",
                                ]
                                  .filter(Boolean)
                                  .join(", ")
                              ),
                            ],
                          }),
                          new TableCell({ children: [paragraph(safe(acao.estrategiaMetodologia))] }),
                        ],
                      })
                  ),
                ],
              })
            : paragraph("Sem ações cadastradas.", { spacing: 200 }),

          paragraph("Observações", { heading: HeadingLevel.HEADING_2, spacing: 100 }),
          paragraph(safe(emissao.observacoes) || "—", { spacing: 200 }),

          paragraph(
            `${safe(emissao.cidadeEmissao)} - ${safe(emissao.estadoEmissao)}${emissao.dataEmissao ? `, ${emissao.dataEmissao}` : ""}`,
            { spacing: 200, align: AlignmentType.RIGHT }
          ),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}



