// worker.js
const { parentPort } = require("worker_threads");

parentPort.on("message", (data) => {
  console.log("Worker: Received data from main thread:", data);
  // Process the data
  const result = processData(data);
  // Send the result back to the main thread
  parentPort.postMessage(result);
  
  parentPort.close();
});

function processData(data) {
  // Perform some operations on the data
  return { processed: true, originalData: data };
}
