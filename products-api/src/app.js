import express from "express";
import cors from "cors";
import { pool } from "./db.js";
// import products from "./data.json" assert { type: "json" };
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4002;
const SERVICE = process.env.SERVICE_NAME || "products-api";
const USERS_API_URL = process.env.USERS_API_URL || "http://users-api:4001";

// Ejemplo de comunicación entre servicios (compose crea la red):
// GET /products/with-users  -> concatena productos con conteo de usuarios (mock)
app.get("/products/with-users", async (_req, res) => {
  try {
    const r = await fetch(`${USERS_API_URL}/users`);
    const users = await r.json();
    const p = await pool.query("SELECT id, name, price FROM products_schema.products ORDER BY id ASC");
    res.status(200).json({
      products: p.rows,
      usersCount: Array.isArray(users) ? users.length : 0,
      users: users
    });
  } catch (e) {
    res.status(502).json({ error: "No se pudo consultar users-api", detail: String(e) });
  }
});

// Listado de métodos y rutas
app.get("/", async (_req, res) => {
  // res.json({
  //   metodos: {
  //     GET: [
  //       {url: "/db/health", hace: "Health DB"},
  //       {url: "/products", hace: "Listar (SELECT real)"},
  //       {url: "/products/:id", hace: "Obtener productos por id"},
  //       {url: "/tables", hace: "Listar tablas de base de datos"},
  //       {url: "/health", hace: "Mantén /health si ya lo tenías"}
  //     ],
  //     POST: [
  //       {url: "/products", hace: "Crear producto (name & price son obligatorios)"}
  //     ],
  //     PUT: [
  //       {url: "/products/:id", hace: "Actualizar producto (name & price son obligatorios)"},
  //       {url: "/tables", hace: "Reiniciar tabla"}
  //     ],
  //     DELETE: [
  //       {url: "/products/:id", hace: "Eliminar productos por id"}
  //     ]
  //   }
  // });

  res.json({
    metodos: {
      GET: {
        "/db/health": "Health DB",
        "/products": "Listar (SELECT real)",
        "/products/:id": "Obtener productos por id",
        "/tables": "Listar tablas de base de datos",
        "/health": "Mantén /health si ya lo tenías",
        "/products/with-users": "Listar productos con conteo de usuarios"
      },
      POST: {
        "/products": "Crear producto (name & price son obligatorios)"
      },
      PUT: {
        "/products/:id": "Actualizar producto (name & price son obligatorios)",
        "/tables": "Reiniciar tabla"
      },
      DELETE: {
        "/products/:id": "Eliminar productos por id"
      }
    }
  });

});

// Health DB
app.get("/db/health", async (_req, res) => {
  try {
    const r = await pool.query("SELECT 1 AS ok");
    res.json({ ok: r.rows[0].ok === 1 });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// Listar (SELECT real)
app.get("/products", async (_req, res) => {
  try {
    const r = await pool.query("SELECT id, name, price FROM products_schema.products ORDER BY id ASC");
    res.status(200).json(r.rows);
  } catch (e) {
    res.status(500).json({ error: "query failed", detail: String(e) });
  }
});

// Obtener productos por id
app.get("/products/:id", async (req, res) => {
  try {
    const r = await pool.query(
      "SELECT id, name, price FROM products_schema.products WHERE id=$1",
      [req.params.id]
    );
    // res.json(r);
    if (r.rowCount > 0) {
      res.status(200).json(r.rows);
    } else {
      res.status(404).json({ error: "PRODUCTO NO ENCONTRADO" });
    }
  } catch (e) {
    res.status(500).json({ error: "query failed", detail: String(e) });
  }
});


// Listar tablas de base de datos
app.get("/tables", async (_req, res) => {
  try {
    const r = await pool.query("SELECT * FROM multiapisdb.information_schema.tables");
    res.status(200).json(r.rows);
  } catch (e) {
    res.status(500).json({ error: "query failed", detail: String(e) });
  }
});

// Mantén /health si ya lo tenías
app.get("/health", (_req, res) => res.json({ status: "ok", service: "users-api" }));


// Crear productos 
app.post("/products", async (req, res) => {

  let errores = [];
  if (req.body.length != undefined) {
    for (let x = 0; x < req.body.length; x++) {
      const { name, price } = req.body[x] ?? {};
      if (!name || !price) errores.push({ error: "name & price son obligatorios para " + (x + 1) });
      // if (!name || !price) return res.status(400).json({ error: "name & price required" });
    }

    if (errores.length > 0) return res.status(400).json(errores);
    // let resultado = { "201": [] };
    let resultado = {};
    resultado["201"] = [];
    try {
      for (let x = 0; x < req.body.length; x++) {
        console.log(req.body[x]);
        const { name, price } = req.body[x] ?? {};

        const r = await pool.query(
          "INSERT INTO products_schema.products(name, price) VALUES($1, $2) RETURNING id, name, price",
          [name, price]
        );
        resultado['201'].push(r.rows);
        // res.status(201).json(r.rows);
        // res.json(r);
      }
      res.status(201).json(resultado);
    } catch (e) {
      return res.status(500).json({ error: "error creando usuario", detail: String(e) });
    }
  } else {
    const { name, price } = req.body ?? {};
    if (!name || !price) return res.status(400).json({ error: "name & price required" });

    try {
      const r = await pool.query(
        "INSERT INTO products_schema.products(name, price) VALUES($1, $2) RETURNING id, name, price",
        [name, price]
      );
      res.status(201).json(r.rows);
      // res.json(r);
    } catch (e) {
      res.status(500).json({ error: "error creando usuario", detail: String(e) });
    }
  }

});


// Actualizar producto
app.put("/products/:id", async (req, res) => {
  const { name, price } = req.body ?? {};
  if (!name || !price) return res.status(400).json({ error: "name & price required" });

  try {
    const r = await pool.query(
      "UPDATE products_schema.products SET name=$1, price=$2 WHERE id=$3 RETURNING id, name, price",
      [name, price, req.params.id]
    );
    // res.json(r);
    if (r.rowCount > 0) {
      res.status(200).json(r.rows);
    } else {
      res.status(404).json({ error: "PRODUCTO NO ENCONTRADO" });
    }
  } catch (e) {
    res.status(500).json({ error: "query failed", detail: String(e) });
  }
});

// Reiniciar tabla
app.put("/tables", async (req, res) => {
  try {
    const r = await pool.query("TRUNCATE TABLE products_schema.products RESTART IDENTITY");
    res.status(200).json({ mensaje: "Tabla reiniciada" });
  } catch (e) {
    res.status(500).json({ error: "query failed", detail: String(e) });
  }
});


// Eliminar usuarios por id
app.delete("/products/:id", async (req, res) => {
  try {
    const r = await pool.query(
      "DELETE FROM products_schema.products WHERE id=$1 RETURNING id, name, price",
      [req.params.id]
    );
    // res.json(r);
    if (r.rowCount > 0) {
      res.status(200).json(r.rows);
    } else {
      res.status(404).json({ error: "PRODUCTO NO ENCONTRADO" });
    }
  } catch (e) {
    res.status(500).json({ error: "query failed", detail: String(e) });
  }
});

app.listen(PORT, () => {
  console.log(`✅ ${SERVICE} listening on http://localhost:${PORT}`);
  console.log(`↔️  USERS_API_URL=${USERS_API_URL}`);
});