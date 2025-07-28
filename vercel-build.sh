#!/bin/bash

echo "🚀 Iniciando build para Vercel..."

# Verificar se TypeScript compila
echo "📝 Verificando TypeScript..."
npx tsc --noEmit

if [ $? -eq 0 ]; then
    echo "✅ TypeScript compilou com sucesso!"
else
    echo "❌ Erro na compilação TypeScript"
    exit 1
fi

# Verificar se todos os arquivos da API existem
echo "📁 Verificando arquivos da API..."
for file in api/*.ts api/*/*.ts; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    fi
done

echo "🎉 Build concluído com sucesso!" 