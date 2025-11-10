import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { colaboradores } from "./drizzle/schema";

// Cargos típicos de construtora
const cargos = [
  "Pedreiro",
  "Servente de Obras",
  "Carpinteiro",
  "Armador",
  "Eletricista",
  "Encanador",
  "Mestre de Obras",
  "Técnico de Segurança do Trabalho",
  "Engenheiro Civil",
  "Operador de Betoneira",
  "Pintor",
  "Azulejista",
  "Almoxarife",
];

const nomesMasculinos = [
  "Carlos","João","Paulo","Fernando","Ricardo","Roberto","André","Marcelo",
  "Felipe","Lucas","Diego","Rodrigo","Gustavo","Bruno","Thiago","Matheus",
  "Daniel","Fábio","Julio","Sérgio","Marcos","César","Cláudio","Edson",
  "Heitor","Igor","Leandro","Rafael","Vitor","Henrique",
];

const nomesFemininos = [
  "Maria","Ana","Carla","Paula","Fernanda","Roberta","Andréa","Márcia",
  "Daniela","Fabiana","Júlia","Helena","Isabela","Beatriz","Patrícia","Letícia",
  "Aline","Camila","Larissa","Karla","Bruna","Sabrina","Tânia","Rafaela",
  "Viviane","Nathalia","Priscila","Bianca","Luana","Talita",
];

const sobrenomes = [
  "Silva","Santos","Oliveira","Souza","Rodrigues","Almeida","Pereira","Ferreira",
  "Martins","Gomes","Barbosa","Carvalho","Lima","Araújo","Costa","Rocha",
  "Mendes","Ribeiro","Dias","Teixeira",
];

function nomeAleatorio(sexo: "masculino" | "feminino") {
  const base = sexo === "masculino" ? nomesMasculinos : nomesFemininos;
  const nome = base[Math.floor(Math.random() * base.length)];
  const sobrenome = sobrenomes[Math.floor(Math.random() * sobrenomes.length)];
  return `${nome} ${sobrenome}`;
}

function dataAdmissaoPorAnos(anos: number) {
  // distribui dentro do ano-alvo para variar mês/dia
  const hoje = new Date();
  const anoAlvo = hoje.getFullYear() - anos;
  const mes = Math.floor(Math.random() * 12);
  const dia = Math.max(1, Math.floor(Math.random() * 28));
  return new Date(anoAlvo, mes, dia);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL não configurada. Configure e rode novamente.");
    process.exit(1);
  }

  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);

  // 50 colaboradores: 35 homens, 15 mulheres
  const total = 50;
  const homens = 35;
  const mulheres = 15;

  // Anos de empresa: 1..10, com apenas 1 colaborador com 10 anos
  const anosLista: number[] = [];
  anosLista.push(10); // um com 10 anos
  while (anosLista.length < total) {
    const v = Math.floor(Math.random() * 9) + 1; // 1..9
    anosLista.push(v);
  }

  const registros: any[] = [];

  for (let i = 0; i < homens; i++) {
    const cargo = cargos[Math.floor(Math.random() * cargos.length)];
    registros.push({
      nomeCompleto: nomeAleatorio("masculino"),
      empresaId: 1,
      funcao: cargo,
      status: "ativo",
      sexo: "masculino",
      dataAdmissao: dataAdmissaoPorAnos(anosLista[i]),
    });
  }

  for (let i = 0; i < mulheres; i++) {
    const cargo = cargos[Math.floor(Math.random() * cargos.length)];
    registros.push({
      nomeCompleto: nomeAleatorio("feminino"),
      empresaId: 1,
      funcao: cargo,
      status: "ativo",
      sexo: "feminino",
      dataAdmissao: dataAdmissaoPorAnos(anosLista[homens + i]),
    });
  }

  // Inserção em lotes
  const batch = 10;
  let inseridos = 0;
  for (let i = 0; i < registros.length; i += batch) {
    const slice = registros.slice(i, i + batch);
    for (const r of slice) {
      await db.insert(colaboradores).values(r);
    }
    inseridos += slice.length;
    console.log(`Inseridos ${inseridos}/${registros.length}`);
  }

  console.log("✅ Seed concluída: 50 colaboradores ativos gerados.");
  await connection.end();
}

main().catch(err => {
  console.error("Erro na seed:", err);
  process.exit(1);
});


