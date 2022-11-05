import { extname } from "node:path";
import { copyFile } from 'node:fs';
// import { Piscina } from 'piscina';
import { readFile, writeFile } from 'node:fs/promises';
import convert from "heic-convert";



const imageExtensions = [".HEIC", ".heic"];
// const piscina = new Piscina({
//   // The URL must be a file:// URL
//   filename: new URL('./worker.js', import.meta.url).href
// });


async function listenToEvents() {
  let parentPid;
  let procNum;

  process.on("message", async (msg) => {
    const { pid, chunk, srcDir, outDir, number, m } = msg;
    parentPid = pid;
    procNum = number;

    console.log("Message from child process ==> ", m);

    //const jobs = [];

    let filesCount = 0;

    for (const image of chunk) {
      const ext = extname(image);

      if (imageExtensions.indexOf(ext) < 0) {
        const inputp = `${srcDir}/${image}`;
        const output = `${outDir}/${image}`;

        copyFile(inputp, output, (err) => {
          if (err) throw err;
          console.log("File isn't in heic format, so just copied to destination");
        });

        continue;
      }

      // jobs.push(piscina.run({ srcDir, image, outDir }));

      let inputBuffer;
      try {
        inputBuffer = await readFile(`${srcDir}${image}`);
      } catch (e) {
        console.log("Error while reading file: ", e);
      }

      let outputBuffer;
      try {
        outputBuffer = await convert({
          buffer: inputBuffer, // the HEIC file buffer
          format: 'JPEG',      // output format
          quality: 1 // the jpeg compression quality, between 0 and 1
        });
      } catch (e) {
        console.log("Error while coverting file: ", e);
      }

      const fileName = image.substring(0, image.indexOf(".")) + ".jpg";
      try {
        await writeFile(`${outDir}${fileName}`, outputBuffer);
      } catch (e) {
        console.log("Error while writing file: ", e);
      }

      filesCount += 1;
      process.send({ fileProcessed: fileName, number: procNum, totalCountByProc: filesCount });
    }

    process.send({ ready: true });
    // const res = await Promise.allSettled(jobs);
  });





  process.on("SIGTERM", () => {
    console.log("Parent process terminating me :( ");
    console.log("Goodbye!");
    process.exit(1);
  });
}


await listenToEvents();
