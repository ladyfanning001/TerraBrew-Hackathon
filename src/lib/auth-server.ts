import { createServerFn } from "@tanstack/react-start";
import { getDb } from "./db";
import { crypto } from "crypto";

// In-memory fallback database for Mock Mode (when PostgreSQL is not running)
const mockCertifications: any[] = [];
const mockPredictions: any[] = [];

// Web Crypto SHA-256 Hashing helper
async function hashPassword(password: string): Promise<string> {
  // Use global webcrypto if available (e.g. in newer Node / Cloudflare)
  const subtle = typeof window === 'undefined' 
    ? (globalThis.crypto?.subtle || (await import("crypto")).webcrypto.subtle)
    : null;

  if (!subtle) {
    throw new Error("Crypto API not available");
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// 1. REGISTER USER
export const registerUser = createServerFn({ method: "POST" })
  .validator((d: {
    fullName: string;
    email: string;
    password: string;
    role: "farmer" | "sea";
    farmName?: string;
    organization?: string;
    country?: string;
    region?: string;
  }) => d)
  .handler(async ({ data }) => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database connection not available");
    }

    try {
      // Check if user already exists
      const existing = await db`
        SELECT id FROM profiles WHERE email = ${data.email.toLowerCase()}
      `;
      if (existing.length > 0) {
        throw new Error("Email already registered");
      }

      // Hash password
      const pwHash = await hashPassword(data.password);

      // Insert profile
      const result = await db`
        INSERT INTO profiles (
          email, password_hash, full_name, role, farm_name, organization, country, region
        ) VALUES (
          ${data.email.toLowerCase()}, ${pwHash}, ${data.fullName}, ${data.role}, ${data.farmName || null}, ${data.organization || null}, ${data.country || null}, ${data.region || null}
        ) RETURNING id, email, full_name, role, farm_name, organization, country, region, created_at
      `;

      return {
        success: true,
        user: result[0],
      };
    } catch (error: any) {
      console.error("Register Error:", error);
      return {
        success: false,
        error: error.message || "An error occurred during registration",
      };
    }
  });

// 2. LOGIN USER
export const loginUser = createServerFn({ method: "POST" })
  .validator((d: { email: string; password: string }) => d)
  .handler(async ({ data }) => {
    const emailLower = data.email.toLowerCase().trim();
    const db = await getDb();

    // Support quick demo logins in database-active mode
    if (data.password === "password" && (emailLower === "sea@terrabrew.com" || emailLower === "petani@terrabrew.com")) {
      const isSea = emailLower === "sea@terrabrew.com";
      const profile = {
        email: emailLower,
        full_name: isSea ? "Hendrik Wijaya (Demo)" : "Budi Santoso (Demo)",
        role: isSea ? "sea" : "farmer",
        farm_name: isSea ? null : "Aceh Gayo Farm",
        organization: isSea ? "SEA Indonesia" : null,
        country: "Indonesia",
        region: "Aceh",
      };

      if (db) {
        try {
          const existing = await db`
            SELECT id, email, full_name, role, farm_name, organization, country, region, created_at 
            FROM profiles WHERE email = ${emailLower}
          `;
          if (existing.length === 0) {
            const inserted = await db`
              INSERT INTO profiles (email, password_hash, full_name, role, farm_name, organization, country, region)
              VALUES (
                ${profile.email}, 
                'demo_pw_hash', 
                ${profile.full_name}, 
                ${profile.role}, 
                ${profile.farm_name}, 
                ${profile.organization}, 
                ${profile.country}, 
                ${profile.region}
              )
              RETURNING id, email, full_name, role, farm_name, organization, country, region, created_at
            `;
            return {
              success: true,
              user: inserted[0],
            };
          } else {
            return {
              success: true,
              user: existing[0],
            };
          }
        } catch (err) {
          console.error("Seeding demo profile failed:", err);
        }
      } else {
        // Fallback for Mock connection
        return {
          success: true,
          user: {
            id: isSea ? 888 : 999,
            ...profile,
            created_at: new Date().toISOString()
          }
        };
      }
    }

    if (!db) {
      throw new Error("Database connection not available");
    }

    try {
      const users = await db`
        SELECT id, email, password_hash, full_name, role, farm_name, organization, country, region, created_at
        FROM profiles WHERE email = ${emailLower}
      `;

      if (users.length === 0) {
        throw new Error("User not found");
      }

      const user = users[0];
      const pwHash = await hashPassword(data.password);

      if (user.password_hash !== pwHash) {
        throw new Error("Incorrect password");
      }

      // Omit password hash in response
      const { password_hash, ...profile } = user;

      return {
        success: true,
        user: profile,
      };
    } catch (error: any) {
      console.error("Login Error:", error);
      return {
        success: false,
        error: error.message || "An error occurred during login",
      };
    }
  });

