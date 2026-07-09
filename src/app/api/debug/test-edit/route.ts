import { NextRequest, NextResponse } from "next/server";
import { readJsonForWrite, slugify } from "@/lib/github";
import { MODULES } from "@/lib/config";
import type { Profesor } from "@/lib/types";

/**
 * POST /api/debug/test-edit
 * Diagnóstico: prueba la lógica de búsqueda sin escribir nada.
 * Body: { id: "temp-2-..." }
 */

const JSON_PATH = MODULES.profesores.jsonPath;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const id = body.id as string;

  if (!id) {
    return NextResponse.json({ error: "Falta el campo: id" }, { status: 400 });
  }

  const { data: lista, sha } = await readJsonForWrite<Profesor[]>(JSON_PATH, "id");

  if (!lista) {
    return NextResponse.json({ error: "No se pudo leer la lista" }, { status: 500 });
  }

  const profesoresInfo = lista.map((p, i) => ({
    index: i,
    nombre: p.nombre,
    id: p.id || "(sin id)",
    tieneId: !!p.id,
  }));

  let index = lista.findIndex((p) => p.id === id);
  let estrategiaUsada = "id directo";

  if (index === -1) {
    const tempMatch = id.match(/^temp-(\d+)-(.+)$/);
    if (tempMatch) {
      const tempIndex = parseInt(tempMatch[1], 10);
      const slugFromId = tempMatch[2];
      estrategiaUsada = `temp match: index=${tempIndex}, slugFromId="${slugFromId}"`;

      if (!isNaN(tempIndex) && tempIndex < lista.length) {
        const candidato = lista[tempIndex];
        if (!candidato.id) {
          index = tempIndex;
          estrategiaUsada += " → ESTRATEGIA 1 (índice) FUNCIONÓ";
        } else {
          estrategiaUsada += ` → ESTRATEGIA 1 falló: candidato tiene id="${candidato.id}"`;
        }
      } else {
        estrategiaUsada += ` → ESTRATEGIA 1 falló: tempIndex=${tempIndex} >= length=${lista.length}`;
      }

      if (index === -1) {
        estrategiaUsada += ". Probando ESTRATEGIA 2 (slug)...";
        const debugSlugs = lista.map((p) => {
          if (p.id) return null;
          return {
            nombre: p.nombre,
            pSlugRaw: p.nombre.toLowerCase().replace(/\s+/g, "-").slice(0, 40),
            pSlugClean: slugify(p.nombre),
            matchRaw: p.nombre.toLowerCase().replace(/\s+/g, "-").slice(0, 40) === slugFromId,
            slugFromIdClean: slugify(slugFromId.replace(/-/g, " ")),
          };
        }).filter(Boolean);

        index = lista.findIndex((p) => {
          if (p.id) return false;
          const pSlugRaw = p.nombre.toLowerCase().replace(/\s+/g, "-").slice(0, 40);
          if (pSlugRaw === slugFromId) return true;
          const pSlugClean = slugify(p.nombre);
          const slugFromIdClean = slugify(slugFromId.replace(/-/g, " "));
          if (pSlugClean === slugFromIdClean) return true;
          if (pSlugClean.length > 10 && slugFromIdClean.length > 10) {
            return pSlugClean.startsWith(slugFromIdClean.slice(0, 15));
          }
          return false;
        });
        estrategiaUsada += index !== -1 ? " → FUNCIONÓ" : " → falló";
        estrategiaUsada += `. Debug slugs: ${JSON.stringify(debugSlugs)}`;
      }
    } else {
      estrategiaUsada = "el ID no tiene formato temp-N-...";
    }
  }

  return NextResponse.json({
    receivedId: id,
    totalProfesores: lista.length,
    profesores: profesoresInfo,
    busqueda: {
      indexFound: index,
      profesorEncontrado: index !== -1 ? { nombre: lista[index].nombre, id: lista[index].id || "(sin id)" } : null,
      estrategiaUsada,
      sha,
    },
  });
}
