#!/bin/bash
# Script para iniciar sistema localmente no Linux/Mac

echo "🚀 Iniciando TST Fácil - Ambiente Local"
echo ""

# Verificar se .env.local existe
if [ ! -f ".env.local" ]; then
    echo "⚠️  Arquivo .env.local não encontrado!"
    echo "📝 Criando .env.local com configurações padrão..."
    
    cat > .env.local << EOF
# Configuração Local - Desenvolvimento
DATABASE_URL=mysql://root:senha@localhost:3306/sst
NODE_ENV=development
PORT=3000
JWT_SECRET=chave-local-desenvolvimento-123
COOKIE_SECRET=chave-local-cookie-123
ENCRYPTION_KEY=chave-local-criptografia-123
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
VITE_USE_TRADITIONAL_LOGIN=1
EOF
    
    echo "✅ Arquivo .env.local criado!"
    echo "⚠️  IMPORTANTE: Configure sua DATABASE_URL no arquivo .env.local"
    echo ""
fi

# Carregar variáveis do .env.local
export $(grep -v '^#' .env.local | xargs)

echo "📋 Configuração:"
echo "   DATABASE_URL: $DATABASE_URL"
echo "   NODE_ENV: $NODE_ENV"
echo "   PORT: $PORT"
echo ""
echo "🌐 Acesse: http://localhost:$PORT"
echo ""

# Iniciar servidor
echo "▶️  Iniciando servidor..."
pnpm dev

