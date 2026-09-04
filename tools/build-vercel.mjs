import { cp, copyFile, mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const output = join(root, "dist");
const staticFiles = [
  "index.html",
  "client.js",
  "styles.css",
  "manifest.webmanifest",
  "figma-board.html",
  "figma-board.css"
];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await Promise.all(staticFiles.map(file => copyFile(join(root, file), join(output, file))));
await cp(join(root, "assets"), join(output, "assets"), { recursive: true });

console.log("Vercel static bundle ready in dist/");
