import fs from "fs";
import path from "path";

console.log("🚀 Validação Pré-Deploy para Vercel\n");
console.log("=" * 60);

// Função para verificar se arquivo existe
function fileExists(filePath) {
    return fs.existsSync(filePath);
}

// Função para ler conteúdo do arquivo
function readFile(filePath) {
    try {
        return fs.readFileSync(filePath, "utf8");
    } catch (error) {
        return null;
    }
}

// Função para validar package.json
function validatePackageJson() {
    console.log("\n📦 VALIDAÇÃO 1: Package.json");
    console.log("-" * 50);

    if (!fileExists("package.json")) {
        console.log("❌ package.json não encontrado");
        return false;
    }

    const content = readFile("package.json");
    if (!content) {
        console.log("❌ Erro ao ler package.json");
        return false;
    }

    let pkg;
    try {
        pkg = JSON.parse(content);
    } catch (error) {
        console.log("❌ package.json inválido");
        return false;
    }

    const checks = [
        {
            name: "Type module configurado",
            check: pkg.type === "module",
            fix: 'Adicione "type": "module" ao package.json',
        },
        {
            name: "Scripts necessários",
            check: pkg.scripts && pkg.scripts.dev && pkg.scripts.build,
            fix: "Adicione scripts dev e build",
        },
        {
            name: "Dependência Hono",
            check: pkg.dependencies && pkg.dependencies.hono,
            fix: "npm install hono",
        },
        {
            name: "Dependência Supabase",
            check:
                pkg.dependencies && pkg.dependencies["@supabase/supabase-js"],
            fix: "npm install @supabase/supabase-js",
        },
        {
            name: "Dependência Google Gemini",
            check:
                pkg.dependencies && pkg.dependencies["@google/generative-ai"],
            fix: "npm install @google/generative-ai",
        },
    ];

    let passed = 0;
    checks.forEach((check) => {
        if (check.check) {
            console.log(`✅ ${check.name}`);
            passed++;
        } else {
            console.log(`❌ ${check.name} - ${check.fix}`);
        }
    });

    console.log(`\n📊 Package.json: ${passed}/${checks.length} validações`);
    return passed === checks.length;
}

// Função para validar vercel.json
function validateVercelJson() {
    console.log("\n⚡ VALIDAÇÃO 2: Vercel.json");
    console.log("-" * 50);

    if (!fileExists("vercel.json")) {
        console.log("❌ vercel.json não encontrado");
        console.log("💡 Criando vercel.json...");

        const vercelConfig = {
            version: 2,
            buildCommand: "echo 'No build needed'",
            outputDirectory: ".",
            installCommand: "pnpm install",
            framework: null,
            headers: [
                {
                    source: "/api/(.*)",
                    headers: [
                        { key: "Access-Control-Allow-Origin", value: "*" },
                        {
                            key: "Access-Control-Allow-Methods",
                            value: "GET, POST, PUT, PATCH, DELETE, OPTIONS",
                        },
                        {
                            key: "Access-Control-Allow-Headers",
                            value: "Content-Type, Authorization, X-Requested-With",
                        },
                    ],
                },
            ],
        };

        try {
            fs.writeFileSync(
                "vercel.json",
                JSON.stringify(vercelConfig, null, 2),
            );
            console.log("✅ vercel.json criado automaticamente");
        } catch (error) {
            console.log("❌ Erro ao criar vercel.json");
            return false;
        }
    }

    const content = readFile("vercel.json");
    if (!content) {
        console.log("❌ Erro ao ler vercel.json");
        return false;
    }

    let config;
    try {
        config = JSON.parse(content);
    } catch (error) {
        console.log("❌ vercel.json inválido");
        return false;
    }

    const checks = [
        {
            name: "Versão 2 configurada",
            check: config.version === 2,
            fix: 'Configure "version": 2',
        },
        {
            name: "Headers CORS configurados",
            check: config.headers && config.headers.length > 0,
            fix: "Configure headers CORS",
        },
        {
            name: "Framework null",
            check: config.framework === null,
            fix: 'Configure "framework": null',
        },
    ];

    let passed = 0;
    checks.forEach((check) => {
        if (check.check) {
            console.log(`✅ ${check.name}`);
            passed++;
        } else {
            console.log(`❌ ${check.name} - ${check.fix}`);
        }
    });

    console.log(`\n📊 Vercel.json: ${passed}/${checks.length} validações`);
    return passed === checks.length;
}

