import { copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

/**
 * Subcaminho em que o site é servido no GitHub Pages: https://<org>.github.io/<repo>/
 * Precisa bater com o nome do repositório e terminar com "/".
 * É lido em runtime pelo router (import.meta.env.BASE_URL) como basepath.
 */
const BASE = "/mkt-d2l-mestech/";

const OUT_DIR = "docs";

/**
 * O GitHub Pages devolve 404.html quando a URL não casa com nenhum arquivo.
 * Servindo o mesmo HTML da app, um refresh em qualquer subcaminho continua
 * carregando a SPA em vez da página de erro do GitHub.
 */
function spaFallback() {
  return {
    name: "spa-fallback-404",
    closeBundle() {
      const dir = resolve(process.cwd(), OUT_DIR);
      copyFileSync(resolve(dir, "index.html"), resolve(dir, "404.html"));
    },
  };
}

export default defineConfig({
  base: BASE,
  server: {
    port: 5273,
  },
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    spaFallback(),
  ],
  resolve: {
    // Resolves the "@/*" alias from tsconfig.json.
    tsconfigPaths: true,
  },
  build: {
    outDir: OUT_DIR,
    emptyOutDir: true,
  },
});