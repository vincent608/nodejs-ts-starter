import fs from "fs";
const path = "input.txt";
let lastSize = 0;

function checkForNewContent() {
  try {
    const stats = fs.statSync(path);
    if (stats.size > lastSize) {
      const newContent = fs.readFileSync(path, {
        encoding: "utf8",
        start: lastSize,
      });
      console.log("New content:", newContent);
      lastSize = stats.size;
    }
  } catch (err) {
    console.error("Error reading file:", err);
  }
}

// Poll the file every second
setInterval(checkForNewContent, 1000);
