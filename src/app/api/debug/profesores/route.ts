import { NextResponse } from "next/server";
import { GITHUB_CONFIG } from "@/lib/config";

/**
 * GET /api/debug/profesores
 * Endpoint de diagnóstico que muestra qué devuelve cada fuente de datos.
 */

const JSON_PATH = "data/profesores.json";

export async function GET() {
  const result: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    path: JSON_PATH,
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_URL: process.env.VERCEL_URL || "(no definido)",
      HAS_GITHUB_TOKEN: !!process.env.GITHUB_TOKEN,
      TOKEN_IS_PLACEHOLDER: process.env.GITHUB_TOKEN === "dev-placeholder-replace-with-real-token",
      GITHUB_CONFIG,
    },
    sources: {},
  };

  // 1. GitHub API
  const token = process.env.GITHUB_TOKEN;
  if (token && token !== "dev-placeholder-replace-with-real-token") {
    try {
      const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${JSON_PATH}?ref=${GITHUB_CONFIG.branch}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "AEFN-Debug",
        },
      });

      result.sources.github = {
        status: response.status,
        ok: response.ok,
      };

      if (response.ok) {
        const fileData = await response.json();
        const content = Buffer.from(fileData.content, "base64").toString("utf-8");
        const parsed = JSON.parse(content);
        result.sources.github.count = parsed.length;
        result.sources.github.sha = fileData.sha;
        result.sources.github.firstItem = parsed[0]
          ? { nombre: parsed[0].nombre, id: parsed[0].id || "(sin id)" }
          : null;
      } else {
        const errorText = await response.text();
        result.sources.github.error = errorText.substring(0, 300);
      }
    } catch (error) {
      result.sources.github = {
        error: error instanceof Error ? error.message : String(error),
      };
    }
  } else {
    result.sources.github = { skipped: "No hay token válido" };
  }

  // 2. Archivo local
  try {
    const fs = await import("fs/promises");
    const localPath = `${process.cwd()}/public/${JSON_PATH}`;
    const content = await fs.readFile(localPath, "utf-8");
    const parsed = JSON.parse(content);
    result.sources.local = {
      ok: true,
      path: localPath,
      count: parsed.length,
      firstItem: parsed[0]
        ? { nombre: parsed[0].nombre, id: parsed[0].id || "(sin id)" }
        : null,
    };
  } catch (error) {
    result.sources.local = {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // 3. Fetch estático
  try {
    let baseUrl: string;
    if (process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    } else {
      baseUrl = "http://localhost:3000";
    }

    const url = `${baseUrl}/${JSON_PATH}`;
    const response = await fetch(url);
    result.sources.static = {
      url,
      status: response.status,
      ok: response.ok,
    };

    if (response.ok) {
      const content = await response.text();
      const parsed = JSON.parse(content);
      result.sources.static.count = parsed.length;
      result.sources.static.firstItem = parsed[0]
        ? { nombre: parsed[0].nombre, id: parsed[0].id || "(sin id)" }
        : null;
    }
  } catch (error) {
    result.sources.static = {
      error: error instanceof Error ? error.message : String(error),
    };
  }

  result.summary = {
    githubWorks: result.sources.github?.count !== undefined,
    localWorks: result.sources.local?.ok === true,
    staticWorks: result.sources.static?.ok === true,
  };

  return NextResponse.json(result, { status: 200 });
}
