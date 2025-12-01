# Scripts de Seed - Dados Iniciais

Este documento lista todos os scripts de seed disponíveis para popular o banco de dados com dados de teste.

## ⚠️ IMPORTANTE

Antes de executar qualquer script, certifique-se de que o arquivo `.env` está configurado corretamente com a variável `DATABASE_URL` apontando para o seu banco de dados MySQL.

## 📋 Scripts Disponíveis

### 1. **seed-construtoras.ts**
Cadastra 6 construtoras com dados completos (razão social, CNPJ, endereço, etc.)

```bash
pnpm tsx seed-construtoras.ts
```

**Dados cadastrados:**
- 6 empresas construtoras
- CNPJs únicos
- Endereços completos
- CNAEs de construção civil

### 2. **seed-responsaveis.ts**
Cadastra 2 responsáveis técnicos (Engenheiros/Técnicos de Segurança do Trabalho)

```bash
pnpm tsx seed-responsaveis.ts
```

**Dados cadastrados:**
- João Silva Santos - Engenheiro de Segurança do Trabalho (CREA 123456-SP)
- Maria Oliveira Costa - Técnica em Segurança do Trabalho (CREA 789012-RJ)

### 3. **seed-setores.ts**
Cadastra 20 setores padrão da empresa

```bash
pnpm tsx seed-setores.ts
```

**Setores cadastrados:**
- Diretoria / Presidência
- Departamento Financeiro
- Recursos Humanos (RH)
- Departamento Jurídico
- Departamento Comercial
- Marketing e Comunicação
- Compras e Suprimentos
- Almoxarifado / Logística
- Tecnologia da Informação (TI)
- Departamento Administrativo
- Engenharia de Obras
- Departamento de Projetos
- Planejamento e Controle de Obras (PCO)
- Segurança do Trabalho (SST)
- Qualidade (SGQ)
- Meio Ambiente (SMA)
- Topografia
- Manutenção e Equipamentos
- Custos e Orçamentos
- Pós-Obra / Assistência Técnica

### 4. **seed-colaboradores.ts**
Cadastra 50 colaboradores (42 adultos + 8 aprendizes)

```bash
pnpm tsx seed-colaboradores.ts
```

**Dados cadastrados:**
- 50 colaboradores com dados completos
- CPFs, RGs e PIS únicos
- Distribuição entre adultos e aprendizes

### 5. **seed-colaboradores-construcao.ts**
Cadastra 50 colaboradores específicos para construção (35 homens + 15 mulheres)

```bash
pnpm tsx seed-colaboradores-construcao.ts
```

### 6. **seed-adicionais.ts**
Cadastra colaboradores adicionais (12 inativos + 4 aprendizes)

```bash
pnpm tsx seed-adicionais.ts
```

### 7. **seed-colaboradores-inativos.ts**
Cadastra colaboradores inativos com datas de rescisão

```bash
pnpm tsx seed-colaboradores-inativos.ts
```

### 8. **seed-obras.ts**
Cadastra obras de teste

```bash
pnpm tsx seed-obras.ts
```

### 9. **seed-permissoes.ts**
Cadastra permissões do sistema

```bash
pnpm tsx seed-permissoes.ts
```

## 🚀 Executar Todos os Seeds (Ordem Recomendada)

Execute os scripts na seguinte ordem:

```bash
# 1. Construtoras (base para tudo)
pnpm tsx seed-construtoras.ts

# 2. Responsáveis técnicos
pnpm tsx seed-responsaveis.ts

# 3. Setores
pnpm tsx seed-setores.ts

# 4. Colaboradores
pnpm tsx seed-colaboradores.ts

# 5. Obras (opcional)
pnpm tsx seed-obras.ts

# 6. Permissões (opcional)
pnpm tsx seed-permissoes.ts
```

## 📝 Notas

- Os scripts verificam dados existentes e evitam duplicatas quando possível
- Alguns scripts podem limpar dados existentes (verifique o código antes de executar)
- Certifique-se de ter permissões adequadas no banco de dados
- Os scripts são idempotentes quando possível (podem ser executados múltiplas vezes)

## 🔧 Scripts Adicionais

### **scripts/cadastrar-cargos-construtora-nacional.ts**
Cadastra 10 cargos com CBOs para a "Construtora Nacional do Brasil Ltda"

```bash
pnpm tsx scripts/cadastrar-cargos-construtora-nacional.ts
```

Este script:
- Busca a empresa "Construtora Nacional do Brasil Ltda"
- Cria setores padrão se não existirem
- Cadastra 10 cargos com CBOs
- Vincula cargos a setores aleatórios

## ⚡ Script Master (Em Desenvolvimento)

Um script master está sendo desenvolvido em `scripts/executar-todos-seeds.ts` para executar todos os seeds em ordem automaticamente. Este script ainda requer ajustes na configuração do DATABASE_URL.