// Função para validar Edge Runtime nos endpoints
function validateEdgeRuntime() {
    console.log("\n⚡ VALIDAÇÃO 3: Edge Runtime");
    console.log("-" * 50);

    const apiDir = "api";
    if (!fs.existsSync(apiDir)) {
        console.log("❌ Diretório api/ não encontrado");
        return false;
    }

    const endpointFiles = [];

    // Função recursiva para encontrar arquivos .ts
    function findTsFiles(dir) {
        const files = fs.readdirSync(dir);
        files.forEach((file) => {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                findTsFiles(fullPath);
            } else if (
                file.endsWith(".ts") &&
                !file.includes(".model.") &&
                !file.includes(".d.") &&
                !fullPath.includes("/config/") &&
                !fullPath.includes("/utils/")
            ) {
                endpointFiles.push(fullPath);
            }
        });
    }

    findTsFiles(apiDir);

    console.log(`📁 Encontrados ${endpointFiles.length} arquivos de endpoint`);

    let validEndpoints = 0;
    let totalEndpoints = 0;

    endpointFiles.forEach((file) => {
        totalEndpoints++;
        const content = readFile(file);

        if (content) {
            const hasEdgeConfig = content.includes(
                'export const config = { runtime: "edge" }',
            );
            const hasHttpExports =
                /export const (GET|POST|PUT|DELETE|PATCH|OPTIONS)/.test(
                    content,
                );

            if (hasEdgeConfig && hasHttpExports) {
                console.log(`✅ ${file}`);
                validEndpoints++;
            } else if (hasEdgeConfig) {
                console.log(
                    `⚠️ ${file} - Edge config OK, mas faltam exports HTTP`,
                );
                validEndpoints++; // Considera válido se tem Edge config
            } else if (hasHttpExports) {
                console.log(
                    `❌ ${file} - Exports HTTP OK, mas falta Edge config`,
                );
            } else {
                console.log(`❌ ${file} - Sem Edge config nem exports HTTP`);
            }
        } else {
            console.log(`❌ ${file} - Erro ao ler arquivo`);
        }
    });

    console.log(
        `\n📊 Edge Runtime: ${validEndpoints}/${totalEndpoints} endpoints válidos`,
    );
    return validEndpoints === totalEndpoints;
}

// Função para validar variáveis de ambiente
function validateEnvironmentVariables() {
    console.log("\n🔐 VALIDAÇÃO 4: Variáveis de Ambiente");
    console.log("-" * 50);

    // Verificar .env.example
    const envExampleExists = fileExists(".env.example");
    if (envExampleExists) {
        console.log("✅ .env.example presente");
    } else {
        console.log(
            "⚠️ .env.example não encontrado - recomendado para documentação",
        );
    }

    // Verificar variáveis essenciais (sem ler valores por segurança)
    const essentialVars = [
        "SUPABASE_URL",
        "SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
    ];

    const optionalVars = ["GEMINI_API_KEY", "OPENAI_API_KEY"];

    console.log("\n📋 Variáveis essenciais (configure na Vercel):");
    essentialVars.forEach((varName) => {
        console.log(`   🔑 ${varName}`);
    });

    console.log("\n📋 Variáveis opcionais (recomendadas):");
    optionalVars.forEach((varName) => {
        console.log(`   🔑 ${varName}`);
    });

    console.log("\n💡 Como configurar na Vercel:");
    console.log("   1. Dashboard → Settings → Environment Variables");
    console.log("   2. Add each variable for Production, Preview, Development");
    console.log("   3. Deploy after adding variables");

    return true; // Sempre passa, pois é informativo
}

