# 🔐 Proteção Contra Vazamento de Dados e Cópia do Sistema

## Proteções Implementadas

### 1. **Criptografia de Dados Sensíveis**
- ✅ CPF e CNPJ são criptografados antes de salvar no banco
- ✅ Algoritmo AES-256-GCM (criptografia simétrica forte)
- ✅ Chave derivada com PBKDF2 (100.000 iterações)
- ✅ Salt único para cada valor criptografado
- ✅ Tag de autenticação para detectar alterações

**Como usar:**
```typescript
import { encryptSensitiveData, decryptSensitiveData } from "./utils/encryption";

// Criptografar antes de salvar
const cpfCriptografado = encryptSensitiveData(cpf);

// Descriptografar ao recuperar
const cpfOriginal = decryptSensitiveData(cpfCriptografado);
```

### 2. **Sanitização de Erros**
- ✅ Mensagens de erro não revelam estrutura do banco
- ✅ Nomes de tabelas e colunas são ocultados
- ✅ IPs e informações de servidor são mascarados
- ✅ Stack traces removidos em produção
- ✅ Mensagens genéricas para erros de banco

**Exemplos de sanitização:**
- `Table 'users' doesn't exist` → `Recurso não encontrado`
- `Unknown column 'cpf'` → `Campo inválido`
- `localhost:3306` → `servidor`
- `192.168.1.1` → `[IP oculto]`

### 3. **Detecção de Scraping**
- ✅ Detecta bots, crawlers e scrapers
- ✅ Bloqueia requisições sem User-Agent
- ✅ Identifica padrões suspeitos (curl, wget, python, etc)
- ✅ Bloqueio automático em produção
- ✅ Logs de tentativas suspeitas

**Padrões detectados:**
- Bots/Crawlers/Spiders
- curl/wget
- Python/Java/Node-fetch/Axios
- Requisições sem User-Agent

### 4. **Detecção de SQL Injection**
- ✅ Validação de padrões SQL em query strings
- ✅ Validação de padrões SQL no body das requisições
- ✅ Bloqueio automático de tentativas
- ✅ Logs de tentativas de ataque

**Padrões bloqueados:**
- Comandos SQL (SELECT, INSERT, UPDATE, DELETE, DROP, etc)
- Comentários SQL (--, #, /* */)
- Operadores SQL (UNION, JOIN, WHERE, etc)
- Tentativas de bypass (OR 1=1, AND 1=1)

### 5. **Watermarking e Rastreamento**
- ✅ ID único de instalação em cada resposta
- ✅ Timestamp em cada resposta
- ✅ User ID rastreado nas respostas
- ✅ Propriedades não enumeráveis (não aparecem em JSON.stringify)
- ✅ Detecta tentativas de cópia/clonagem

**Estrutura do watermark:**
```typescript
{
  _t: timestamp,      // Timestamp da resposta
  _i: installationId, // ID único da instalação
  _u: userId          // ID do usuário
}
```

### 6. **Headers de Segurança Aprimorados**
- ✅ `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet`
- ✅ Remoção de `X-Powered-By` e `Server`
- ✅ Content Security Policy restritiva
- ✅ Validação de origem em produção

### 7. **Proteção de Endpoints**
- ✅ Rate limiting agressivo (100 req/min)
- ✅ Validação de origem obrigatória em produção
- ✅ Bloqueio de scraping em produção
- ✅ Logs de todas as tentativas suspeitas

### 8. **Ocultação de Informações do Banco**
- ✅ Nomes de tabelas não aparecem em erros
- ✅ Nomes de colunas não aparecem em erros
- ✅ Estrutura do banco não é revelada
- ✅ Mensagens de erro genéricas
- ✅ Stack traces removidos em produção

## Configuração

### Variáveis de Ambiente Necessárias

```env
# Criptografia
ENCRYPTION_KEY=sua-chave-secreta-muito-forte-aqui-mude-em-producao

# Origem permitida (produção)
ALLOWED_ORIGINS=https://seudominio.com,https://www.seudominio.com

# Ambiente
NODE_ENV=production
```

### Gerar Chave de Criptografia Segura

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Ou use uma ferramenta online segura
```

## Como Funciona

### Fluxo de Proteção

1. **Requisição chega**
   - Detecta scraping
   - Valida origem
   - Detecta SQL injection
   - Aplica rate limiting

2. **Processamento**
   - Sanitiza inputs
   - Criptografa dados sensíveis
   - Processa requisição

3. **Resposta**
   - Sanitiza erros
   - Adiciona watermark
   - Remove headers sensíveis
   - Aplica headers de segurança

### Proteção de Dados Sensíveis

**Antes (sem proteção):**
```json
{
  "cpf": "12345678900",
  "cnpj": "12345678000190"
}
```

**Depois (com criptografia):**
```json
{
  "cpf": "a1b2c3d4e5f6...:iv:tag:encrypted",
  "cnpj": "f6e5d4c3b2a1...:iv:tag:encrypted"
}
```

### Sanitização de Erros

**Antes (revela estrutura):**
```
Error: Table 'users' doesn't exist at localhost:3306
```

**Depois (genérico):**
```
Erro interno do servidor
```

## Monitoramento

### Logs de Segurança

Todos os eventos suspeitos são logados:

```
[SECURITY] Tentativa de scraping detectada de IP: 192.168.1.1
[SECURITY] Tentativa de SQL Injection detectada de IP: 192.168.1.1
[SECURITY] Tentativa de clonagem detectada de IP: 192.168.1.1
```

### Alertas Recomendados

Configure alertas para:
- Múltiplas tentativas de scraping do mesmo IP
- Tentativas de SQL injection
- Tentativas de clonagem
- Rate limit excedido repetidamente

## Próximos Passos Recomendados

1. **Implementar tabela de auditoria no banco**
   - Salvar todos os logs de segurança
   - Rastrear tentativas de ataque
   - Análise de padrões

2. **Dashboard de segurança**
   - Visualizar tentativas de ataque
   - Estatísticas de segurança
   - Alertas em tempo real

3. **Backup criptografado**
   - Backup automático dos dados
   - Criptografia dos backups
   - Armazenamento seguro

4. **Monitoramento 24/7**
   - Alertas automáticos
   - Notificações por email/SMS
   - Integração com serviços de monitoramento

5. **Testes de penetração**
   - Testes regulares de segurança
   - Auditorias de código
   - Correção de vulnerabilidades

## Status de Implementação

✅ **Implementado:**
- Criptografia de dados sensíveis
- Sanitização de erros
- Detecção de scraping
- Detecção de SQL injection
- Watermarking
- Headers de segurança
- Ocultação de informações do banco

🔄 **Em Desenvolvimento:**
- Tabela de auditoria no banco
- Dashboard de segurança

📋 **Recomendado:**
- Backup criptografado
- Monitoramento 24/7
- Testes de penetração regulares


