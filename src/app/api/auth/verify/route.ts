import { NextRequest, NextResponse } from "next/server";
import { verifyKey, extractKeyFromRequest } from "@/lib/auth";

/**
 * POST /api/auth/verify
 * ===========================================
 * Verifica si una clave de acceso es válida y devuelve los módulos a los que
 * tiene permiso. El frontend usa esta ruta al hacer login en /admin.
 *
 * Request:
 *   Headers: Authorization: Bearer <clave>  (o solo <clave>)
 *   Body: vacío
 *
 * Response 200:
 *   { "valid": true, "modules": ["profesores", "eventos", ...] }
 *
 * Response 401:
 *   { "valid": false, "modules": [], "message": "Clave inválida" }
 *
 * 📚 Concepto: API Route en Next.js
 * Una "API Route" es código que se ejecuta en el SERVIDOR, no en el navegador.
 * El archivo route.ts dentro de src/app/api/... define un endpoint HTTP.
 * Next.js automáticamente lo expone en la URL que corresponde a la carpeta.
 * El navegador lo llama con fetch(), igual que llamaría a cualquier API externa.
 *
 * 📚 Concepto: POST vs GET
 * - GET: para LEER datos (no debería tener efectos secundarios)
 * - POST: para ENVIAR datos que modifican algo
 * Usamos POST aquí (aunque solo validamos) porque estamos enviando una clave
 * sensible. Las peticiones GET pueden quedar registradas en logs con sus
 * parámetros visibles; las POST no. Es una buena práctica de seguridad.
 */
export async function POST(request: NextRequest) {
  try {
    const key = extractKeyFromRequest(request);

    if (!key) {
      return NextResponse.json(
        {
          valid: false,
          modules: [],
          message: "No se proporcionó ninguna clave.",
        },
        { status: 401 }
      );
    }

    const { valid, modules } = verifyKey(key);

    if (!valid) {
      return NextResponse.json(
        {
          valid: false,
          modules: [],
          message: "Clave inválida.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      valid: true,
      modules,
      message: `Acceso concedido a: ${modules.join(", ")}`,
    });
  } catch (error) {
    console.error("[auth/verify] Error:", error);
    return NextResponse.json(
      {
        valid: false,
        modules: [],
        message: "Error interno del servidor al validar la clave.",
      },
      { status: 500 }
    );
  }
}
