import { readdir, readFile } from 'node:fs/promises';
import { cpus } from "node:os";
import { fork } from "node:child_process";

const config = await readFile('./config.json');
const pid = process.pid;
const { srcDir, outDir, compQuality } = JSON.parse(config);

let liveProcCounter = 0;

const prepareChunks = async () => {
  const cpuCount = cpus().length;
  const chunksArr = [];
  const files = await readdir(srcDir);
  const filesCount = files.length;
  const chunkSize = Math.round(filesCount / cpuCount);

  for (let i = 0; i < filesCount; i += chunkSize) {
    const chunk = files.slice(i, i + chunkSize);
    chunksArr.push(chunk);
  }

  return chunksArr;
}


const checkReadinessAndShutdown = () => {
  if (liveProcCounter === 0) {
    console.log("There are no more jobs in progress. So, I'm done");
    process.exit(0);
  }
}


const distributeByCores = (chunksArr) => {
  for (const chunk of chunksArr) {
    const forkedProc = fork("imageProcessor.js", { stdio: 'pipe' });

    forkedProc.stdout.pipe(process.stdout);
    forkedProc.stderr.pipe(process.stderr);

    liveProcCounter += 1;

    forkedProc.send({
      pid, chunk, srcDir, outDir, number: liveProcCounter, m: `Process ${liveProcCounter} has been forked`,
    });


    forkedProc.on("error", (e) => {
      console.log("Erro event fired: ", e)
    })

    forkedProc.on('message', (msg) => {
      console.log("msg from child ==> ", msg);
      if (msg.ready) {
        forkedProc.kill();
        liveProcCounter -= 1;
      }

      checkReadinessAndShutdown();
    });
  }
}


const init = async () => {
  const chunks = await prepareChunks();
  distributeByCores(chunks);
}


await init();