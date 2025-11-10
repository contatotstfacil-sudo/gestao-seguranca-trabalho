import { config } from "dotenv";
import { resolve } from "path";
import mysql from "mysql2/promise";

// Carregar variáveis de ambiente
const envLocalPath = resolve(process.cwd(), ".env.local");
const envPath = resolve(process.cwd(), ".env");
config({ path: envPath });
config({ path: envLocalPath, override: true });

const TEMPLATE_PAISAGEM = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificado</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; background: {{corFundo}}; color: {{corTexto}}; padding: 0; margin: 0; }
    .certificado { width: 297mm; height: 210mm; background: {{corFundo}}; position: relative; margin: 0 auto; overflow: hidden; }
    .cabecalho { background: {{corPrimaria}}; color: #ffffff; padding: 25px 20px; text-align: center; }
    .cabecalho h1 { font-size: 48px; font-weight: bold; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 2px; }
    .cabecalho h2 { font-size: 22px; font-weight: normal; text-transform: uppercase; margin-top: 8px; opacity: 0.95; }
    .conteudo { padding: 35px 50px; min-height: calc(210mm - 120px); display: flex; flex-direction: column; }
    .empresa-emissora { font-size: 19px; font-weight: bold; text-align: center; margin-bottom: 5px; color: {{corTexto}}; }
    .cnpj-emissora { font-size: 15px; text-align: center; margin-bottom: 25px; color: {{corTexto}}; }
    .certificamos-que { font-size: 21px; font-weight: bold; text-align: center; margin-bottom: 18px; color: {{corPrimaria}}; letter-spacing: 1px; }
    .nome-colaborador { font-size: 40px; font-weight: bold; text-align: center; margin: 18px 0 35px 0; text-transform: uppercase; color: {{corPrimaria}}; line-height: 1.3; }
    .nome-colaborador .rg { font-size: 26px; font-weight: normal; text-transform: none; color: {{corTexto}}; }
    .texto-treinamento { font-size: 15px; line-height: 1.9; margin: 25px 0; text-align: justify; color: {{corTexto}}; }
    .detalhes-treinamento { margin: 25px 0; font-size: 15px; line-height: 1.8; color: {{corTexto}}; }
    .detalhes-treinamento div { margin-bottom: 8px; }
    .conteudo-programatico { margin-top: 25px; margin-bottom: 15px; }
    .conteudo-programatico h3 { font-weight: bold; font-size: 15px; margin-bottom: 12px; color: {{corTexto}}; }
    .conteudo-programatico ul { list-style: none; padding-left: 0; font-size: 13px; line-height: 1.7; color: {{corTexto}}; }
    .conteudo-programatico li { margin-bottom: 6px; }
    .rodape { position: absolute; bottom: 25px; left: 0; right: 0; width: 100%; padding: 0 50px; }
    .rodape-data { text-align: right; font-size: 14px; margin-bottom: 35px; color: {{corTexto}}; }
    .assinaturas { display: flex; justify-content: space-between; margin-top: 25px; }
    .assinatura { width: 48%; text-align: center; }
    .assinatura-linha { border-top: 2px solid {{corTexto}}; padding-top: 8px; margin-bottom: 8px; min-height: 50px; }
    .assinatura-nome { font-weight: bold; margin-top: 8px; font-size: 13px; color: {{corTexto}}; }
    .assinatura-cargo { font-size: 12px; margin-top: 4px; color: {{corTexto}}; }
    .endereco { position: absolute; bottom: 8px; left: 50px; font-size: 11px; color: {{corTexto}}; }
    .endereco strong { font-weight: bold; }
  </style>
</head>
<body>
  <div class="certificado">
    <div class="cabecalho">
      <h1>{{textoCabecalho}}</h1>
      {{#nomeModelo}}<h2>{{nomeModelo}}</h2>{{/nomeModelo}}
    </div>
    <div class="conteudo">
      <div class="empresa-emissora">{{nomeEmpresa}}</div>
      <div class="cnpj-emissora">CNPJ: {{cnpjEmpresaEmissora}}</div>
      <div class="certificamos-que">CERTIFICAMOS QUE:</div>
      <div class="nome-colaborador">{{nomeColaborador}} <span class="rg">- RG: {{rgColaborador}}</span></div>
      <div class="texto-treinamento">Participou do treinamento de {{nomeTreinamento}}, {{descricaoTreinamento}},</div>
      <div class="detalhes-treinamento">
        <div><strong>Norma Regulamentadora - {{tipoNr}},</strong></div>
        <div>realizado no dia <strong>{{dataRealizacao}}</strong></div>
        <div>com carga horária de <strong>{{cargaHoraria}} horas.</strong></div>
      </div>
      {{#mostrarConteudoProgramatico}}
      <div class="conteudo-programatico">
        <h3>Conteúdo Programático:</h3>
        <ul>{{conteudoProgramaticoLista}}</ul>
      </div>
      {{/mostrarConteudoProgramatico}}
    </div>
    <div class="rodape">
      <div class="rodape-data">{{dataEmissaoCompleta}}</div>
      <div class="assinaturas">
        <div class="assinatura">
          <div class="assinatura-linha"></div>
          <div class="assinatura-nome">{{nomeColaborador}}</div>
        </div>
        <div class="assinatura">
          <div class="assinatura-linha"></div>
          <div class="assinatura-nome">{{nomeInstrutor}}</div>
          <div class="assinatura-cargo">{{cargoInstrutor}}</div>
          <div class="assinatura-cargo">{{registroInstrutor}}</div>
        </div>
      </div>
    </div>
    <div class="endereco"><strong>Endereço treinamento:</strong><br>{{enderecoTreinamento}}</div>
  </div>
</body>
</html>`;

const TEMPLATE_RETRATO = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificado</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; background: {{corFundo}}; color: {{corTexto}}; padding: 0; margin: 0; }
    .certificado { width: 210mm; height: 297mm; background: {{corFundo}}; position: relative; margin: 0 auto; overflow: hidden; }
    .cabecalho { background: {{corPrimaria}}; color: #ffffff; padding: 28px 20px; text-align: center; }
    .cabecalho h1 { font-size: 44px; font-weight: bold; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 2px; }
    .cabecalho h2 { font-size: 20px; font-weight: normal; text-transform: uppercase; margin-top: 8px; opacity: 0.95; }
    .conteudo { padding: 30px 35px; min-height: calc(297mm - 130px); display: flex; flex-direction: column; }
    .empresa-emissora { font-size: 18px; font-weight: bold; text-align: center; margin-bottom: 5px; color: {{corTexto}}; }
    .cnpj-emissora { font-size: 14px; text-align: center; margin-bottom: 22px; color: {{corTexto}}; }
    .certificamos-que { font-size: 19px; font-weight: bold; text-align: center; margin-bottom: 16px; color: {{corPrimaria}}; letter-spacing: 1px; }
    .nome-colaborador { font-size: 36px; font-weight: bold; text-align: center; margin: 16px 0 32px 0; text-transform: uppercase; color: {{corPrimaria}}; line-height: 1.3; }
    .nome-colaborador .rg { font-size: 22px; font-weight: normal; text-transform: none; color: {{corTexto}}; }
    .texto-treinamento { font-size: 14px; line-height: 1.9; margin: 22px 0; text-align: justify; color: {{corTexto}}; }
    .detalhes-treinamento { margin: 22px 0; font-size: 14px; line-height: 1.8; color: {{corTexto}}; }
    .detalhes-treinamento div { margin-bottom: 8px; }
    .conteudo-programatico { margin-top: 22px; margin-bottom: 15px; }
    .conteudo-programatico h3 { font-weight: bold; font-size: 14px; margin-bottom: 10px; color: {{corTexto}}; }
    .conteudo-programatico ul { list-style: none; padding-left: 0; font-size: 12px; line-height: 1.6; color: {{corTexto}}; }
    .conteudo-programatico li { margin-bottom: 5px; }
    .rodape { position: absolute; bottom: 22px; left: 0; right: 0; width: 100%; padding: 0 35px; }
    .rodape-data { text-align: right; font-size: 13px; margin-bottom: 30px; color: {{corTexto}}; }
    .assinaturas { display: flex; justify-content: space-between; margin-top: 22px; }
    .assinatura { width: 48%; text-align: center; }
    .assinatura-linha { border-top: 2px solid {{corTexto}}; padding-top: 8px; margin-bottom: 8px; min-height: 50px; }
    .assinatura-nome { font-weight: bold; margin-top: 8px; font-size: 12px; color: {{corTexto}}; }
    .assinatura-cargo { font-size: 11px; margin-top: 4px; color: {{corTexto}}; }
    .endereco { position: absolute; bottom: 8px; left: 35px; font-size: 10px; color: {{corTexto}}; }
    .endereco strong { font-weight: bold; }
  </style>
</head>
<body>
  <div class="certificado">
    <div class="cabecalho">
      <h1>{{textoCabecalho}}</h1>
      {{#nomeModelo}}<h2>{{nomeModelo}}</h2>{{/nomeModelo}}
    </div>
    <div class="conteudo">
      <div class="empresa-emissora">{{nomeEmpresa}}</div>
      <div class="cnpj-emissora">CNPJ: {{cnpjEmpresaEmissora}}</div>
      <div class="certificamos-que">CERTIFICAMOS QUE:</div>
      <div class="nome-colaborador">{{nomeColaborador}} <span class="rg">- RG: {{rgColaborador}}</span></div>
      <div class="texto-treinamento">Participou do treinamento de {{nomeTreinamento}}, {{descricaoTreinamento}},</div>
      <div class="detalhes-treinamento">
        <div><strong>Norma Regulamentadora - {{tipoNr}},</strong></div>
        <div>realizado no dia <strong>{{dataRealizacao}}</strong></div>
        <div>com carga horária de <strong>{{cargaHoraria}} horas.</strong></div>
      </div>
      {{#mostrarConteudoProgramatico}}
      <div class="conteudo-programatico">
        <h3>Conteúdo Programático:</h3>
        <ul>{{conteudoProgramaticoLista}}</ul>
      </div>
      {{/mostrarConteudoProgramatico}}
    </div>
    <div class="rodape">
      <div class="rodape-data">{{dataEmissaoCompleta}}</div>
      <div class="assinaturas">
        <div class="assinatura">
          <div class="assinatura-linha"></div>
          <div class="assinatura-nome">{{nomeColaborador}}</div>
        </div>
        <div class="assinatura">
          <div class="assinatura-linha"></div>
          <div class="assinatura-nome">{{nomeInstrutor}}</div>
          <div class="assinatura-cargo">{{cargoInstrutor}}</div>
          <div class="assinatura-cargo">{{registroInstrutor}}</div>
        </div>
      </div>
    </div>
    <div class="endereco"><strong>Endereço treinamento:</strong><br>{{enderecoTreinamento}}</div>
  </div>
</body>
</html>`;

async function criarModelosPadrao() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL não configurada");
    process.exit(1);
  }

  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  const modelos = [
    {
      nome: "Modelo Padrão NR-35 Paisagem",
      descricao: "Certificado padrão para NR-35 em formato paisagem",
      htmlTemplate: TEMPLATE_PAISAGEM,
      corFundo: "#ffffff",
      corTexto: "#000000",
      corPrimaria: "#1e40af",
      orientacao: "landscape",
      textoCabecalho: "CERTIFICADO",
      textoRodape: "",
      descricaoCertificado: "em conformidade com a portaria 3.214/78",
      cargaHoraria: "08:00",
      tipoNr: "35",
      padrao: true,
    },
    {
      nome: "Modelo Padrão NR-35 Retrato",
      descricao: "Certificado padrão para NR-35 em formato retrato",
      htmlTemplate: TEMPLATE_RETRATO,
      corFundo: "#ffffff",
      corTexto: "#000000",
      corPrimaria: "#1e40af",
      orientacao: "portrait",
      textoCabecalho: "CERTIFICADO",
      textoRodape: "",
      descricaoCertificado: "em conformidade com a portaria 3.214/78",
      cargaHoraria: "08:00",
      tipoNr: "35",
      padrao: false,
    },
    {
      nome: "Modelo Padrão NR-10 Paisagem",
      descricao: "Certificado padrão para NR-10 em formato paisagem",
      htmlTemplate: TEMPLATE_PAISAGEM,
      corFundo: "#ffffff",
      corTexto: "#000000",
      corPrimaria: "#dc2626",
      orientacao: "landscape",
      textoCabecalho: "CERTIFICADO",
      textoRodape: "",
      descricaoCertificado: "em conformidade com a portaria 3.214/78",
      cargaHoraria: "40:00",
      tipoNr: "10",
      padrao: false,
    },
  ];

  try {
    for (const modelo of modelos) {
      await connection.execute(
        `INSERT INTO modelosCertificados (nome, descricao, htmlTemplate, corFundo, corTexto, corPrimaria, orientacao, textoCabecalho, textoRodape, descricaoCertificado, cargaHoraria, tipoNr, padrao, mostrarDataEmissao, mostrarValidade, mostrarNR, mostrarConteudoProgramatico, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true, true, true, true, NOW(), NOW())`,
        [
          modelo.nome,
          modelo.descricao,
          modelo.htmlTemplate,
          modelo.corFundo,
          modelo.corTexto,
          modelo.corPrimaria,
          modelo.orientacao,
          modelo.textoCabecalho,
          modelo.textoRodape,
          modelo.descricaoCertificado,
          modelo.cargaHoraria,
          modelo.tipoNr,
          modelo.padrao,
        ]
      );
      console.log(`✓ Modelo "${modelo.nome}" criado com sucesso`);
    }
    console.log("\n✅ Todos os modelos foram criados com sucesso!");
  } catch (error: any) {
    if (error.code === "ER_DUP_ENTRY") {
      console.log("⚠ Modelos já existem no banco de dados");
    } else {
      console.error("❌ Erro ao criar modelos:", error);
    }
  } finally {
    await connection.end();
  }
}

criarModelosPadrao();

