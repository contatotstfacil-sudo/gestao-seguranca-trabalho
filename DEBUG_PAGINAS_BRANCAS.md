# 🔍 Debug: Páginas em Branco

## Problema
As páginas estão aparecendo em branco, sem conteúdo.

## Possíveis Causas

### 1. **Servidor não está rodando**
```bash
# Verificar se o servidor está ativo
pnpm dev
```

### 2. **Erro no Console do Navegador**
1. Abra o navegador (F12)
2. Vá na aba "Console"
3. Procure por erros em vermelho
4. Envie os erros encontrados

### 3. **Problema com Autenticação**
- Verifique se está logado
- Tente fazer logout e login novamente

### 4. **Erro de JavaScript**
- Verifique se há erros de sintaxe
- Verifique se todas as importações estão corretas

## Soluções Aplicadas

✅ **Correções já feitas:**
- Tratamento de erro nas queries tRPC
- Verificação de null/undefined
- Logs de debug adicionados
- Admin não precisa de assinatura

## Como Diagnosticar

### Passo 1: Verificar Console do Navegador
1. Abra `http://localhost:3000/planos`
2. Pressione F12
3. Vá na aba "Console"
4. Procure por erros

### Passo 2: Verificar Network
1. F12 → Aba "Network"
2. Recarregue a página
3. Procure por requisições falhadas (vermelho)

### Passo 3: Verificar se Servidor está Rodando
```bash
# No terminal, execute:
pnpm dev

# Deve aparecer:
# ✓ Server running on http://localhost:3000
```

### Passo 4: Testar Rotas Diretamente
```bash
# Teste se a API está funcionando:
curl http://localhost:3000/api/trpc/planos.list
```

## Próximos Passos

Se ainda estiver em branco:
1. Envie os erros do console do navegador
2. Envie o que aparece na aba Network
3. Verifique se o servidor está rodando








