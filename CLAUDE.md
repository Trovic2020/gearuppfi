# CLAUDE.md

Este arquivo orienta o Claude Code (claude.ai/code) ao trabalhar com o código deste repositório.

## Projeto

GearUp: aplicação web de gestão de veículos (manutenções, abastecimentos, pneus, seguros, documentos, oficinas, gastos, alertas, dashboard, saúde do veículo, relatórios em PDF). Todo o código, identificadores, comentários, mensagens da API e textos da interface estão em **português do Brasil**. Mantenha o código novo em português também (ex.: `listar`, `cadastrar`, `editar`, `excluir`; respostas de erro no formato `{ erro: '...' }`).

## Comandos

Backend (`backend/`, Node + Express 5, CommonJS):

```bash
cd backend
npm install
npm run dev     # nodemon server.js — API em http://localhost:3000
npm start       # node server.js
```

Não há testes, linter nem etapa de build. `GET /api/health` serve como verificação rápida de que a API está no ar.

O backend precisa de um `backend/.env` (não versionado): `PORT`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (`gearup`), `JWT_SECRET` e, opcionalmente, `FRONTEND_URL` (origem do CORS; o padrão é `*`).

O schema do MySQL **não está no repositório**. O banco `gearup` tem 10 tabelas: `usuarios`, `veiculos`, `manutencoes`, `abastecimentos`, `pneus`, `seguros`, `documentos`, `oficinas`, `gastos`, `alertas`. Deduza as colunas a partir do SQL dos controllers.

Frontend (`frontend/`): HTML/CSS/JS puro, sem npm e sem bundler. Sirva a pasta como arquivos estáticos (o README usa o Live Server do VS Code). `frontend/js/api.js` tem fixo `API_URL = 'http://localhost:3000/api'`.

## Arquitetura do backend

- `server.js` monta apenas `/api/auth`, `/api/veiculos` e `/api/oficinas`, e serve `uploads/` em `/uploads`.
- `routes/vehicleRoutes.js` encaixa cada módulo por veículo em `/api/veiculos/:veiculoId/<modulo>` (manutencoes, abastecimentos, pneus, seguros, documentos, gastos, alertas, dashboard, saude, relatorios). Os sub-routers precisam usar `express.Router({ mergeParams: true })` para ler o `veiculoId`.
- `middlewares/authMiddleware.js` valida `Authorization: Bearer <JWT>` e define `req.usuarioId`.
- Um controller por entidade, usando o pool compartilhado do `mysql2/promise` em `config/database.js` com SQL parametrizado escrito à mão (`pool.query(sql, [params])`). Cada controller redefine localmente a verificação de posse `veiculoPertenceAoUsuario(veiculoId, usuarioId)` e responde 404 quando o veículo não pertence ao usuário — todo handler por veículo precisa fazer essa verificação.
- Uploads via Multer: `config/upload.js` (documentos: PDF/JPG/PNG → `uploads/documentos`) e `config/uploadFoto.js` (foto do veículo → `uploads/veiculos`).
- Os relatórios em PDF são gerados com PDFKit em `reportController.js`.

Efeitos colaterais entre módulos que precisam ficar consistentes:
- **`gastos` é um livro-caixa consolidado.** Cadastrar abastecimento, manutenção ou seguro também insere uma linha em `gastos` com `origem_tipo`/`origem_id` apontando para o registro de origem. Edições e exclusões da origem precisam atualizar/remover o gasto vinculado. O `expenseController` só permite editar/excluir linhas com `origem_tipo = 'manual'`.
- **Os alertas são gerados sob demanda.** `alertController.gerarAlertasDoVeiculo` verifica pneus, seguros e documentos e insere linhas em `alertas`; ela roda quando os alertas são listados e quando o dashboard é carregado, não nas gravações.
- O consumo de combustível (km/l) é calculado na leitura, em `fuelController.listar`, a partir de leituras consecutivas do hodômetro; não fica salvo.

## Arquitetura do frontend

- Cada tela é `<tela>.html` + `js/<tela>.js`. As páginas carregam os scripts nesta ordem: `js/api.js`, `js/utils.js`, `js/menu-lateral.js` e depois o script da página (globais, sem módulos).
- `js/api.js` é o único lugar que chama `fetch`: `apiRequest(endpoint, metodo, dados, comArquivo)` mais objetos por módulo (`AuthAPI` etc.). Ele envia o token, trata uploads com FormData, devolve blobs para respostas que não são JSON (PDFs) e, em caso de 401, desloga e redireciona para `login.html`.
- O estado fica no `localStorage`: `gearup_token`, `gearup_usuario`, `gearup_veiculo_selecionado`. As páginas por veículo chamam `exigirLogin()` e `veiculoSelecionado()` (de `utils.js`) no topo; `veiculos.html` é a tela central depois do login, onde o usuário escolhe um veículo.
- Toda página carrega `css/base.css` (tokens de cor/fonte, reset, grade de fundo, logo, botão CTA, `.mensagem*`, `.oculto`) e depois uma folha de estilo própria: `css/home.css` para `index.html` (página pública inicial), `css/auth-tech.css` para `login.html`/`cadastro.html`/`esqueci-senha.html` e `css/app-tech.css` para as telas do app. As folhas de página só têm as próprias regras e pequenos ajustes sobre a base; tokens e componentes novos compartilhados vão em `base.css`.
- Estilo visual: interface clara e limpa, caprichada mas sem cara de "startup". Fundo cinza claro, cards brancos com sombra suave, raio de 8–12px, uma única cor de destaque azul (`--azul`), fontes do sistema (sem web fonts), sem gradientes, brilhos ou animações decorativas. Mantenha a interface nova nesse estilo e use os tokens de `base.css`. Os gráficos do dashboard são CSS puro, sem bibliotecas de gráficos; as cores de categoria/saúde estão fixas em `js/dashboard.js`, `js/financeiro.js` e `js/saude.js`.
- Parte do HTML ainda tem marcação decorativa de um design antigo "startup" (medidor no hero, tickers, rótulos `.etiqueta-tecnica`); o CSS esconde isso com `display: none`.
- A recuperação de senha funciona só em modo de desenvolvimento: o token de redefinição aparece na tela em vez de ser enviado por e-mail.
