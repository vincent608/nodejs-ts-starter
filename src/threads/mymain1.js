// main.js
import { Worker } from "worker_threads";

function runWorker(data) {
  return new Promise((resolve, reject) => {
    // use workerData to pass data to worker
    const worker = new Worker("./myworker1.js", {workerData: data});

    worker.on("message", (result) => {
      console.log("Received result from worker:", result);
      resolve(result);
    });

    worker.on("error", (error) => {
      console.error("Worker error:", error);
      reject(error);
    });

    worker.on("exit", (code) => {
      if (code !== 0) {
        console.error(`Worker stopped with exit code ${code}`);
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });

    // use postMessage to pass data to worker
    // worker.postMessage(data);
  });
}

async function main() {
  const data = [{ key: "value1", delay: 5000 }, { key: "value2", delay: 10000 }, { key: "value3", delay: 3000 }];
  const promises = data.map(runWorker);

  try {
    const results = await Promise.all(promises);
    console.log("All workers completed:", results);
  } catch (error) {
    console.error("Error in worker execution:", error);
  }
}

main();