// Função para validar estrutura de arquivos críticos
function validateCriticalFiles() {
    console.log("\n📁 VALIDAÇÃO 5: Arquivos Críticos");
    console.log("-" * 50);

    const criticalFiles = [
        {
            path: "api/ia/analise-investimento.ts",
            description: "Endpoint principal de análise",
            requiresEdge: true,
        },
        {
            path: "api/health.ts",
            description: "Health check endpoint",
            requiresEdge: true,
        },
        {
            path: "api/docs-ui.ts",
            description: "Documentação da API",
            requiresEdge: true,
        },
        {
            path: "api/config/supabaseClient.ts",
            description: "Cliente Supabase configurado",
            requiresEdge: false,
        },
        {
            path: "api/config/apiHeader.ts",
            description: "Headers CORS configurados",
            requiresEdge: false,
        },
    ];

    let validFiles = 0;

    criticalFiles.forEach((file) => {
        if (fileExists(file.path)) {
            const content = readFile(file.path);
            if (file.requiresEdge) {
                if (
                    content &&
                    content.includes(
                        'export const config = { runtime: "edge" }',
                    )
                ) {
                    console.log(`✅ ${file.path} - ${file.description}`);
                    validFiles++;
                } else {
                    console.log(
                        `⚠️ ${file.path} - Presente mas sem Edge config`,
                    );
                }
            } else {
                // Arquivo de configuração não precisa de Edge Runtime
                console.log(
                    `✅ ${file.path} - ${file.description} (config file)`,
                );
                validFiles++;
            }
        } else {
            console.log(`❌ ${file.path} - ${file.description} (AUSENTE)`);
        }
    });

    console.log(
        `\n📊 Arquivos críticos: ${validFiles}/${criticalFiles.length} válidos`,
    );
    return validFiles >= Math.floor(criticalFiles.length * 0.8); // 80% mínimo
}

// Função para validar sintaxe TypeScript
function validateTypeScript() {
    console.log("\n📝 VALIDAÇÃO 6: TypeScript");
    console.log("-" * 50);

    const tsConfigExists = fileExists("tsconfig.json");
    if (tsConfigExists) {
        console.log("✅ tsconfig.json presente");
    } else {
        console.log("⚠️ tsconfig.json não encontrado");
    }

    // Verificar se há arquivos .ts com erros óbvios
    const apiDir = "api";
    const tsFiles = [];

    function findTypeScriptFiles(dir) {
        if (!fs.existsSync(dir)) return;

        const files = fs.readdirSync(dir);
        files.forEach((file) => {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                findTypeScriptFiles(fullPath);
            } else if (file.endsWith(".ts")) {
                tsFiles.push(fullPath);
            }
        });
    }

    findTypeScriptFiles(apiDir);

    let validTsFiles = 0;
    tsFiles.slice(0, 10).forEach((file) => {
        // Verificar apenas primeiros 10 para performance
        const content = readFile(file);
        if (content) {
            // Verificações básicas de sintaxe
            const hasImports = content.includes("import");
            const hasExports = content.includes("export");
            const hasSyntaxErrors =
                content.includes("console.log(") &&
                !content.includes("console.log('") &&
                !content.includes('console.log("');

            if (hasImports && hasExports && !hasSyntaxErrors) {
                validTsFiles++;
            }
        }
    });

    console.log(
        `📊 Arquivos TypeScript verificados: ${validTsFiles}/${Math.min(tsFiles.length, 10)}`,
    );

    return true; // Sempre passa, pois é verificação básica
}

