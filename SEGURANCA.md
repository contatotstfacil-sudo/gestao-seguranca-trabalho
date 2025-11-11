# 🔒 Sistema de Segurança - TST Fácil

## Proteções Implementadas

### 1. **Rate Limiting (Limitação de Taxa)**
- ✅ **Login**: Máximo de 5 tentativas por 15 minutos por IP
- ✅ **API Geral**: Máximo de 100 requisições por minuto por endpoint
- ✅ Bloqueio automático após exceder limites
- ✅ Mensagens claras de retry-after

### 2. **Validação de Senhas Fortes**
- ✅ Mínimo de 8 caracteres
- ✅ Pelo menos 1 letra maiúscula
- ✅ Pelo menos 1 letra minúscula
- ✅ Pelo menos 1 número
- ✅ Pelo menos 1 caractere especial
- ✅ Verificação contra senhas comuns/fáceis

### 3. **Sanitização de Inputs**
- ✅ Remoção de tags HTML (`<`, `>`)
- ✅ Remoção de scripts JavaScript (`javascript:`)
- ✅ Remoção de event handlers (`onclick=`, etc)
- ✅ Sanitização recursiva de objetos

### 4. **Headers de Segurança**
- ✅ `X-Content-Type-Options: nosniff` - Previne MIME sniffing
- ✅ `X-Frame-Options: DENY` - Previne clickjacking
- ✅ `X-XSS-Protection: 1; mode=block` - Proteção XSS
- ✅ `Referrer-Policy: strict-origin-when-cross-origin`
- ✅ `Content-Security-Policy` - Política de segurança de conteúdo

### 5. **Proteção CSRF**
- ✅ Cookies com `SameSite: strict`
- ✅ Cookies `httpOnly` (não acessíveis via JavaScript)
- ✅ Cookies `secure` em produção (HTTPS apenas)
- ✅ Validação de origem de requisições

### 6. **Sistema de Auditoria**
- ✅ Log de todas as tentativas de login (sucesso e falha)
- ✅ Log de criação/edição/exclusão de usuários
- ✅ Log de mudanças de permissões
- ✅ Log de alterações de senha
- ✅ Log de logout
- ✅ Registro de IP e User-Agent

### 7. **Proteção de Dados**
- ✅ Senhas hasheadas com bcrypt (10 rounds)
- ✅ Validação de CPF/CNPJ/Email
- ✅ Normalização de dados de entrada
- ✅ Proteção contra SQL Injection (Drizzle ORM)

### 8. **Autenticação Segura**
- ✅ JWT tokens com expiração
- ✅ Sessões com cookies seguros
- ✅ Validação de credenciais
- ✅ Rate limiting específico para login

## Como Funciona

### Rate Limiting
Quando um usuário tenta fazer login muitas vezes:
1. Sistema conta tentativas por IP
2. Após 5 tentativas em 15 minutos, bloqueia
3. Retorna erro 429 com tempo de espera
4. Registra tentativa no log de auditoria

### Validação de Senha
Ao criar/atualizar usuário:
1. Valida força da senha
2. Verifica requisitos (maiúscula, minúscula, número, especial)
3. Compara com lista de senhas comuns
4. Rejeita se não atender critérios

### Sanitização
Todos os inputs de texto são sanitizados:
1. Remove caracteres perigosos
2. Remove scripts e event handlers
3. Previne XSS attacks
4. Mantém dados seguros

### Headers de Segurança
Cada resposta HTTP inclui:
1. Headers de proteção padrão
2. Content Security Policy
3. Proteção contra clickjacking
4. Proteção contra MIME sniffing

### Auditoria
Todas as ações críticas são registradas:
1. Login/Logout
2. Criação/Edição/Exclusão de usuários
3. Mudanças de permissões
4. Alterações de senha
5. Com IP, User-Agent e timestamp

## Configuração

### Variáveis de Ambiente Recomendadas
```env
# Segurança
NODE_ENV=production
ALLOWED_ORIGINS=https://seudominio.com,https://www.seudominio.com
COOKIE_SECRET=sua-chave-secreta-muito-forte-aqui
JWT_SECRET=sua-chave-jwt-secreta-aqui

# Rate Limiting (opcional, usa padrões se não definido)
LOGIN_MAX_ATTEMPTS=5
LOGIN_WINDOW_MS=900000
API_MAX_REQUESTS=100
API_WINDOW_MS=60000
```

## Monitoramento

### Logs de Auditoria
Todos os logs são exibidos no console com prefixo `[AUDIT]`:
```json
{
  "timestamp": "2025-01-XX...",
  "userId": 1,
  "action": "LOGIN_SUCCESS",
  "resource": "auth",
  "details": {...},
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

### Ações Auditadas
- `LOGIN_SUCCESS` - Login bem-sucedido
- `LOGIN_FAILED` - Tentativa de login falha
- `LOGOUT` - Logout do sistema
- `USER_CREATE` - Criação de usuário
- `USER_UPDATE` - Atualização de usuário
- `USER_DELETE` - Exclusão de usuário
- `PERMISSION_CHANGE` - Mudança de permissões
- `PASSWORD_CHANGE` - Alteração de senha

## Próximos Passos Recomendados

1. **Implementar tabela de auditoria no banco** - Salvar logs em tabela dedicada
2. **Dashboard de segurança** - Visualizar tentativas de ataque e logs
3. **Alertas automáticos** - Notificar admin sobre atividades suspeitas
4. **2FA (Autenticação de dois fatores)** - Adicionar camada extra de segurança
5. **Whitelist/Blacklist de IPs** - Controlar acesso por IP
6. **Backup automático** - Proteção contra perda de dados
7. **Criptografia de dados sensíveis** - Criptografar CPF, CNPJ, etc no banco

## Status de Segurança

✅ **Implementado e Funcionando:**
- Rate limiting
- Validação de senhas
- Sanitização de inputs
- Headers de segurança
- Proteção CSRF
- Sistema de auditoria
- Proteção de cookies

🔄 **Em Desenvolvimento:**
- Tabela de auditoria no banco
- Dashboard de segurança

📋 **Recomendado para Produção:**
- HTTPS obrigatório
- Firewall configurado
- Backup regular
- Monitoramento 24/7
- Atualizações de segurança regulares


