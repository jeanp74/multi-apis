// import express from "express";
// import cors from "cors";
// import fetch from "node-fetch";
// import mongoose from "mongoose";
// import { connectMongo } from "./db.js";

// const app = express();
// app.use(cors());
// app.use(express.json());

// const PORT = process.env.PORT || 4002;
// const SERVICE = process.env.SERVICE_NAME || "products-api";
// const USERS_API_URL = process.env.USERS_API_URL || "http://users-api:4001";

// // Conectar a Cosmos DB (Mongo API)
// await connectMongo();

// // Definir el esquema y modelo aquí
// const ProductSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true },
//     price: { type: Number, required: true },
//   },
//   { versionKey: false }
// );

// const Product = mongoose.model("Product", ProductSchema, "products");

// // Comunicación entre microservicios
// app.get("/products/with-users", async (_req, res) => {
//   try {
//     const r = await fetch(`${USERS_API_URL}/users`);
//     const users = await r.json();
//     const products = await Product.find().lean();
//     res.json({
//       products,
//       usersCount: Array.isArray(users) ? users.length : 0,
//       users,
//     });
//   } catch (e) {
//     res.status(502).json({ error: "No se pudo consultar users-api", detail: String(e) });
//   }
// });

// // Documentación
// app.get("/", (_req, res) => {
//   res.json({
//     metodos: {
//       GET: {
//         "/db/health": "Health DB",
//         "/products": "Listar productos",
//         "/products/:id": "Obtener producto por ID",
//         "/health": "Estado del servicio",
//         "/products/with-users": "Listar productos + usuarios",
//       },
//       POST: { "/products": "Crear producto" },
//       PUT: { "/products/:id": "Actualizar producto" },
//       DELETE: { "/products/:id": "Eliminar producto" },
//     },
//   });
// });

// // Health DB
// app.get("/db/health", async (_req, res) => {
//   try {
//     await Product.findOne();
//     res.json({ ok: true });
//   } catch (e) {
//     res.status(500).json({ ok: false, error: String(e) });
//   }
// });

// // Listar productos
// app.get("/products", async (_req, res) => {
//   try {
//     const products = await Product.find().lean();
//     res.json(products);
//   } catch (e) {
//     res.status(500).json({ error: "query failed", detail: String(e) });
//   }
// });

// // Obtener producto por ID
// app.get("/products/:id", async (req, res) => {
//   try {
//     const p = await Product.findById(req.params.id).lean();
//     if (!p) return res.status(404).json({ error: "PRODUCTO NO ENCONTRADO" });
//     res.json(p);
//   } catch (e) {
//     res.status(500).json({ error: "query failed", detail: String(e) });
//   }
// });

// // Crear producto(s)
// app.post("/products", async (req, res) => {
//   try {
//     const body = Array.isArray(req.body) ? req.body : [req.body];
//     const invalid = body.filter((x) => !x.name || x.price == null);
//     if (invalid.length > 0)
//       return res.status(400).json({ error: "name & price obligatorios" });

//     const inserted = await Product.insertMany(body);
//     res.status(201).json(inserted);
//   } catch (e) {
//     res.status(500).json({ error: "error creando producto", detail: String(e) });
//   }
// });

// // Actualizar producto
// app.put("/products/:id", async (req, res) => {
//   const { name, price } = req.body ?? {};
//   if (!name || price == null)
//     return res.status(400).json({ error: "name & price required" });

//   try {
//     const updated = await Product.findByIdAndUpdate(
//       req.params.id,
//       { name, price },
//       { new: true }
//     ).lean();
//     if (!updated)
//       return res.status(404).json({ error: "PRODUCTO NO ENCONTRADO" });
//     res.json(updated);
//   } catch (e) {
//     res.status(500).json({ error: "query failed", detail: String(e) });
//   }
// });

// // Eliminar producto
// app.delete("/products/:id", async (req, res) => {
//   try {
//     const deleted = await Product.findByIdAndDelete(req.params.id).lean();
//     if (!deleted)
//       return res.status(404).json({ error: "PRODUCTO NO ENCONTRADO" });
//     res.json({ message: "Producto eliminado", deleted });
//   } catch (e) {
//     res.status(500).json({ error: "query failed", detail: String(e) });
//   }
// });

