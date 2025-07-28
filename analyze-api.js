// Script para analisar a API e identificar otimizações
import fs from 'fs';
import path from 'path';

console.log('🔍 Analisando a API para otimizações...\n');

// Função para analisar um arquivo
function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    const analysis = {
      file: filePath,
      size: content.length,
      lines: lines.length,
      issues: [],
      suggestions: []
    };
    
    // Verificar se tem runtime edge
    if (!content.includes('runtime: "edge"')) {
      analysis.issues.push('❌ Missing Edge Runtime config');
    }
    
    // Verificar se tem CORS
    if (!content.includes('handleOptions') && !content.includes('cors')) {
      analysis.issues.push('⚠️ Missing CORS handling');
    }
    
    // Verificar se tem error handling
    if (!content.includes('try') && !content.includes('catch')) {
      analysis.suggestions.push('💡 Consider adding try-catch error handling');
    }
    
    // Verificar se tem validação de input
    if (content.includes('c.req.json()') && !content.includes('zod') && !content.includes('validation')) {
      analysis.suggestions.push('💡 Consider adding input validation');
    }
    
    // Verificar se tem logging
    if (!content.includes('console.log') && !content.includes('console.error')) {
      analysis.suggestions.push('💡 Consider adding logging for debugging');
    }
    
    return analysis;
  } catch (error) {
    return {
      file: filePath,
      error: error.message
    };
  }
}

// Listar todos os arquivos .ts na pasta api
function getAllTsFiles(dir) {
  const files = [];
  
  function scan(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scan(fullPath);
      } else if (item.endsWith('.ts')) {
        files.push(fullPath);
      }
    }
  }
  
  scan(dir);
  return files;
}

// Analisar todos os arquivos
const apiDir = './api';
const files = getAllTsFiles(apiDir);

console.log(`📁 Encontrados ${files.length} arquivos TypeScript na pasta api/:\n`);

const results = [];
let totalIssues = 0;
let totalSuggestions = 0;

for (const file of files) {
  const analysis = analyzeFile(file);
  results.push(analysis);
  
  if (analysis.issues) {
    totalIssues += analysis.issues.length;
  }
  if (analysis.suggestions) {
    totalSuggestions += analysis.suggestions.length;
  }
}

// Exibir resultados
for (const result of results) {
  console.log(`📄 ${result.file}`);
  console.log(`   📏 Tamanho: ${result.size} chars, ${result.lines} linhas`);
  
  if (result.issues && result.issues.length > 0) {
    console.log('   ❌ Problemas:');
    result.issues.forEach(issue => console.log(`      ${issue}`));
  }
  
  if (result.suggestions && result.suggestions.length > 0) {
    console.log('   💡 Sugestões:');
    result.suggestions.forEach(suggestion => console.log(`      ${suggestion}`));
  }
  
  console.log('');
}

console.log(`📊 Resumo:`);
console.log(`   Total de arquivos: ${files.length}`);
console.log(`   Total de problemas: ${totalIssues}`);
console.log(`   Total de sugestões: ${totalSuggestions}`);

// Verificar package.json
console.log('\n📦 Analisando package.json...');
try {
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  
  const missingDeps = [];
  const suggestedDeps = [];
  
  // Verificar dependências importantes
  if (!packageJson.dependencies['@hono/node-server']) {
    missingDeps.push('@hono/node-server (para desenvolvimento local)');
  }
  
  if (!packageJson.dependencies['zod']) {
    suggestedDeps.push('zod (para validação de dados)');
  }
  
  if (!packageJson.dependencies['@hono/zod-validator']) {
    suggestedDeps.push('@hono/zod-validator (para validação automática)');
  }
  
  if (missingDeps.length > 0) {
    console.log('❌ Dependências faltando:');
    missingDeps.forEach(dep => console.log(`   ${dep}`));
  }
  
  if (suggestedDeps.length > 0) {
    console.log('💡 Dependências sugeridas:');
    suggestedDeps.forEach(dep => console.log(`   ${dep}`));
  }
  
} catch (error) {
  console.log('❌ Erro ao analisar package.json:', error.message);
}

console.log('\n✅ Análise concluída!'); 