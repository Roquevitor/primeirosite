require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === "production";

/* ---------------- ENV ---------------- */
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const COOKIE_NAME = process.env.COOKIE_NAME || "auth_token";
const ADMIN_HASH = process.env.ADMIN_PASSWORD_HASH; // hash bcrypt

/* ---------------- POSTGRES ---------------- */
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL não configurada!");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/* ---------------- MIDDLEWARES ---------------- */
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));
app.use(cookieParser());
app.use(morgan(isProduction ? "combined" : "dev"));

// Helmet + CSP
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: [
        "'self'",
        "https://imperiumparfumm-api.onrender.com",
        "https://imperiumparfumm.onrender.com",
      ],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["*", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["*"],
      imgSrc: ["*", "data:"],
    },
  })
);

// CORS
const allowedOrigins = [
  "http://localhost",
  "http://localhost:3000",
  "https://imperiumparfumm.onrender.com",
  "https://imperiumparfumm-api.onrender.com",
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("CORS não permitido: " + origin));
    },
    credentials: true,
  })
);

/* ---------------- RATE LIMIT ---------------- */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 6,
  message: { error: "Muitas tentativas. Tente novamente mais tarde." },
});

/* ---------------- FUNÇÕES JWT ---------------- */
function gerarAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });
}

function gerarRefreshToken(payload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" });
}

function proteger(req, res, next) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ erro: "Não autenticado." });

  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(403).json({ erro: "Token inválido." });
  }
}

/* ---------------- INIT DB ---------------- */
async function initDb() {
  const create = `
    CREATE TABLE IF NOT EXISTS perfumes (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      descricao TEXT,
      preco NUMERIC(10,2) DEFAULT 0,
      imagem_base64 TEXT,
      categoria TEXT
    )
  `;
  await pool.query(create);
  console.log("Tabela 'perfumes' pronta.");
}

/* ---------------- ARQUIVOS ESTÁTICOS ---------------- */
app.use(express.static(path.join(__dirname, "public")));

/* ---------------- AUTENTICAÇÃO ---------------- */
app.post("/login", loginLimiter, async (req, res) => {
  const { senha } = req.body;
  if (!senha) return res.status(400).json({ erro: "Senha requerida." });

  if (!ADMIN_HASH)
    return res.status(500).json({ erro: "Admin hash não configurado." });

  const valido = await bcrypt.compare(senha, ADMIN_HASH);
  if (!valido) return res.status(401).json({ erro: "Senha incorreta." });

  const accessToken = gerarAccessToken({ adm: true });
  const refreshToken = gerarRefreshToken({ adm: true });

  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 8 * 60 * 60 * 1000,
  };

  res.cookie(COOKIE_NAME, accessToken, cookieOptions);
  res.cookie(COOKIE_NAME + "_refresh", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ ok: true });
});

app.post("/logout", (req, res) => {
  res.clearCookie(COOKIE_NAME, {
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  });
  res.clearCookie(COOKIE_NAME + "_refresh", {
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  });
  res.json({ ok: true });
});

app.get("/auth", proteger, (req, res) => {
  res.json({ autenticado: true });
});

/* ---------------- ROTAS HTML ---------------- */
app.get("/painel", proteger, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin", "admin_panel.html"));
});

app.get("/admin/login.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin", "login.html"));
});

/* ---------------- CRUD PERFUMES ---------------- */
app.get("/perfumes", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, nome, categoria, img, descricao, preco FROM perfumes ORDER BY id ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar perfumes" });
  }
});

app.post("/perfumes", async (req, res) => {
  const { nome, categoria, img, descricao, preco } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO perfumes (nome, categoria, img, descricao, preco) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [nome, categoria, img, descricao, preco]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao adicionar perfume" });
  }
});

app.put("/perfumes/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, categoria, img, descricao, preco } = req.body;
  try {
    const result = await pool.query(
      "UPDATE perfumes SET nome=$1, categoria=$2, img=$3, descricao=$4, preco=$5 WHERE id=$6 RETURNING *",
      [nome, categoria, img, descricao, preco, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao editar perfume" });
  }
});

app.delete("/perfumes/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM perfumes WHERE id=$1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao remover perfume" });
  }
});
/* ---------------- START SERVER ---------------- */
(async () => {
  try {
    await initDb();
    app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
  } catch (err) {
    console.error("Erro ao iniciar servidor:", err);
    process.exit(1);
  }
})();
