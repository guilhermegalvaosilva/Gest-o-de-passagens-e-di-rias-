import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  pbkdf2Sync,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3002);
const ROOT_DIR = __dirname;
const DIST_DIR = path.join(ROOT_DIR, "dist");
const PUBLIC_DIR = path.join(ROOT_DIR, "public");
const DATA_DIR = path.join(ROOT_DIR, "data");
const DB_PATH = path.join(DATA_DIR, "db.json");
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
const DEFAULT_ADMIN_PASSWORD = "123456";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": process.env.CORS_ORIGIN || "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  };
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    ...corsHeaders(),
    "Content-Type": "application/json; charset=utf-8",
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, status, text) {
  res.writeHead(status, {
    ...corsHeaders(),
    "Content-Type": "text/plain; charset=utf-8",
  });
  res.end(text);
}

function normalizeLogin(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const hash = pbkdf2Sync(String(password), salt, 120000, 32, "sha256").toString(
    "hex",
  );
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = String(storedHash || "").split(":");
  if (!salt || !hash) return false;

  const candidate = hashPassword(password, salt).split(":")[1];
  const hashBuffer = Buffer.from(hash, "hex");
  const candidateBuffer = Buffer.from(candidate, "hex");
  return (
    hashBuffer.length === candidateBuffer.length &&
    timingSafeEqual(hashBuffer, candidateBuffer)
  );
}

function createAdminRecord(
  login,
  password,
  createdAt = new Date().toLocaleString("pt-BR"),
) {
  return {
    id: randomUUID(),
    login: normalizeLogin(login),
    passwordHash: hashPassword(password),
    createdAt,
  };
}

function defaultDb() {
  return {
    solicitacoes: [],
    alteracoes: [],
    admins: [createAdminRecord("admin", DEFAULT_ADMIN_PASSWORD, "padrao")],
    sessions: [],
  };
}

async function ensureDb() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, JSON.stringify(defaultDb(), null, 2));
  }
}

async function readDb() {
  await ensureDb();
  const raw = await fs.readFile(DB_PATH, "utf8");
  const db = JSON.parse(raw || "{}");
  db.solicitacoes = Array.isArray(db.solicitacoes) ? db.solicitacoes : [];
  db.alteracoes = Array.isArray(db.alteracoes) ? db.alteracoes : [];
  db.admins =
    Array.isArray(db.admins) && db.admins.length
      ? db.admins
      : [createAdminRecord("admin", DEFAULT_ADMIN_PASSWORD, "padrao")];
  db.sessions = Array.isArray(db.sessions) ? db.sessions : [];

  let changed = false;
  db.admins = db.admins.map((admin) => {
    if (admin.passwordHash) return admin;
    changed = true;
    return createAdminRecord(
      admin.login,
      admin.password || DEFAULT_ADMIN_PASSWORD,
      admin.createdAt || new Date().toLocaleString("pt-BR"),
    );
  });
  db.sessions = db.sessions.filter((session) => {
    const valid = Number(session.expiresAt || 0) > Date.now();
    if (!valid) changed = true;
    return valid;
  });
  if (changed) await writeDb(db);
  return db;
}

async function writeDb(db) {
  await ensureDb();
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
}

function publicAdmin(admin) {
  return {
    id: admin.id,
    login: admin.login,
    createdAt: admin.createdAt,
  };
}

function createSession(login) {
  return {
    token: `${randomUUID()}${randomUUID()}`.replace(/-/g, ""),
    login,
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_DURATION_MS,
  };
}

function bearerToken(req) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");
  return type === "Bearer" ? token : "";
}

async function requireAuth(req, res) {
  const token = bearerToken(req);
  const db = await readDb();
  const session = db.sessions.find(
    (item) => item.token === token && Number(item.expiresAt || 0) > Date.now(),
  );
  if (!session) {
    sendJson(res, 401, { error: "Sessao expirada. Faca login novamente." });
    return null;
  }

  const user = db.admins.find(
    (admin) => normalizeLogin(admin.login) === normalizeLogin(session.login),
  );
  if (!user) {
    sendJson(res, 401, { error: "Usuario administrativo nao encontrado." });
    return null;
  }
  return { db, user, session };
}

function collectionNameFromUrl(pathname) {
  if (pathname.startsWith("/api/solicitacoes")) return "solicitacoes";
  if (pathname.startsWith("/api/alteracoes")) return "alteracoes";
  return null;
}

