import fs from "fs";

export type LineCallback = (line: string) => void;

function watchFileLines(filePath: string, onLine: LineCallback) {
  // Start from current file size (so we only get new lines)
  let position = fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;
  let buffer : string = "";

  const stream = fs.createReadStream(filePath, {
    encoding: "utf8",
    start: position,
    flags: "r",
  });

  stream.on("data", (chunk) => {
    buffer += chunk;
    const lines : string[] = buffer.split("\n");

    // Keep last partial line in buffer
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line.trim()) onLine(line);
    }

    // Update read position
    position += Buffer.byteLength(chunk, "utf8");
  });

  stream.on("error", (err) => {
    console.error("Error watching file:", err);
  });

  return stream; // so you can .close() if needed
}
