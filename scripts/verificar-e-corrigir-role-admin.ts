/**
 * Script para verificar e corrigir o role do usuário admin desenvolvedor
 */

import dotenv from "dotenv";
import { getDb } from "../server/db";

// Carregar variáveis de ambiente
dotenv.config({ path: ".env.local" });
dotenv.config();

async function verificarECorrigirRoleAdmin() {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    console.log("🔍 Verificando usuários admin no banco...\n");

    // Buscar todos os usuários
    const { users } = await import("../drizzle/schema");
    const { eq, or } = await import("drizzle-orm");
    
    const allUsers = await db.select().from(users);
    
    console.log(`📊 Total de usuários encontrados: ${allUsers.length}\n`);
    
    // Procurar usuários que deveriam ser admin
    const usuariosAdmin = allUsers.filter(u => 
      u.role === "admin" || u.role === "super_admin"
    );
    
    console.log(`👑 Usuários admin encontrados: ${usuariosAdmin.length}`);
    usuariosAdmin.forEach(u => {
      console.log(`  - ID: ${u.id}, Nome: ${u.name || "N/A"}, Email: ${u.email || "N/A"}, Role: ${u.role}, TenantId: ${u.tenantId || "N/A"}`);
    });
    
    // Procurar usuários tenant_admin
    const usuariosTenantAdmin = allUsers.filter(u => u.role === "tenant_admin");
    
    console.log(`\n🔐 Usuários tenant_admin encontrados: ${usuariosTenantAdmin.length}`);
    usuariosTenantAdmin.forEach(u => {
      console.log(`  - ID: ${u.id}, Nome: ${u.name || "N/A"}, Email: ${u.email || "N/A"}, Role: ${u.role}, TenantId: ${u.tenantId || "N/A"}`);
    });
    
    // Verificar se há usuários sem tenantId que deveriam ser admin
    const usuariosSemTenant = allUsers.filter(u => 
      !u.tenantId && (u.role === "admin" || u.role === "super_admin")
    );
    
    console.log(`\n✅ Usuários admin/super_admin sem tenantId (correto): ${usuariosSemTenant.length}`);
    usuariosSemTenant.forEach(u => {
      console.log(`  - ID: ${u.id}, Nome: ${u.name || "N/A"}, Email: ${u.email || "N/A"}, Role: ${u.role}`);
    });
    
    // Verificar se há usuários com tenantId que são admin (pode ser correto se for admin do tenant)
    const usuariosAdminComTenant = allUsers.filter(u => 
      u.tenantId && (u.role === "admin" || u.role === "super_admin")
    );
    
    if (usuariosAdminComTenant.length > 0) {
      console.log(`\n⚠️ Usuários admin/super_admin COM tenantId (pode ser problema): ${usuariosAdminComTenant.length}`);
      usuariosAdminComTenant.forEach(u => {
        console.log(`  - ID: ${u.id}, Nome: ${u.name || "N/A"}, Email: ${u.email || "N/A"}, Role: ${u.role}, TenantId: ${u.tenantId}`);
      });
    }
    
    // Verificar usuário específico (ID 4198 baseado nos logs)
    const usuarioEspecifico = allUsers.find(u => u.id === 4198);
    if (usuarioEspecifico) {
      console.log(`\n🎯 Usuário ID 4198 (do log):`);
      console.log(`  - Nome: ${usuarioEspecifico.name || "N/A"}`);
      console.log(`  - Email: ${usuarioEspecifico.email || "N/A"}`);
      console.log(`  - Role: ${usuarioEspecifico.role}`);
      console.log(`  - TenantId: ${usuarioEspecifico.tenantId || "N/A"}`);
      
      if (usuarioEspecifico.role === "tenant_admin") {
        console.log(`\n⚠️ ATENÇÃO: Este usuário está como 'tenant_admin' mas pode precisar ser 'admin' ou 'super_admin'`);
        console.log(`   Se este é o desenvolvedor/admin do sistema, ele deveria ter role 'admin' ou 'super_admin'`);
        console.log(`   e não deveria ter tenantId (ou deveria ser null)`);
      }
    }
    
    console.log("\n✅ Verificação concluída!");
    console.log("\n💡 Se você é o desenvolvedor/admin do sistema e está logado como 'tenant_admin',");
    console.log("   você precisa ter role 'admin' ou 'super_admin' e não ter tenantId (ou tenantId = null)");
    console.log("   para que os limites de plano não se apliquem a você.");
    
  } catch (error: any) {
    console.error("❌ Erro ao verificar usuários:", error);
    process.exit(1);
  }
}

verificarECorrigirRoleAdmin();