// // Reiniciar colección (simula /tables)
// app.put("/tables", async (_req, res) => {
//   try {
//     await Product.deleteMany({});
//     res.status(200).json({ mensaje: "Colección reiniciada" });
//   } catch (e) {
//     res.status(500).json({ error: "query failed", detail: String(e) });
//   }
// });

// // Health del servicio
// app.get("/health", (_req, res) =>
//   res.json({ status: "ok", service: SERVICE })
// );

// app.listen(PORT, () => {
//   console.log(`✅ ${SERVICE} escuchando en http://localhost:${PORT}`);
//   console.log(`↔️ USERS_API_URL=${USERS_API_URL}`);
// });


import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { connectMongo } from "./db.js";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4002;
const SERVICE = process.env.SERVICE_NAME || "products-api";
const USERS_API_URL = process.env.USERS_API_URL || "http://users-api:4001";

// 🔹 Conectar a Mongo (Cosmos)
await connectMongo();

// 🔹 Definir schema y modelo (usando base 'shop' y colección 'products')
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true }
}, { collection: "products" });

const Product = mongoose.model("Product", productSchema, "products");

// Documentación
app.get("/", (_req, res) => {
  res.json({
    metodos: {
      GET: {
        "/db/health": "Health DB*",
        "/products": "Listar productos",
        "/products/:id": "Obtener producto por ID",
        "/health": "Estado del servicio",
        "/products/with-users": "Listar productos + usuarios",
      },
      POST: { "/products": "Crear producto" },
      PUT: { "/products/:id": "Actualizar producto" },
      DELETE: { "/products/:id": "Eliminar producto" },
    },
  });
});

// Health Check
app.get("/health", (_req, res) => res.json({ status: "ok", service: SERVICE }));

// 🔹 GET todos los productos
app.get("/products", async (_req, res) => {
  try {
    const productos = await Product.find();
    res.status(200).json(productos);
  } catch (e) {
    res.status(500).json({ error: "Error listando productos", detail: String(e) });
  }
});

// 🔹 GET por ID
app.get("/products/:id", async (req, res) => {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ error: "Producto no encontrado" });
    res.status(200).json(p);
  } catch (e) {
    res.status(400).json({ error: "ID inválido", detail: String(e) });
  }
});

// 🔹 POST (uno o varios)
app.post("/products", async (req, res) => {
  try {
    const data = Array.isArray(req.body) ? req.body : [req.body];
    const created = await Product.insertMany(data);
    res.status(201).json(created);
  } catch (e) {
    res.status(400).json({ error: "Error creando producto(s)", detail: String(e) });
  }
});

// 🔹 PUT actualizar
app.put("/products/:id", async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: "Producto no encontrado" });
    res.status(200).json(updated);
  } catch (e) {
    res.status(400).json({ error: "Error actualizando", detail: String(e) });
  }
});

// 🔹 DELETE eliminar
app.delete("/products/:id", async (req, res) => {
  try {
    const deleted = await Product.deleteOne({ _id: req.params.id });
    if (deleted.deletedCount === 0) return res.status(404).json({ error: "Producto no encontrado" });
    res.status(200).json({ mensaje: "Producto eliminado" });
  } catch (e) {
    res.status(400).json({ error: "Error eliminando", detail: String(e) });
  }
});

// 🔹 Endpoint combinado con users-api
app.get("/products/with-users", async (_req, res) => {
  try {
    const usersResp = await fetch(`${USERS_API_URL}/users`);
    const users = await usersResp.json();
    const products = await Product.find();
    res.json({
      products,
      usersCount: Array.isArray(users) ? users.length : 0
    });
  } catch (e) {
    res.status(502).json({ error: "No se pudo consultar users-api", detail: String(e) });
  }
});

app.listen(PORT, () => {
  console.log(`✅ ${SERVICE} listening on http://localhost:${PORT}`);
});
