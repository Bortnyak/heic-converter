import { readdir, readFile, writeFile } from 'node:fs/promises';
import convert from "heic-convert";

export default async ({ srcDir, image, outDir }) => {
  const inputBuffer = await readFile(`${srcDir}${image}`);
  const outputBuffer = await convert({
    buffer: inputBuffer, // the HEIC file buffer
    format: 'JPEG',      // output format
    quality: 1 // the jpeg compression quality, between 0 and 1
  });
  const fileName = image.substring(0, image.indexOf(".")) + ".jpg";
  await writeFile(`${outDir}${fileName}/`, outputBuffer);
}