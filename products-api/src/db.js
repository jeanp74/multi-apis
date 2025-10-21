// import pg from "pg";
 
// export const pool = new pg.Pool({
//   connectionString: process.env.PRODUCTS_DATABASE_URL,
//   ssl: { rejectUnauthorized: false } // Azure PG exige TLS; para demo deshabilitamos validación de CA
// });

// products-api/src/db.js
import mongoose from "mongoose";

const uri = process.env.PRODUCTS_MONGO_URI; // <- nueva variable

export async function connectMongo() {
  if (!uri) throw new Error("PRODUCTS_MONGO_URI no iniciada");
  // Para Cosmos RU-based, asegúrate de retryWrites=false en la URI
  // Para vCore, el SRV ya trae opciones correctas
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 8000
  });
  console.log("✅ Connected a Mongo (Cosmos DB)");
}