import { readdir, readFile, writeFile } from 'node:fs/promises';

import { extname } from "node:path";
import { cpus } from "node:os";
import { fork } from "node:child_process";

const config = await readFile('./config.json');


const pid = process.pid;
const { srcDir, outDir, compQuality } = JSON.parse(config);

const prepareChunks = async () => {
  const cpuCount = cpus().length;
  console.log("cpuCount: ", cpuCount);

  const config = await readFile('./config.json');


  const chunksArr = [];

  const files = await readdir(srcDir);
  const filesCount = files.length;
  const chunkSize = Math.round(filesCount / cpuCount);

  console.log("chunkSize: ", chunkSize);

  for (let i = 0; i < filesCount; i += chunkSize) {
    const chunk = files.slice(i, i + chunkSize);
    chunksArr.push(chunk);
  }

  return chunksArr;
}


const distributeByCores = (chunksArr) => {
  let processCounter = 1;
  for (const chunk of chunksArr) {
    const forkedProc = fork("imageProcessor.js", { stdio: 'pipe' });
    forkedProc.stdout.pipe(process.stdout);
    forkedProc.stderr.pipe(process.stderr);

    const m = `Process ${processCounter} has been forked`;
    forkedProc.send({ pid, chunk, srcDir, outDir, m });

    processCounter += 1;

    forkedProc.on("error", (e) => {
      console.log("Erro event emmited: ", e)
    })

    forkedProc.on('message', (msg) => {
      console.log("msg from child....", msg);
    });
  }
}


const init = async () => {
  const chunks = await prepareChunks();

  distributeByCores(chunks);


  process.on("SIGTERM", () => {
    console.log("Crap...!");
    process.exit(1);
  });
}


await init();