// 3. SAVE PREDICTION
export const savePrediction = createServerFn({ method: "POST" })
  .validator((d: {
    farmerId: number;
    locationName: string;
    temperature: number;
    humidity: number;
    rainfall: number;
    waterAvailability: string;
    recommendedMethod: string;
  }) => d)
  .handler(async ({ data }) => {
    const db = await getDb();
    if (!db) {
      const newPred = {
        id: mockPredictions.length + 1,
        farmer_id: data.farmerId,
        location_name: data.locationName,
        temperature: data.temperature,
        humidity: data.humidity,
        rainfall: data.rainfall,
        water_availability: data.waterAvailability,
        recommended_method: data.recommendedMethod,
        created_at: new Date().toISOString()
      };
      mockPredictions.push(newPred);
      return { success: true, id: newPred.id };
    }

    try {
      const result = await db`
        INSERT INTO predictions (
          farmer_id, location_name, temperature, humidity, rainfall, water_availability, recommended_method
        ) VALUES (
          ${data.farmerId}, ${data.locationName}, ${data.temperature}, ${data.humidity}, ${data.rainfall}, ${data.waterAvailability}, ${data.recommendedMethod}
        ) RETURNING id, created_at
      `;
      return { success: true, id: result[0].id };
    } catch (error: any) {
      console.error("Save Prediction Error:", error);
      return { success: false, error: error.message };
    }
  });

// 4. GET PREDICTIONS HISTORY
export const getPredictionsHistory = createServerFn({ method: "GET" })
  .validator((d: { farmerId: number }) => d)
  .handler(async ({ data }) => {
    const db = await getDb();
    if (!db) {
      return mockPredictions
        .filter(p => p.farmer_id === data.farmerId)
        .map(p => ({
          id: p.id,
          locationName: p.location_name,
          temperature: p.temperature,
          humidity: p.humidity,
          rainfall: p.rainfall,
          waterAvailability: p.water_availability,
          recommendedMethod: p.recommended_method,
          createdAt: p.created_at
        }))
        .sort((a, b) => b.id - a.id);
    }

    try {
      const rows = await db`
        SELECT id, location_name as "locationName", temperature, humidity, rainfall, water_availability as "waterAvailability", recommended_method as "recommendedMethod", created_at as "createdAt"
        FROM predictions 
        WHERE farmer_id = ${data.farmerId}
        ORDER BY created_at DESC
      `;
      return rows;
    } catch (error) {
      console.error("Get Predictions Error:", error);
      return [];
    }
  });

