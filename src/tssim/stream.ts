// Filename - index.js

// Node.js program to demonstrate the
// fs.createReadStream() method
import { createReadStream, ReadStream } from "fs";

const options: any = {
  flag: "rs+",
  start: 0,
  autoClose: false,
  emitClose: false,
  highWaterMark: 16,
};
const reader: ReadStream = createReadStream("input.txt", options);

// Read and display the file data on console
reader.on("data", function (chunk: any) {
  console.log(chunk.toString());
});

reader.on("end", () => {
  console.log("read end");
});
