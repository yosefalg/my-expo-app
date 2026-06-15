import fs from "fs/promises";
import path from "path";

const workspaceRoot = process.cwd().endsWith(path.join("artifacts", "api-server"))
  ? path.resolve(process.cwd(), "../..")
  : process.cwd();

const uploadsDir = path.resolve(workspaceRoot, "artifacts/api-server/uploads");

export async function ensureUploadsDir(): Promise<void> {
  await fs.mkdir(uploadsDir, { recursive: true });
}

export async function saveBase64Image(
  id: string,
  base64Data: string,
  mimeType: string,
): Promise<string> {
  await ensureUploadsDir();
  const ext = mimeType.split("/")[1] ?? "jpg";
  const filename = `${id}.${ext}`;
  const filepath = path.join(uploadsDir, filename);
  const buffer = Buffer.from(base64Data, "base64");
  await fs.writeFile(filepath, buffer);
  return `/api/uploads/${filename}`;
}

export async function serveUpload(filename: string): Promise<Buffer | null> {
  try {
    const filepath = path.join(uploadsDir, filename);
    return await fs.readFile(filepath);
  } catch {
    return null;
  }
}
