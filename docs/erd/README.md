# Diagrama Entidade–Relacionamento (DER)

Os DERs deste diretório são **gerados automaticamente** a partir de
[`prisma/schema.prisma`](../../prisma/schema.prisma) usando
[`prisma-erd-generator`](https://github.com/keonik/prisma-erd-generator).
Não edite os SVGs à mão — eles são recriados a cada geração.

## Arquivos

| Arquivo | Visão | Conteúdo |
| --- | --- | --- |
| [`erd-macro.svg`](./erd-macro.svg) | Simplificada | Apenas tabelas e relacionamentos (`tableOnly`). Boa para a visão geral do modelo. |
| [`erd-completo.svg`](./erd-completo.svg) | Completa | Todas as tabelas com todos os atributos. Boa para consulta detalhada / anexos. |

Ambas as visões ignoram os `enum`s (`ignoreEnums = true`) para reduzir ruído.

## Como gerar

Os diagramas são produzidos junto com o Prisma Client, em **todo**
`prisma generate`:

```bash
yarn prisma generate
# ou o atalho:
yarn erd
```

Os generators responsáveis estão declarados em `prisma/schema.prisma`
(`generator erdMacro` e `generator erdFull`), logo abaixo do
`generator client`.

### Dependências

Instaladas como `devDependencies` (via `yarn`):

- `prisma-erd-generator`
- `@mermaid-js/mermaid-cli`
- `puppeteer` — **necessário explicitamente**: nesta versão o
  `@mermaid-js/mermaid-cli@11` declara `puppeteer` como *peerDependency*
  (não o instala sozinho). O Puppeteer é quem renderiza o SVG a partir do
  Mermaid.

## Como DESABILITAR a geração no dia a dia

Por padrão os diagramas são regerados a **cada** `prisma generate` (inclusive
após migrations com `prisma migrate dev`), o que torna o ciclo de
desenvolvimento mais lento sem necessidade. Para pular a geração dos DERs:

- **Pontualmente (recomendado)** — defina a variável de ambiente
  `DISABLE_ERD` antes do comando. Os generators são ignorados; o Prisma Client
  continua sendo gerado normalmente.

  ```powershell
  # Windows PowerShell
  $env:DISABLE_ERD = "true"; yarn prisma generate
  ```

  ```bash
  # Linux / macOS / Git Bash
  DISABLE_ERD=true yarn prisma generate
  ```

- **Permanentemente** — adicione `disabled = true` dentro de cada bloco
  `generator erdMacro` / `generator erdFull` no `schema.prisma`, ou defina
  `DISABLE_ERD=true` no seu `.env`. Reative removendo a linha / variável
  quando quiser atualizar os diagramas.

> Dica: no dia a dia, mantenha `DISABLE_ERD=true` no `.env` local e rode
> `DISABLE_ERD= yarn erd` (variável vazia) apenas quando quiser atualizar os
> SVGs para commit.

## Solução de problemas (Puppeteer)

A geração para SVG depende do Puppeteer, que baixa uma versão do Chromium.
Nesta máquina (Node 24 / Windows 11) a geração para **SVG funcionou
diretamente**, sem ajustes. Caso em outro ambiente o Puppeteer falhe (causa
mais comum de erro deste pacote), há dois caminhos:

1. **Sem Puppeteer (mais confiável)** — troque temporariamente a extensão de
   saída para `.md` no `schema.prisma`
   (`output = "../docs/erd/erd-macro.md"`). Esse caminho gera o código
   **Mermaid** e não usa Puppeteer; o `.md` pode ser renderizado no GitHub ou
   em qualquer visualizador Mermaid.

2. **Insistir no SVG** — crie um `puppeteerConfig.json`:

   ```json
   { "args": ["--no-sandbox", "--disable-setuid-sandbox"] }
   ```

   e aponte cada generator para ele:

   ```prisma
   generator erdFull {
     provider        = "prisma-erd-generator"
     output          = "../docs/erd/erd-completo.svg"
     ignoreEnums     = true
     puppeteerConfig = "./puppeteerConfig.json"
   }
   ```
