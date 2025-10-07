import fs from "fs";
import { v4 as uuidv4 } from 'uuid';

const path = "input.log";
let lastSize = 0;

const logPattern = /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) (\w+) (.*)/;
const fd = fs.openSync("input.log", "r");

function checkForNewContent() {
  try {
    const stats = fs.statSync(path);
    if (stats.size > lastSize) {
      const buffer = Buffer.alloc(stats.size - lastSize);

      const len = fs.readSync(fd, buffer, 0, buffer.length, lastSize);
      console.log("new content len: ", len);

      const newContent = buffer.toString("utf8", 0, len);
      console.log("new content: ", newContent);
      const lines = newContent.split("\n");

      lines.forEach((line) => {
        console.log("line: ", line);
        const match = logPattern.exec(line);
        if (match) {
          const [_, timestamp, logLevel, message] = match;
          console.log(
            `Timestamp: ${timestamp}, Level: ${logLevel}, Message: ${message}`
          );
          console.log("message: ", message);
          try {
            const json = JSON.parse(message);
            console.log(JSON.stringify(json, null, 2));
          } catch(e) {
            console.error("json parse error: ", e);
          }
        } else {
          // console.log("Not match content: ", line);
        }
      });

      lastSize = stats.size;
      console.log("lastSize: ", lastSize);
    }
  } catch (err) {
    console.error("Error reading file:", err);
  }
}

// Generate a UUID v4
const uuid = uuidv4();
console.log(`UUID: ${uuid}`);

// Poll the file every second
setInterval(checkForNewContent, 1000);
