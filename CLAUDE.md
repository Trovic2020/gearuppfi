# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

GearUp: a vehicle management web app (maintenance, fuel, tires, insurance, documents, workshops, expenses, alerts, dashboard, health score, PDF reports). All code, identifiers, comments, API messages and UI text are in **Brazilian Portuguese**. Keep new code in Portuguese too (e.g. `listar`, `cadastrar`, `editar`, `excluir`; error responses as `{ erro: '...' }`).

## Commands

Backend (`backend/`, Node + Express 5, CommonJS):

```bash
cd backend
npm install
npm run dev     # nodemon server.js — API on http://localhost:3000
npm start       # node server.js
```

There are no tests, linter or build step. `GET /api/health` is a quick liveness check.

Backend requires `backend/.env` (not versioned): `PORT`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (`gearup`), `JWT_SECRET`, optional `FRONTEND_URL` (CORS origin, defaults to `*`).

The MySQL schema is **not in the repo**. The database `gearup` has 10 tables: `usuarios`, `veiculos`, `manutencoes`, `abastecimentos`, `pneus`, `seguros`, `documentos`, `oficinas`, `gastos`, `alertas`. Infer columns from the SQL in the controllers.

Frontend (`frontend/`): plain HTML/CSS/JS, no npm, no bundler. Serve the folder statically (README uses VS Code Live Server). `frontend/js/api.js` hardcodes `API_URL = 'http://localhost:3000/api'`.

## Backend architecture

- `server.js` mounts only `/api/auth`, `/api/veiculos`, `/api/oficinas`, and serves `uploads/` at `/uploads`.
- `routes/vehicleRoutes.js` nests every per-vehicle module under `/api/veiculos/:veiculoId/<modulo>` (manutencoes, abastecimentos, pneus, seguros, documentos, gastos, alertas, dashboard, saude, relatorios). Sub-routers must use `express.Router({ mergeParams: true })` to read `veiculoId`. Note: this file currently contains many duplicated `router.use(...)` mounts — leftover cruft; one mount per module is enough.
- `middlewares/authMiddleware.js` verifies `Authorization: Bearer <JWT>` and sets `req.usuarioId`.
- One controller per entity using the shared `mysql2/promise` pool from `config/database.js` with raw parameterized SQL (`pool.query(sql, [params])`). Each controller redefines a local `veiculoPertenceAoUsuario(veiculoId, usuarioId)` ownership check and returns 404 when the vehicle doesn't belong to the user — every per-vehicle handler must do this.
- Uploads via Multer: `config/upload.js` (documents: PDF/JPG/PNG → `uploads/documentos`), `config/uploadFoto.js` (vehicle photo → `uploads/veiculos`).
- PDF reports are generated with PDFKit in `reportController.js`.

Cross-module side effects to keep consistent:
- **`gastos` is a consolidated ledger.** Creating fuel, maintenance and insurance records also inserts a `gastos` row with `origem_tipo`/`origem_id` pointing back to the source. Edits/deletes of the source must update/remove the linked expense. `expenseController` only allows editing/deleting rows with `origem_tipo = 'manual'`.
- **Alerts are generated lazily.** `alertController.gerarAlertasDoVeiculo` scans tires, insurance and documents and inserts `alertas` rows; it runs when alerts are listed and when the dashboard is loaded, not on writes.
- Fuel consumption (km/l) is computed on read in `fuelController.listar` from consecutive odometer readings, not stored.

## Frontend architecture

- Each screen is `<tela>.html` + `js/<tela>.js`. Pages load scripts in order: `js/api.js`, `js/utils.js`, `js/menu-lateral.js`, then the page script (globals, no modules).
- `js/api.js` is the only place that calls `fetch`: `apiRequest(endpoint, metodo, dados, comArquivo)` plus per-module objects (`AuthAPI`, etc.). It attaches the token, handles FormData uploads, returns blobs for non-JSON responses (PDFs), and logs out/redirects to `login.html` on 401.
- State lives in `localStorage`: `gearup_token`, `gearup_usuario`, `gearup_veiculo_selecionado`. Per-vehicle pages call `exigirLogin()` and `veiculoSelecionado()` (from `utils.js`) at the top; `veiculos.html` is the post-login hub where the user picks a vehicle.
- Every page loads `css/base.css` (color/font tokens, reset, background grid, logo, CTA button, `.mensagem*`, `.oculto`) and then one page stylesheet: `css/home.css` for `index.html` (public landing page), `css/auth-tech.css` for `login.html`/`cadastro.html`/`esqueci-senha.html`, and `css/app-tech.css` for the app screens. Page stylesheets only hold their own rules and small overrides of base; put new shared tokens or components in `base.css`.
- Visual style: clean light UI, polished but not "startup". Light gray background, white cards with soft shadow, 8–12px radius, one blue accent (`--azul`), system font stack (no web fonts), no gradients, glows or decorative animations. Keep new UI in that style and use the tokens in `base.css`. Dashboard charts are pure CSS, no chart libraries; category/health colors are hardcoded in `js/dashboard.js`, `js/financeiro.js` and `js/saude.js`.
- Some HTML still contains decorative markup from an older "startup" design (hero gauge, tickers, `.etiqueta-tecnica` labels); the CSS hides it with `display: none`.
- Password recovery is dev-mode only: the reset token is shown on screen instead of emailed.
