import { extname } from "node:path";
import { copyFile } from 'node:fs';
// import { Piscina } from 'piscina';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import convert from "heic-convert";



const imageExtensions = [".HEIC", ".heic"];
// const piscina = new Piscina({
//   // The URL must be a file:// URL
//   filename: new URL('./worker.js', import.meta.url).href
// });


async function listenToEvents() {
  let parentPid;

  process.on("message", async (msg) => {
    const { pid, chunk, srcDir, outDir, m } = msg;
    parentPid = pid;

    console.log("Child proccess says:: ", m)
    const jobs = [];

    let filesCount = 0;
    for (const image of chunk) {
      const ext = extname(image);
      console.log("ext: ", ext);

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
      process.send({ fileProcessed: fileName, totalCountByProc: filesCount });
    }

    // console.log("jobs size: ", jobs.length);
    // console.log("Before start of workes......");
    // const res = await Promise.allSettled(jobs);
    // console.log("res: ", res);
  });


  process.send({ msg: "Child proccess received args" });


  // process.on("SIGTERM", () => {
  //   console.log("Parent process terminating me....");
  //   console.log("So, I'll do the same...!");
  //   process.kill(parentPid);
  //   process.exit(1);
  // });
}

try {
  await listenToEvents();
} catch (e) {
  console.log("Error ");
}