// 5. SUBMIT CERTIFICATION
export const submitCertification = createServerFn({ method: "POST" })
  .validator((d: {
    farmerId: number;
    farmName: string;
    coffeeVariety: string;
    country?: string;
    region?: string;
    
    // Raw parameters
    envSuhu: number;
    envRh: number;
    envCurahHujan: number;
    ecoPendapatan: number;
    ecoLuasLahan: number;
    ecoProduksi: number;

    // Step 1
    envKesesuaian: number;
    envMetode: number;
    envEnergi: number;
    envPestisida: number;
    envKonservasi: number;
    envScore: number;

    // Step 2
    ecoKualitas: number;
    ecoPendapatanNorm: number;
    ecoLuasLahanNorm: number;
    ecoProduksiNorm: number;
    ecoKredit: number;
    ecoScore: number;

    // Step 3
    sosKelompok: number;
    sosGender: number;
    sosPendidikan: number;
    sosHp: number;
    sosInternet: number;
    sosScore: number;

    // Step 4
    ecoscore: number;
  }) => d)
  .handler(async ({ data }) => {
    const db = await getDb();
    if (!db) {
      const newCert = {
        id: mockCertifications.length + 1,
        farmer_id: data.farmerId,
        farm_name: data.farmName,
        coffee_variety: data.coffeeVariety,
        status: 'pending',
        country: data.country || 'Indonesia',
        region: data.region || 'Aceh',
        env_suhu: data.envSuhu,
        env_rh: data.envRh,
        env_curah_hujan: data.envCurahHujan,
        eco_pendapatan: data.ecoPendapatan,
        eco_luas_lahan: data.ecoLuasLahan,
        eco_produksi: data.ecoProduksi,
        env_kesesuaian: data.envKesesuaian,
        env_metode: data.envMetode,
        env_energi: data.envEnergi,
        env_pestisida: data.envPestisida,
        env_konservasi: data.envKonservasi,
        env_score: data.envScore,
        eco_kualitas: data.ecoKualitas,
        eco_pendapatan_norm: data.ecoPendapatanNorm,
        eco_luas_lahan_norm: data.ecoLuasLahanNorm,
        eco_produksi_norm: data.ecoProduksiNorm,
        eco_kredit: data.ecoKredit,
        eco_score: data.ecoScore,
        sos_kelompok: data.sosKelompok,
        sos_gender: data.sosGender,
        sos_pendidikan: data.sosPendidikan,
        sos_hp: data.sosHp,
        sos_internet: data.sosInternet,
        sos_score: data.sosScore,
        ecoscore: data.ecoscore,
        created_at: new Date().toISOString()
      };
      mockCertifications.push(newCert);
      return { success: true, id: newCert.id };
    }

    try {
      const result = await db`
        INSERT INTO certifications (
          farmer_id, farm_name, coffee_variety, status, country, region,
          env_suhu, env_rh, env_curah_hujan, eco_pendapatan, eco_luas_lahan, eco_produksi,
          env_kesesuaian, env_metode, env_energi, env_pestisida, env_konservasi, env_score,
          eco_kualitas, eco_pendapatan_norm, eco_luas_lahan_norm, eco_produksi_norm, eco_kredit, eco_score,
          sos_kelompok, sos_gender, sos_pendidikan, sos_hp, sos_internet, sos_score,
          ecoscore
        ) VALUES (
          ${data.farmerId}, ${data.farmName}, ${data.coffeeVariety}, 'pending', ${data.country || null}, ${data.region || null},
          ${data.envSuhu}, ${data.envRh}, ${data.envCurahHujan}, ${data.ecoPendapatan}, ${data.ecoLuasLahan}, ${data.ecoProduksi},
          ${data.envKesesuaian}, ${data.envMetode}, ${data.envEnergi}, ${data.envPestisida}, ${data.envKonservasi}, ${data.envScore},
          ${data.ecoKualitas}, ${data.ecoPendapatanNorm}, ${data.ecoLuasLahanNorm}, ${data.ecoProduksiNorm}, ${data.ecoKredit}, ${data.ecoScore},
          ${data.sosKelompok}, ${data.sosGender}, ${data.sosPendidikan}, ${data.sosHp}, ${data.sosInternet}, ${data.sosScore},
          ${data.ecoscore}
        ) RETURNING id
      `;
      return { success: true, id: result[0].id };
    } catch (error: any) {
      console.error("Submit Certification Error:", error);
      return { success: false, error: error.message };
    }
  });

// 6. GET CERTIFICATIONS FOR FARMER
export const getFarmerCertifications = createServerFn({ method: "GET" })
  .validator((d: { farmerId: number }) => d)
  .handler(async ({ data }) => {
    const db = await getDb();
    if (!db) {
      return mockCertifications
        .filter(c => c.farmer_id === data.farmerId)
        .sort((a, b) => b.id - a.id);
    }

    try {
      const rows = await db`
        SELECT c.*, p.full_name as "validator_name"
        FROM certifications c
        LEFT JOIN profiles p ON c.validated_by = p.id
        WHERE c.farmer_id = ${data.farmerId}
        ORDER BY c.created_at DESC
      `;
      return rows;
    } catch (error) {
      console.error("Get Farmer Certifications Error:", error);
      return [];
    }
  });

