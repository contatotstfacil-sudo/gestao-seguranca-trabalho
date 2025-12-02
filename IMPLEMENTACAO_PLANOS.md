# 🎯 Implementação de Sistema de Planos e Assinaturas

## ✅ O que foi implementado

### 1. **Schema do Banco de Dados**
- ✅ Tabela `planos` criada com todos os campos necessários
- ✅ Tabela `assinaturas` criada para gerenciar assinaturas dos usuários
- ✅ Campo `planoId` adicionado à tabela `users`
- ✅ Migração gerada: `drizzle/0023_last_photon.sql`

### 2. **Utilitários de Validação**
- ✅ `server/utils/planos.ts` criado com funções:
  - `getLimitesPlano()` - Obtém limites do plano do usuário
  - `podeCriarEmpresa()` - Valida se pode criar empresa
  - `podeCriarColaborador()` - Valida se pode criar colaborador
  - `getPlanoUsuario()` - Obtém informações completas do plano

### 3. **Rotas tRPC**
- ✅ `planos.list` - Lista todos os planos ativos
- ✅ `planos.getById` - Busca plano por ID
- ✅ `planos.getByNome` - Busca plano por nome
- ✅ `assinaturas.getMinha` - Obtém assinatura do usuário logado
- ✅ `assinaturas.create` - Cria nova assinatura
- ✅ `assinaturas.cancelar` - Cancela assinatura

### 4. **Validação de Limites Integrada**
- ✅ Validação ao criar empresa (`empresas.create`)
- ✅ Validação ao criar colaborador (`colaboradores.create`)

### 5. **Script de Popular Planos**
- ✅ `scripts/popular-planos.ts` criado para popular planos iniciais:
  - Básico (R$ 147/mês) - 1 empresa, até 50 colaboradores
  - Técnico/Engenheiro (R$ 147/mês) - 6 empresas, 30 por empresa
  - Profissional (R$ 297/mês) - Ilimitado empresas, até 200 colaboradores
  - Enterprise - Ilimitado tudo

---

## 📋 Próximos Passos

### 1. **Aplicar Migração e Popular Planos**
```bash
# Aplicar migração no banco
pnpm db:push

# Popular planos iniciais
pnpm seed:planos
```

### 2. **Criar Interface Frontend**
- [ ] Página de planos (`/planos`)
- [ ] Página de checkout (`/checkout`)
- [ ] Componente de exibição do plano atual
- [ ] Integração com landing page

### 3. **Integrar Mercado Pago**
- [ ] Instalar SDK do Mercado Pago
- [ ] Criar endpoint de criação de preferência de pagamento
- [ ] Criar webhook para confirmação de pagamento
- [ ] Atualizar status da assinatura após pagamento

### 4. **Sistema de Renovação Automática**
- [ ] Job para verificar assinaturas vencidas
- [ ] Notificações de vencimento (7 dias antes)
- [ ] Bloqueio de acesso após vencimento

---

## 🔧 Como Usar

### Verificar Limites Antes de Criar
```typescript
import { podeCriarEmpresa, podeCriarColaborador } from "./server/utils/planos";

// Verificar se pode criar empresa
const validacao = await podeCriarEmpresa(userId);
if (!validacao.pode) {
  throw new Error(validacao.motivo);
}

// Verificar se pode criar colaborador
const validacao = await podeCriarColaborador(userId, empresaId);
if (!validacao.pode) {
  throw new Error(validacao.motivo);
}
```

### Criar Assinatura
```typescript
// Via tRPC
const assinatura = await trpc.assinaturas.create.mutate({
  planoId: 1,
  periodo: "mensal", // ou "trimestral", "anual"
  metodoPagamento: "mercado_pago",
  idPagamento: "123456",
});
```

### Obter Plano do Usuário
```typescript
const plano = await trpc.assinaturas.getMinha.query();
```

---

## 📊 Estrutura dos Planos

| Plano | Preço Mensal | Preço Trimestral | Empresas | Colaboradores/Empresa | Total Colaboradores |
|-------|--------------|------------------|----------|----------------------|---------------------|
| Básico | R$ 147 | R$ 397 | 1 | Ilimitado | 50 |
| Técnico | R$ 147 | R$ 397 | 6 | 30 | 180 |
| Profissional | R$ 297 | R$ 797 | Ilimitado | Ilimitado | 200 |
| Enterprise | Sob consulta | Sob consulta | Ilimitado | Ilimitado | Ilimitado |

---

## 🚀 Status da Implementação

- ✅ **Backend completo** - Todas as rotas e validações implementadas
- ⏳ **Frontend** - Pendente (próxima etapa)
- ⏳ **Pagamento** - Pendente (integração Mercado Pago)
- ⏳ **Renovação** - Pendente (jobs automáticos)

---

## 📝 Notas Importantes

1. **Validação Automática**: As validações de limites são aplicadas automaticamente ao criar empresa ou colaborador. Se o limite for atingido, uma mensagem de erro será retornada.

2. **Assinaturas Vencidas**: O sistema verifica se a assinatura está ativa e não vencida antes de permitir operações.

3. **Múltiplas Assinaturas**: Ao criar uma nova assinatura, as anteriores são automaticamente canceladas.

4. **Preços em Centavos**: Todos os preços são armazenados em centavos (R$ 147 = 14700).

---

## 🐛 Troubleshooting

### Erro: "Usuário sem assinatura ativa"
- Verifique se o usuário tem uma assinatura criada
- Verifique se a assinatura não está vencida (`dataFim < hoje`)

### Erro: "Limite de empresas atingido"
- O usuário precisa fazer upgrade do plano
- Verifique o plano atual: `trpc.assinaturas.getMinha.query()`

### Erro: "Limite de colaboradores atingido"
- Verifique se é limite por empresa ou total
- Para plano Técnico: limite é por empresa (30)
- Para plano Básico/Profissional: limite é total





















