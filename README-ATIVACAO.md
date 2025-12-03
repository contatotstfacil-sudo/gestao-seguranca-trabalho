# ⚡ ATIVAÇÃO RÁPIDA DO SERVIDOR

## 🚀 Método Mais Rápido

### Windows:
**Duplo clique em:**
```
ativar-servidor.bat
```

**OU no PowerShell:**
```powershell
.\ativar-servidor.ps1
```

## ✅ O que o script faz automaticamente:

1. ✅ Limpa processos Node antigos
2. ✅ Libera a porta 3000
3. ✅ Verifica dependências
4. ✅ Verifica Docker
5. ✅ Inicia o servidor

## 📋 Após executar o script:

1. Aguarde aparecer: `✅ Servidor rodando em http://localhost:3000/`
2. Abra o navegador em: `http://localhost:3000`
3. O sistema deve carregar normalmente

## ⚠️ Se ainda não funcionar:

1. **Verifique o Docker Desktop:**
   - Deve estar aberto
   - Container MySQL deve estar rodando

2. **Verifique o Console do navegador (F12):**
   - Procure por erros em vermelho
   - Deve aparecer: "✅ React renderizado com sucesso!"

3. **Verifique os logs do terminal:**
   - Deve aparecer mensagens de sucesso
   - Se houver erros, leia as mensagens

## 🔧 Comandos Manuais (se o script não funcionar):

```bash
# 1. Matar processos Node
taskkill /F /IM node.exe

# 2. Iniciar servidor
pnpm dev
```