// 7. GET ALL PENDING CERTIFICATIONS (For SEA)
export const getPendingCertifications = createServerFn({ method: "GET" })
  .validator((d: { validatorId: number; allRegions?: boolean }) => d)
  .handler(async ({ data }) => {
    const db = await getDb();
    if (!db) {
      // Mock validation filter (uses Aceh, Indonesia as standard mockup validator location)
      const valCountry = "Indonesia";
      const valRegion = "Aceh";

      return mockCertifications
        .filter(c => 
          c.status === 'pending' && 
          (data.allRegions || (
            c.country?.toLowerCase() === valCountry.toLowerCase() && 
            c.region?.toLowerCase() === valRegion.toLowerCase()
          ))
        )
        .sort((a, b) => a.id - b.id);
    }

    try {
      if (data.allRegions) {
        const rows = await db`
          SELECT c.*, f.full_name as "farmer_name", f.email as "farmer_email"
          FROM certifications c
          JOIN profiles f ON c.farmer_id = f.id
          WHERE c.status = 'pending'
          ORDER BY c.created_at ASC
        `;
        return rows;
      }

      // Look up validator's country & region
      const validators = await db`
        SELECT country, region FROM profiles WHERE id = ${data.validatorId}
      `;
      if (validators.length === 0) return [];
      const validator = validators[0];
      const valCountry = validator.country || '';
      const valRegion = validator.region || '';

      const rows = await db`
        SELECT c.*, f.full_name as "farmer_name", f.email as "farmer_email"
        FROM certifications c
        JOIN profiles f ON c.farmer_id = f.id
        WHERE c.status = 'pending'
          AND LOWER(c.country) = LOWER(${valCountry})
          AND LOWER(c.region) = LOWER(${valRegion})
        ORDER BY c.created_at ASC
      `;
      return rows;
    } catch (error) {
      console.error("Get Pending Certifications Error:", error);
      return [];
    }
  });

// 8. VALIDATE CERTIFICATION (Approve/Reject)
export const validateCertification = createServerFn({ method: "POST" })
  .validator((d: {
    certificationId: number;
    validatorId: number;
    status: "approved" | "rejected";
    feedback: string;
    validatorPhoto?: string;
  }) => d)
  .handler(async ({ data }) => {
    const db = await getDb();
    if (!db) {
      const cert = mockCertifications.find(c => c.id === data.certificationId);
      if (cert) {
        cert.status = data.status;
        cert.validated_by = data.validatorId;
        cert.validator_feedback = data.feedback;
        cert.validator_photo = data.validatorPhoto;
        cert.validator_name = "Hendrik Wijaya (Demo)";
        return { success: true };
      }
      return { success: false, error: "Certification not found" };
    }

    try {
      await db`
        UPDATE certifications 
        SET status = ${data.status},
            validated_by = ${data.validatorId},
            validator_feedback = ${data.feedback},
            validator_photo = ${data.validatorPhoto || null}
        WHERE id = ${data.certificationId}
      `;
      return { success: true };
    } catch (error: any) {
      console.error("Validate Certification Error:", error);
      return { success: false, error: error.message };
    }
  });

// 9. CHATBOT TERRY WITH GEMINI API
export const askTerryChatbot = createServerFn({ method: "POST" })
  .validator((d: {
    messages: { role: "user" | "model"; content: string }[];
  }) => d)
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }
    
    const contents = data.messages.map((m) => ({
      role: m.role === "model" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    const systemInstruction = {
      parts: [{
        text: "You are Terry, a friendly, professional, and helpful AI assistant for TerraBrew. " +
              "TerraBrew is a web platform for smart coffee post-harvest processing (recommending washed, natural, honey, wine, and semi-washed methods based on weather parameters like temperature, relative humidity, and rainfall) and specialty coffee Ecoscore certifications (evaluating environmental, economic, and social sustainability pillars on a 0.00-1.00 scale validated by the SEA). " +
              "Keep your answers concise, engaging, and highly knowledgeable about coffee processing chemistry, fermentation, drying guidelines, and the platform's Ecoscore requirements (low < 0.33, medium 0.33-0.66, high >= 0.66). " +
              "Help farmers optimize their post-harvest processes to increase coffee quality and guide validators in reviewing audits."
      }]
    };

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents,
            systemInstruction,
            generationConfig: {
              maxOutputTokens: 1000,
              temperature: 0.7,
            }
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API Error details:", errorText);
        throw new Error(`Gemini API returned status ${response.status}: ${errorText}`);
      }

      const resData = await response.json();
      const text = resData?.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";
      return { success: true, text };
    } catch (error: any) {
      console.error("Ask Terry Chatbot Error:", error);
      return { success: false, error: error.message };
    }
  });
