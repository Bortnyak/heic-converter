import { readdir, readFile, writeFile } from 'node:fs/promises'
import { extname } from "node:path";
import { convert } from "heic-convert";

const config = await readFile('./config.json');
const configJSON = JSON.parse(config);
const { srcDir, outDir, compQuality } = configJSON;

console.info("configJSON: ", configJSON);

try {
  const files = await readdir(srcDir);

  for (const f of files) {
    const ext = extname(f);

    if (ext === ".heic") {
      const inputBuffer = await readFile(f);
      const outputBuffer = await convert({
        buffer: inputBuffer, // the HEIC file buffer
        format: 'JPEG',      // output format
        quality: compQuality           // the jpeg compression quality, between 0 and 1
      });
      const fileName = f.substring(0, f.indexOf(".")) + ".jpg";
      await writeFile(`${outDir}/${fileName}`, outputBuffer);
    }
  }

} catch (e) {
  console.log(e);
}