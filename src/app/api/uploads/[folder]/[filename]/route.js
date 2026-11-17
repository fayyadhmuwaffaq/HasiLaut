import fs from "node:fs/promises";
import { resolveUploadFilePath } from "@/lib/upload";

export async function GET(_request, context) {
  const { folder, filename } = await context.params;
  const resolved = resolveUploadFilePath(folder, filename);

  if (!resolved) {
    return Response.json({ error: "Berkas tidak ditemukan." }, { status: 404 });
  }

  try {
    const fileBuffer = await fs.readFile(resolved.filePath);
    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": resolved.mimeType,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    if (error?.code === "ENOENT") {
      return Response.json({ error: "Berkas tidak ditemukan." }, { status: 404 });
    }
    return Response.json({ error: "Gagal membaca berkas." }, { status: 500 });
  }
}
