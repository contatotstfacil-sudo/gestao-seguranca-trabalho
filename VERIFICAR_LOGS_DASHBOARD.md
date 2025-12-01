# 🔍 Como Verificar os Logs do Dashboard

## Passo a Passo para Verificar se o Backend está Recebendo empresaId

### 1. Inicie o Servidor
Certifique-se de que o servidor está rodando. Você verá logs como:
```
[Server] ✅ Servidor rodando em http://localhost:3000/
```

### 2. Abra o Dashboard no Navegador
- Acesse: `http://localhost:3000/dashboard-colaboradores`
- Abra o Console do Navegador (F12 → Console)

### 3. Selecione uma Empresa no Filtro
Quando você selecionar uma empresa, você verá:

**NO CONSOLE DO NAVEGADOR (Frontend):**
```
═══════════════════════════════════════
[Dashboard] 🎯 MUDANDO EMPRESA
[Dashboard] Valor selecionado: 1
[Dashboard] Novo empresaId: 1
[Dashboard] EmpresaId anterior: undefined
[Dashboard] 📤 QueryInput criado: {"empresaId":1}
[Dashboard] 🔄 Executando refetch...
[Dashboard] ✅ Refetch concluído: {total: X, empresaIdUsado: 1}
```

**NO TERMINAL DO SERVIDOR (Backend):**
```
═══════════════════════════════════════
[colaboradores.stats] 🚀 QUERY INICIADA
[colaboradores.stats] Input recebido: {
  "empresaId": 1
}
[colaboradores.stats] User role: admin
[colaboradores.stats] User empresaId: null
[colaboradores.stats] ✅ Admin - usando empresaId: 1
[colaboradores.stats] 📊 Chamando getColaboradorStats com empresaId: 1
[getColaboradorStats] 🗄️ INICIANDO QUERY NO BANCO
[getColaboradorStats] empresaId recebido: 1 Tipo: number
[getColaboradorStats] ✅ Filtro empresaId ADICIONADO: 1
[colaboradores.stats] ✅ RESULTADO: {
  total: X,
  ativos: Y,
  inativos: Z
}
═══════════════════════════════════════
```

### 4. O Que Verificar

✅ **SE ESTÁ FUNCIONANDO:**
- No console do navegador: Você vê `✅ Refetch concluído` com dados diferentes
- No terminal do servidor: Você vê `Input recebido: {"empresaId": X}` com o ID correto
- No terminal do servidor: Você vê `✅ Filtro empresaId ADICIONADO: X`
- Os cards no dashboard mudam de valor

❌ **SE NÃO ESTÁ FUNCIONANDO:**
- No console do navegador: Você vê `QueryInput criado` mas não vê `Refetch concluído`
- No terminal do servidor: Você NÃO vê `[colaboradores.stats] 🚀 QUERY INICIADA` quando muda o filtro
- No terminal do servidor: O `Input recebido` está sempre vazio `{}` ou sempre o mesmo
- Os cards não mudam quando você seleciona empresas diferentes

### 5. Problemas Comuns

**Problema 1: Backend não recebe a requisição**
- **Sintoma:** Não aparecem logs `[colaboradores.stats]` no servidor quando você muda o filtro
- **Causa:** Frontend não está fazendo nova requisição
- **Solução:** Verificar se `refetch()` está sendo chamado

**Problema 2: Backend recebe mas empresaId está errado**
- **Sintoma:** Logs aparecem mas `Input recebido` mostra `{}` ou sempre o mesmo ID
- **Causa:** Frontend não está passando empresaId corretamente
- **Solução:** Verificar `queryInput` no console do navegador

**Problema 3: Backend recebe mas não filtra**
- **Sintoma:** Logs mostram empresaId correto mas resultados são sempre os mesmos
- **Causa:** Problema no SQL do banco de dados
- **Solução:** Verificar logs `[getColaboradorStats]` no servidor

### 6. Teste Rápido

1. Abra o dashboard
2. Anote o valor do card "Total de Colaboradores" (ex: 10)
3. Selecione uma empresa específica
4. Verifique:
   - O valor mudou? ✅ Funcionou
   - O valor continua o mesmo? ❌ Não funcionou
5. Verifique os logs do servidor:
   - Apareceu `[colaboradores.stats] 🚀 QUERY INICIADA`? ✅ Requisição chegou
   - O `Input recebido` tem o empresaId correto? ✅ Input está certo
   - O `RESULTADO` mudou? ✅ Filtro funcionou


