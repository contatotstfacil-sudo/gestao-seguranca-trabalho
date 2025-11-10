import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { 
  modelosCertificados,
  colaboradores,
  responsaveis,
  empresas,
  certificadosEmitidos,
  cargos,
  setores
} from "./drizzle/schema";
import { eq } from "drizzle-orm";

async function emitirCertificadoTeste() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não configurada");
  }

  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);

  try {
    console.log("🔍 Buscando dados existentes...");

    // 1. Buscar um modelo de certificado
    const modelos = await db.select().from(modelosCertificados).limit(1);
    if (modelos.length === 0) {
      throw new Error("Nenhum modelo de certificado encontrado. Crie um modelo primeiro.");
    }
    const modelo = modelos[0];
    console.log(`✓ Modelo encontrado: ${modelo.nome} (ID: ${modelo.id})`);

    // 2. Buscar um colaborador com cargo e empresa
    const colaboradoresComDados = await db
      .select({
        colaborador: colaboradores,
        nomeCargo: cargos.nomeCargo,
        empresa: empresas,
      })
      .from(colaboradores)
      .leftJoin(cargos, eq(colaboradores.cargoId, cargos.id))
      .leftJoin(empresas, eq(colaboradores.empresaId, empresas.id))
      .where(eq(colaboradores.status, "ativo"))
      .limit(1);

    if (colaboradoresComDados.length === 0) {
      throw new Error("Nenhum colaborador ativo encontrado.");
    }
    const { colaborador, nomeCargo, empresa } = colaboradoresComDados[0];
    console.log(`✓ Colaborador encontrado: ${colaborador.nomeCompleto} (ID: ${colaborador.id})`);
    console.log(`  Cargo: ${nomeCargo || colaborador.funcao || "N/A"}`);
    console.log(`  RG: ${colaborador.rg || "N/A"}`);
    console.log(`  Empresa: ${empresa?.razaoSocial || "N/A"}`);

    // 3. Buscar um responsável (opcional)
    const responsaveisList = await db.select().from(responsaveis).limit(1);
    const responsavel = responsaveisList.length > 0 ? responsaveisList[0] : null;
    if (responsavel) {
      console.log(`✓ Responsável encontrado: ${responsavel.nomeCompleto} (ID: ${responsavel.id})`);
    } else {
      console.log("⚠ Nenhum responsável encontrado, certificado será emitido sem responsável.");
    }

    // 4. Processar o template HTML
    console.log("\n📝 Processando template HTML...");
    let htmlGerado = modelo.htmlTemplate || "";
    
    // Dados para substituição
    const cargoColaborador = nomeCargo || colaborador.funcao || "";
    const nomeColaborador = colaborador.nomeCompleto;
    const rgColaborador = colaborador.rg || "";
    const nomeEmpresa = empresa?.razaoSocial || "";
    const cnpjEmpresa = empresa?.cnpj || "";
    const nomeResponsavel = responsavel?.nomeCompleto || "[NOME DO RESPONSÁVEL]";
    const cargoResponsavel = responsavel?.funcao || "[CARGO DO RESPONSÁVEL]";

    // Data de hoje formatada
    const hoje = new Date();
    const dataFormatada = hoje.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });

    // Substituir placeholders
    console.log("  Substituindo placeholders...");
    
    // FORÇAR atualização da estrutura de assinaturas ANTES de substituir
    htmlGerado = htmlGerado.replace(/Instrutor do Treinamento/g, "[CARGO DO COLABORADOR]");
    
    // FORÇAR atualização da estrutura de assinatura do colaborador - SEMPRE garantir que tenha cargo e RG
    console.log("  Atualizando estrutura de assinatura para incluir cargo e RG...");
    
    // Primeiro, encontrar a primeira assinatura (do colaborador) e substituir/adicionar campos
    // Padrão mais flexível: procurar por qualquer estrutura que contenha [NOME DO COLABORADOR] dentro de uma div de assinatura
    // Vamos procurar por padrões comuns e substituir
    
    // Tentar múltiplos padrões para garantir que funcione
    const padroes = [
      // Padrão 1: estrutura com inline styles
      /(<div[^>]*style="[^"]*display:\s*flex[^"]*flex-direction:\s*column[^"]*align-items:\s*center[^"]*">\s*<div[^>]*style="[^"]*width:\s*192px[^"]*border-top:[^"]*"><\/div>\s*<p[^>]*>\[NOME DO COLABORADOR\]<\/p>)(\s*(?:<p[^>]*>.*?<\/p>)?\s*)(<\/div>)/gi,
      // Padrão 2: estrutura mais simples
      /(<div[^>]*class="assinatura"[^>]*>\s*<div[^>]*class="assinatura-linha"[^>]*><\/div>\s*<p[^>]*class="assinatura-nome"[^>]*>\[NOME DO COLABORADOR\]<\/p>)(\s*(?:<p[^>]*>.*?<\/p>)?\s*)(<\/div>)/gi,
      // Padrão 3: padrão mais genérico - qualquer p com [NOME DO COLABORADOR] dentro de div
      /(<div[^>]*>\s*<div[^>]*><\/div>\s*<p[^>]*>\[NOME DO COLABORADOR\]<\/p>)(\s*(?:<p[^>]*>.*?<\/p>)?\s*)(<\/div>)/gi,
    ];
    
    let estruturaAtualizada = false;
    for (const padrao of padroes) {
      if (padrao.test(htmlGerado)) {
        htmlGerado = htmlGerado.replace(
          padrao,
          '$1\n          <p style="font-size: 10px; line-height: 1.2; color: #374151; margin: 0; padding: 0; margin-top: 1px;">\n            [CARGO DO COLABORADOR]\n          </p>\n          <p style="font-size: 10px; line-height: 1.2; color: #374151; margin: 0; padding: 0; margin-top: 1px;">\n            RG: [RG DO COLABORADOR]\n          </p>\n        $3'
        );
        estruturaAtualizada = true;
        console.log("  ✓ Estrutura de assinatura atualizada com sucesso");
        break;
      }
    }
    
    // Se nenhum padrão funcionou, tentar substituição direta após [NOME DO COLABORADOR]
    if (!estruturaAtualizada && htmlGerado.includes('[NOME DO COLABORADOR]')) {
      console.log("  Tentando padrão alternativo...");
      htmlGerado = htmlGerado.replace(
        /(<p[^>]*>\[NOME DO COLABORADOR\]<\/p>)(\s*(?:<p[^>]*>.*?<\/p>)?\s*)(<\/div>)/gi,
        '$1\n          <p style="font-size: 10px; line-height: 1.2; color: #374151; margin: 0; padding: 0; margin-top: 1px;">\n            [CARGO DO COLABORADOR]\n          </p>\n          <p style="font-size: 10px; line-height: 1.2; color: #374151; margin: 0; padding: 0; margin-top: 1px;">\n            RG: [RG DO COLABORADOR]\n          </p>\n        $3'
      );
      estruturaAtualizada = true;
      console.log("  ✓ Estrutura de assinatura atualizada (padrão alternativo)");
    }
    
    if (!estruturaAtualizada) {
      console.log("  ⚠ Não foi possível atualizar a estrutura automaticamente");
    }

    // AGORA substituir os valores
    // Substituir cargo PRIMEIRO
    if (cargoColaborador) {
      htmlGerado = htmlGerado.replace(/\[CARGO DO COLABORADOR\]/g, cargoColaborador);
      console.log(`  ✓ Cargo substituído: ${cargoColaborador}`);
    } else {
      // Se não há cargo, remove a linha inteira do cargo
      htmlGerado = htmlGerado.replace(/<p[^>]*>\[CARGO DO COLABORADOR\]<\/p>/gi, '');
      console.log("  ⚠ Cargo não encontrado, linha removida");
    }

    // Substituir nome do colaborador
    htmlGerado = htmlGerado.replace(/\[NOME DO COLABORADOR\]/g, nomeColaborador);
    console.log(`  ✓ Nome substituído: ${nomeColaborador}`);

    // Substituir RG do colaborador
    htmlGerado = htmlGerado.replace(/\[RG DO COLABORADOR\]/g, rgColaborador || "[RG DO COLABORADOR]");
    console.log(`  ✓ RG substituído: ${rgColaborador || "N/A"}`);
    
    // Verificar se ainda há placeholders não substituídos
    if (htmlGerado.includes("[CARGO DO COLABORADOR]") || htmlGerado.includes("[RG DO COLABORADOR]")) {
      console.log("  ⚠ ATENÇÃO: Ainda há placeholders não substituídos!");
      console.log("  Verificando estrutura HTML...");
    }

    // Substituir dados da empresa
    htmlGerado = htmlGerado.replace(/\[NOME DA EMPRESA\]/g, nomeEmpresa || "[NOME DA EMPRESA]");
    htmlGerado = htmlGerado.replace(/\[CNPJ DA EMPRESA\]/g, cnpjEmpresa || "[CNPJ DA EMPRESA]");
    console.log(`  ✓ Empresa substituída: ${nomeEmpresa || "N/A"}`);

    // Substituir responsável
    htmlGerado = htmlGerado.replace(/\[NOME DO RESPONSÁVEL\]/g, nomeResponsavel);
    htmlGerado = htmlGerado.replace(/\[CARGO DO RESPONSÁVEL\]/g, cargoResponsavel);
    console.log(`  ✓ Responsável substituído: ${nomeResponsavel}`);

    // Substituir data de emissão
    htmlGerado = htmlGerado.replace(/\[DATA DE EMISSÃO\]/g, dataFormatada);
    console.log(`  ✓ Data de emissão substituída: ${dataFormatada}`);

    // Substituir datas de realização (usar hoje)
    htmlGerado = htmlGerado.replace(/\[DATA REALIZAÇÃO\]/g, dataFormatada);
    htmlGerado = htmlGerado.replace(/\[TEXTO_DATA_REALIZACAO\]/g, `realizado no dia ${dataFormatada}`);
    console.log(`  ✓ Data de realização substituída: ${dataFormatada}`);

    // Limpar outros placeholders
    htmlGerado = htmlGerado.replace(/\[NOME DO TREINAMENTO\]/g, modelo.nome);
    htmlGerado = htmlGerado.replace(/\[DESCRIÇÃO DO CERTIFICADO\]/g, modelo.descricaoCertificado || modelo.descricao || "");

    // Processar conteúdo programático
    if (modelo.conteudoProgramatico) {
      try {
        const conteudoArray = JSON.parse(modelo.conteudoProgramatico);
        if (Array.isArray(conteudoArray) && conteudoArray.length > 0) {
          const conteudoLista = conteudoArray.map((item: string, index: number) => 
            `<li>${String.fromCharCode(97 + index)}) ${item}</li>`
          ).join("");
          htmlGerado = htmlGerado.replace(/\[CONTEUDO_PROGRAMATICO_LISTA\]/g, conteudoLista);
          console.log(`  ✓ Conteúdo programático substituído (${conteudoArray.length} itens)`);
        }
      } catch (e) {
        console.log("  ⚠ Erro ao processar conteúdo programático:", e);
      }
    }

    // Substituir endereço do treinamento
    if (modelo.textoRodape) {
      htmlGerado = htmlGerado.replace(/\[ENDERECO_TREINAMENTO\]/g, modelo.textoRodape);
      console.log(`  ✓ Endereço substituído: ${modelo.textoRodape}`);
    }

    // 5. Criar o certificado emitido
    console.log("\n💾 Salvando certificado no banco de dados...");
    
    const datasRealizacao = JSON.stringify([dataFormatada]);
    
    const certificadoCriado = await db.insert(certificadosEmitidos).values({
      modeloCertificadoId: modelo.id,
      colaboradorId: colaborador.id,
      responsavelId: responsavel?.id || undefined,
      nomeColaborador: nomeColaborador,
      rgColaborador: rgColaborador || undefined,
      nomeEmpresa: nomeEmpresa || undefined,
      cnpjEmpresa: cnpjEmpresa || undefined,
      datasRealizacao: datasRealizacao,
      htmlGerado: htmlGerado,
      empresaId: colaborador.empresaId || undefined,
    });

    console.log("✅ Certificado emitido com sucesso!");
    console.log(`\n📋 Resumo:`);
    console.log(`   Modelo: ${modelo.nome}`);
    console.log(`   Colaborador: ${nomeColaborador}`);
    console.log(`   Cargo: ${cargoColaborador || "N/A"}`);
    console.log(`   RG: ${rgColaborador || "N/A"}`);
    console.log(`   Empresa: ${nomeEmpresa || "N/A"}`);
    console.log(`   Responsável: ${nomeResponsavel}`);
    console.log(`   Data de Emissão: ${dataFormatada}`);
    console.log(`\n✨ Você pode visualizar o certificado na página "Emissão de Certificados"`);

  } catch (error) {
    console.error("❌ Erro ao emitir certificado:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Executar
emitirCertificadoTeste()
  .then(() => {
    console.log("\n✅ Processo concluído!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro fatal:", error);
    process.exit(1);
  });