function sortRows(rows, query) {
  const sortField = query.get("sort") || "createdAt";
  const direction = query.get("order") === "asc" ? 1 : -1;
  return [...rows].sort(
    (a, b) =>
      String(a[sortField] || "").localeCompare(String(b[sortField] || "")) *
      direction,
  );
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function requestIdFromPath(pathname, prefix) {
  const id = pathname.slice(prefix.length).replace(/^\/+/, "");
  return id ? decodeURIComponent(id) : "";
}

async function handleApi(req, res, url) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders());
    res.end();
    return;
  }

  if (url.pathname === "/api/health") {
    sendJson(res, 200, { ok: true, mode: "backend-api" });
    return;
  }

  if (url.pathname === "/api/auth/login" && req.method === "POST") {
    const body = await readBody(req);
    const db = await readDb();
    const user = db.admins.find(
      (item) =>
        normalizeLogin(item.login) === normalizeLogin(body.login) &&
        verifyPassword(body.password, item.passwordHash),
    );
    if (!user) {
      sendJson(res, 401, { error: "Login ou senha invalidos." });
      return;
    }

    const session = createSession(user.login);
    db.sessions.push(session);
    await writeDb(db);
    sendJson(res, 200, {
      token: session.token,
      expiresAt: session.expiresAt,
      user: publicAdmin(user),
    });
    return;
  }

  if (url.pathname === "/api/auth/me" && req.method === "GET") {
    const authContext = await requireAuth(req, res);
    if (!authContext) return;
    sendJson(res, 200, {
      user: publicAdmin(authContext.user),
      expiresAt: authContext.session.expiresAt,
    });
    return;
  }

  if (url.pathname === "/api/auth/logout" && req.method === "POST") {
    const token = bearerToken(req);
    const db = await readDb();
    db.sessions = db.sessions.filter((session) => session.token !== token);
    await writeDb(db);
    sendJson(res, 200, { ok: true });
    return;
  }

  if (url.pathname === "/api/admins" && req.method === "GET") {
    const authContext = await requireAuth(req, res);
    if (!authContext) return;
    sendJson(res, 200, { data: authContext.db.admins.map(publicAdmin) });
    return;
  }

  if (url.pathname === "/api/admins" && req.method === "POST") {
    const authContext = await requireAuth(req, res);
    if (!authContext) return;

    const body = await readBody(req);
    const login = normalizeLogin(body.login);
    const password = String(body.password || "").trim();
    if (!login) {
      sendJson(res, 400, { error: "Informe um login." });
      return;
    }
    if (password.length < 6) {
      sendJson(res, 400, { error: "A senha precisa ter pelo menos 6 caracteres." });
      return;
    }
    if (authContext.db.admins.some((admin) => normalizeLogin(admin.login) === login)) {
      sendJson(res, 409, { error: "Este login ja esta cadastrado." });
      return;
    }

    const user = createAdminRecord(login, password);
    authContext.db.admins.push(user);
    await writeDb(authContext.db);
    sendJson(res, 201, { user: publicAdmin(user) });
    return;
  }

  const collection = collectionNameFromUrl(url.pathname);
  if (!collection) {
    sendJson(res, 404, { error: "Rota nao encontrada." });
    return;
  }

  const prefix = `/api/${collection}`;
  const id = requestIdFromPath(url.pathname, prefix);

  if (req.method === "GET" && !id) {
    const authContext = await requireAuth(req, res);
    if (!authContext) return;
    sendJson(res, 200, { data: sortRows(authContext.db[collection], url.searchParams) });
    return;
  }

  const db = await readDb();

  if (req.method === "GET" && id) {
    const item = db[collection].find(
      (row) => String(row.id).toUpperCase() === id.toUpperCase(),
    );
    if (!item) {
      sendJson(res, 404, { error: "Registro nao encontrado." });
      return;
    }
    sendJson(res, 200, { data: item });
    return;
  }

  if ((req.method === "POST" && !id) || (req.method === "PUT" && id)) {
    const body = await readBody(req);
    const rowId = id || body.id || randomUUID();
    const row = { ...body, id: rowId };
    const index = db[collection].findIndex((item) => String(item.id) === String(rowId));
    if (index >= 0) db[collection][index] = row;
    else db[collection].push(row);
    await writeDb(db);
    sendJson(res, index >= 0 ? 200 : 201, { data: row });
    return;
  }

  if (req.method === "DELETE" && id) {
    const authContext = await requireAuth(req, res);
    if (!authContext) return;
    const before = authContext.db[collection].length;
    authContext.db[collection] = authContext.db[collection].filter(
      (item) => String(item.id) !== String(id),
    );
    await writeDb(authContext.db);
    sendJson(res, 200, { deleted: before !== authContext.db[collection].length });
    return;
  }

  sendJson(res, 405, { error: "Metodo nao permitido." });
}

function resolveInside(baseDir, requestedPath) {
  const base = path.resolve(baseDir);
  const relative = requestedPath.replace(/^\/+/, "");
  const target = path.resolve(base, relative);
  return target === base || target.startsWith(`${base}${path.sep}`) ? target : null;
}

async function tryServeFile(res, filePath) {
  try {
    const content = await fs.readFile(filePath);
    res.writeHead(200, {
      ...corsHeaders(),
      "Content-Type":
        mimeTypes[path.extname(filePath).toLowerCase()] ||
        "application/octet-stream",
    });
    res.end(content);
    return true;
  } catch {
    return false;
  }
}

async function serveStatic(req, res, url) {
  const requestedPath =
    url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);

  const candidateRoots = [DIST_DIR, PUBLIC_DIR];
  for (const root of candidateRoots) {
    const filePath = resolveInside(root, requestedPath);
    if (filePath && (await tryServeFile(res, filePath))) return;
  }

  if (!path.extname(requestedPath)) {
    const indexPath = resolveInside(DIST_DIR, "/index.html");
    if (indexPath && (await tryServeFile(res, indexPath))) return;
  }

  sendText(
    res,
    404,
    "Arquivo nao encontrado. Rode `npm run build` para gerar o frontend em dist/.",
  );
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith("/api/")) await handleApi(req, res, url);
    else await serveStatic(req, res, url);
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Erro interno." });
  }
});

server.listen(PORT, () => {
  console.log(`Servidor NUGB rodando em http://localhost:${PORT}`);
});
