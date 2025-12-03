/**
 * Script para tornar um usuário administrador
 * 
 * Uso:
 * npx tsx scripts/tornar-usuario-admin.ts <email_ou_cpf_do_usuario>
 * 
 * Exemplo:
 * npx tsx scripts/tornar-usuario-admin.ts admin@exemplo.com
 * ou
 * npx tsx scripts/tornar-usuario-admin.ts 12345678900
 */

import { getDb } from "../server/db";
import { users } from "../drizzle/schema";
import { eq, or, like } from "drizzle-orm";

async function tornarUsuarioAdmin(identificador: string) {
  const db = await getDb();
  if (!db) {
    console.error("❌ Erro: Não foi possível conectar ao banco de dados");
    process.exit(1);
  }

  try {
    console.log(`🔍 Buscando usuário: ${identificador}...`);

    // Buscar por email ou CPF
    const usuario = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, identificador.toLowerCase()),
          eq(users.cpf, identificador.replace(/\D/g, "")),
          like(users.email, `%${identificador}%`)
        )
      )
      .limit(1);

    if (usuario.length === 0) {
      console.error(`❌ Usuário não encontrado: ${identificador}`);
      console.log("\n💡 Dica: Verifique se o email ou CPF está correto.");
      process.exit(1);
    }

    const user = usuario[0];
    console.log(`\n✅ Usuário encontrado:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Nome: ${user.name || "Não informado"}`);
    console.log(`   Email: ${user.email || "Não informado"}`);
    console.log(`   Role atual: ${user.role}`);

    if (user.role === "admin" || user.role === "super_admin") {
      console.log(`\n✅ Usuário já é administrador!`);
      return;
    }

    // Atualizar role para admin
    await db
      .update(users)
      .set({ role: "admin" })
      .where(eq(users.id, user.id));

    console.log(`\n✅ Role atualizado para "admin" com sucesso!`);
    console.log(`\n🔄 Faça logout e login novamente para ver as mudanças.`);
  } catch (error) {
    console.error("❌ Erro ao atualizar usuário:", error);
    process.exit(1);
  }
}

// Executar script
const identificador = process.argv[2];

if (!identificador) {
  console.error("❌ Erro: Identificador do usuário não fornecido");
  console.log("\n📖 Uso:");
  console.log("   npx tsx scripts/tornar-usuario-admin.ts <email_ou_cpf>");
  console.log("\n💡 Exemplos:");
  console.log("   npx tsx scripts/tornar-usuario-admin.ts admin@exemplo.com");
  console.log("   npx tsx scripts/tornar-usuario-admin.ts 12345678900");
  process.exit(1);
}

tornarUsuarioAdmin(identificador)
  .then(() => {
    console.log("\n✨ Script concluído!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erro fatal:", error);
    process.exit(1);
  });






