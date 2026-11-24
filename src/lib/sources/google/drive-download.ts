export async function downloadDriveFile(token: string, fileId: string) {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status === 403 || response.status === 404) {
    throw new Error(`Drive file could not be downloaded (${response.status}).`);
  }
  if (!response.ok) throw new Error(`Drive download failed (${response.status}).`);
  return Buffer.from(await response.arrayBuffer());
}