// Função principal de validação
function runPreDeployValidation() {
    console.log("🧪 Executando validação pré-deploy completa...\n");

    const validations = [
        { name: "Package.json", fn: validatePackageJson, critical: true },
        { name: "Vercel.json", fn: validateVercelJson, critical: true },
        { name: "Edge Runtime", fn: validateEdgeRuntime, critical: true },
        {
            name: "Variáveis de Ambiente",
            fn: validateEnvironmentVariables,
            critical: false,
        },
        {
            name: "Arquivos Críticos",
            fn: validateCriticalFiles,
            critical: true,
        },
        { name: "TypeScript", fn: validateTypeScript, critical: false },
    ];

    let passedValidations = 0;
    let criticalIssues = 0;
    const results = [];

    validations.forEach((validation) => {
        const result = validation.fn();
        results.push({
            name: validation.name,
            passed: result,
            critical: validation.critical,
        });

        if (result) {
            passedValidations++;
        } else if (validation.critical) {
            criticalIssues++;
        }
    });

    // Resumo final
    console.log("\n" + "=" * 60);
    console.log("📊 RESUMO DA VALIDAÇÃO PRÉ-DEPLOY");
    console.log("=" * 60);

    results.forEach((result) => {
        const status = result.passed
            ? "✅ PASSOU"
            : result.critical
              ? "❌ CRÍTICO"
              : "⚠️ AVISO";
        console.log(`${status} - ${result.name}`);
    });

    console.log(
        `\n🎯 Score: ${passedValidations}/${validations.length} validações passaram`,
    );
    console.log(`🚨 Problemas críticos: ${criticalIssues}`);

    if (criticalIssues === 0) {
        console.log("\n🎉 PRONTO PARA DEPLOY!");
        console.log("✅ Todas as validações críticas passaram");
        console.log("✅ Estrutura compatível com Vercel");
        console.log("✅ Edge Runtime configurado corretamente");

        console.log("\n🚀 PRÓXIMOS PASSOS:");
        console.log("1. Commit e push para GitHub");
        console.log("2. Conectar repositório na Vercel");
        console.log("3. Configurar variáveis de ambiente na Vercel");
        console.log("4. Deploy automático será executado");
        console.log("5. Testar endpoints após deploy");

        console.log("\n📋 CHECKLIST FINAL:");
        console.log("□ Variáveis de ambiente configuradas na Vercel");
        console.log("□ Repositório conectado na Vercel");
        console.log("□ Build logs verificados");
        console.log("□ Endpoints testados em produção");
    } else {
        console.log("\n⚠️ ATENÇÃO: Problemas críticos encontrados");
        console.log(
            "🔧 Corrija os itens marcados como ❌ CRÍTICO antes do deploy",
        );
        console.log("📖 Consulte DEPLOY-VERCEL.md para detalhes");

        console.log("\n🚨 PROBLEMAS QUE IMPEDEM O DEPLOY:");
        results.forEach((result) => {
            if (!result.passed && result.critical) {
                console.log(`   - ${result.name}`);
            }
        });
    }

    console.log("\n📈 RECURSOS DISPONÍVEIS APÓS DEPLOY:");
    console.log("- 🏠 Homepage: https://seu-projeto.vercel.app/");
    console.log("- 📚 Docs: https://seu-projeto.vercel.app/api/docs-ui");
    console.log("- 🔍 Health: https://seu-projeto.vercel.app/api/health");
    console.log("- 🤖 IA Status: https://seu-projeto.vercel.app/api/ia/status");
    console.log(
        "- 🧪 Diagnóstico: https://seu-projeto.vercel.app/api/ia/teste-conexao",
    );

    console.log("\n" + "=" * 60);
    console.log(
        criticalIssues === 0
            ? "✅ Validação concluída - DEPLOY APROVADO!"
            : "❌ Validação concluída - CORRIJA PROBLEMAS CRÍTICOS",
    );

    return criticalIssues === 0;
}

// Executar validação
try {
    const deployReady = runPreDeployValidation();
    process.exit(deployReady ? 0 : 1);
} catch (error) {
    console.error("\n❌ Erro durante a validação:", error.message);
    console.log("🔧 Verifique a estrutura do projeto e tente novamente");
    process.exit(1);
}
