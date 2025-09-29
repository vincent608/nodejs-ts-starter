import {
  Worker,
  isMainThread,
  parentPort,
  setEnvironmentData,
  getEnvironmentData,
} from "worker_threads";

if (isMainThread) {
    setEnvironmentData("key", "value");
  const worker = new Worker(__filename);
  worker.once("message", (message) => {
    console.log("Parent: " + message); // Prints 'Hello, world!'.
  });
  worker.postMessage("Hello, world!");
} else {
    console.log("worker: " + getEnvironmentData("key")); 
  // When a message from the parent thread is received, send it back:
  parentPort.once("message", (message) => {
    parentPort.postMessage(message);
  });
}
