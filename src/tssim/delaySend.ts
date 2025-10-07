import { Transform } from "stream";

class TimestampThrottle extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(chunk: { ts: number; }, _encoding: any, callback: () => void) {
    // Assume chunk = { ts: number, data: any }
    const now = Date.now();
    const delay = Math.max(0, chunk.ts - now);

    // Delay pushing downstream until ts
    setTimeout(() => {
      this.push(chunk);
      callback();
    }, delay);
  }
}

import { Readable } from "stream";

const source = Readable.from(
  [
    { ts: Date.now() + 1000, data: "first" },
    { ts: Date.now() + 2000, data: "second" },
    { ts: Date.now() + 3000, data: "third" },
  ],
  { objectMode: true }
);

source
  .pipe(new TimestampThrottle())
  .on("data", (item) => console.log("Processed:", item));

