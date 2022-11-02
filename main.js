import { readdir, readFile, writeFile } from 'node:fs/promises';
import { copyFile } from 'node:fs';
import { extname } from "node:path";
import converter from "heic-convert";

const config = await readFile('./config.json');
const { srcDir, outDir, compQuality } = JSON.parse(config);

let counter = 0;

try {
  const files = await readdir(srcDir);
  for (const f of files) {
    const ext = extname(f);

    if (ext === ".HEIC") {
      const inputBuffer = await readFile(`${srcDir}${f}`);
      const outputBuffer = await converter({
        buffer: inputBuffer, // the HEIC file buffer
        format: 'JPEG',      // output format
        quality: compQuality // the jpeg compression quality, between 0 and 1
      });
      const fileName = f.substring(0, f.indexOf(".")) + ".jpg";
      await writeFile(`${outDir}${fileName}/`, outputBuffer);
    } else {
      copyFile(`${srcDir}/${f}`, `${outDir}/${f}`, (err) => {
        if (err) throw err;
        console.log('exe was copied to destination');
      });
    }
    counter += 1;
  }
} catch (e) {
  console.log(e);
}