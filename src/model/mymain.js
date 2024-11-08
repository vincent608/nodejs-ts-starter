// main.js
const { Worker } = require("worker_threads");

const worker = new Worker("./myworker.js");

worker.on("message", (result) => {
  console.log("Pareent: Received result from worker:", result);
});

worker.on("error", (error) => {
  console.error("Parent: Worker error:", error);
});

worker.on("exit", (code) => {
  if (code !== 0) {
    console.error(`Parent: Worker stopped with exit code ${code}`);
  }
});

// Post an object to the worker
const data = { key: "value", number: 42 };
worker.postMessage(data);
