import "dotenv/config";

// Database client for TerraBrew running PostgreSQL
// This is executed only on the server. If run on the client, it returns mock methods.

export interface Profile {
  id: number;
  email: string;
  password_hash: string;
  full_name: string;
  role: "farmer" | "sea";
  farm_name?: string;
  organization?: string;
  country?: string;
  region?: string;
  created_at: string;
}

export interface Prediction {
  id: number;
  farmer_id: number;
  location_name: string;
  temperature: number;
  humidity: number;
  rainfall: number;
  water_availability: string;
  recommended_method: string;
  created_at: string;
}

export interface Certification {
  id: number;
  farmer_id: number;
  farm_name: string;
  coffee_variety: string;
  status: "pending" | "approved" | "rejected";
  country?: string;
  region?: string;
  env_suhu?: number;
  env_rh?: number;
  env_curah_hujan?: number;
  eco_pendapatan?: number;
  eco_luas_lahan?: number;
  eco_produksi?: number;
  env_kesesuaian: number;
  env_metode: number;
  env_energi: number;
  env_pestisida: number;
  env_konservasi: number;
  env_score: number;
  eco_kualitas: number;
  eco_pendapatan_norm: number;
  eco_luas_lahan_norm: number;
  eco_produksi_norm: number;
  eco_kredit: number;
  eco_score: number;
  sos_kelompok: number;
  sos_gender: number;
  sos_pendidikan: number;
  sos_hp: number;
  sos_internet: number;
  sos_score: number;
  ecoscore: number;
  validated_by?: number;
  validator_feedback?: string;
  validator_photo?: string;
  created_at: string;
}

let sql: any = null;
let isInitialized = false;

export async function getDb() {
  if (typeof window !== "undefined") {
    return null; // Don't run Postgres in client browser
  }

  if (sql) return sql;

  const connectionString = process.env.DATABASE_URL || "postgres://apple@localhost:5432/terrabrew";

  try {
    const postgres = await import("postgres");
    // Connect to postgres db
    sql = postgres.default(connectionString, {
      connect_timeout: 5,
      max_lifetime: 60,
    });

    // Test connection
    await sql`SELECT 1`;
    console.log("Connected to PostgreSQL successfully");

    // Initialize tables if they don't exist
    if (!isInitialized) {
      await initializeSchema();
      isInitialized = true;
    }

    return sql;
  } catch (error) {
    console.error("Failed to connect to PostgreSQL. Operating in Mock mode.", error);
    sql = null;
    return null;
  }
}

async function initializeSchema() {
  if (!sql) return;

  try {
    // 1. Create profiles table
    await sql`
      CREATE TABLE IF NOT EXISTS profiles (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('farmer', 'sea')),
        farm_name VARCHAR(255),
        organization VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // 2. Create predictions table
    await sql`
      CREATE TABLE IF NOT EXISTS predictions (
        id SERIAL PRIMARY KEY,
        farmer_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE,
        location_name VARCHAR(255) NOT NULL,
        temperature NUMERIC NOT NULL,
        humidity NUMERIC NOT NULL,
        rainfall NUMERIC NOT NULL,
        water_availability VARCHAR(50) NOT NULL,
        recommended_method VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // 3. Create certifications table
    await sql`
      CREATE TABLE IF NOT EXISTS certifications (
        id SERIAL PRIMARY KEY,
        farmer_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE,
        farm_name VARCHAR(255) NOT NULL,
        coffee_variety VARCHAR(100) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        
        env_kesesuaian NUMERIC NOT NULL,
        env_metode NUMERIC NOT NULL,
        env_energi NUMERIC NOT NULL,
        env_pestisida NUMERIC NOT NULL,
        env_konservasi NUMERIC NOT NULL,
        env_score NUMERIC NOT NULL,
        
        eco_kualitas NUMERIC NOT NULL,
        eco_pendapatan_norm NUMERIC NOT NULL,
        eco_luas_lahan_norm NUMERIC NOT NULL,
        eco_produksi_norm NUMERIC NOT NULL,
        eco_kredit NUMERIC NOT NULL,
        eco_score NUMERIC NOT NULL,
        
        sos_kelompok NUMERIC NOT NULL,
        sos_gender NUMERIC NOT NULL,
        sos_pendidikan NUMERIC NOT NULL,
        sos_hp NUMERIC NOT NULL,
        sos_internet NUMERIC NOT NULL,
        sos_score NUMERIC NOT NULL,
        
        ecoscore NUMERIC NOT NULL,
        validated_by INTEGER REFERENCES profiles(id),
        validator_feedback TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // 4. Migrate tables (Add country & region columns if they don't exist yet)
    await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country VARCHAR(100)`;
    await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS region VARCHAR(100)`;
    await sql`ALTER TABLE certifications ADD COLUMN IF NOT EXISTS country VARCHAR(100)`;
    await sql`ALTER TABLE certifications ADD COLUMN IF NOT EXISTS region VARCHAR(100)`;
    await sql`ALTER TABLE certifications ADD COLUMN IF NOT EXISTS env_suhu NUMERIC`;
    await sql`ALTER TABLE certifications ADD COLUMN IF NOT EXISTS env_rh NUMERIC`;
    await sql`ALTER TABLE certifications ADD COLUMN IF NOT EXISTS env_curah_hujan NUMERIC`;
    await sql`ALTER TABLE certifications ADD COLUMN IF NOT EXISTS eco_pendapatan NUMERIC`;
    await sql`ALTER TABLE certifications ADD COLUMN IF NOT EXISTS eco_luas_lahan NUMERIC`;
    await sql`ALTER TABLE certifications ADD COLUMN IF NOT EXISTS eco_produksi NUMERIC`;
    await sql`ALTER TABLE certifications ADD COLUMN IF NOT EXISTS validator_photo TEXT`;

    console.log("PostgreSQL database tables verified/created successfully.");
  } catch (err) {
    console.error("Error creating PostgreSQL schema tables:", err);
  }
}
