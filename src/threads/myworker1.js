// worker.js
import { parentPort, threadId, workerData } from "worker_threads";

// handle data pass with postMessage from parent
parentPort.on("message", (data) => {
  console.log(`${threadId}: Received data from main thread:`, data);
  // Simulate some work with a timeout
  setTimeout(() => {
    const result = processData(data);
    parentPort.postMessage(result);
    parentPort.close();
  }, data.delay);
});

// handle data pass as workerData from parent
console.log(`${threadId}: Received data from main thread:`, workerData);
setTimeout(() => {
  const result = processData(workerData);
  parentPort.postMessage(result);
  parentPort.close();
}, workerData.delay);

function processData(data) {
  // Perform some operations on the data
  return { processed: true, originalData: data, thread: threadId };
}
