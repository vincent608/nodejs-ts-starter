import { Transform, TransformCallback } from "stream";

class RateLimit extends Transform {
  private queue: any[] = [];
  private interval: NodeJS.Timeout;

  constructor(tps: number) {
    super({ objectMode: true });

    const intervalMs = 1000 / tps;
    console.log("Interval (ms):", intervalMs);
    this.interval = setInterval(() => {
      console.log("Interval (ms):", intervalMs);
      if (this.queue.length > 0) {
        const chunk = this.queue.shift();
        console.log("Pushing:", chunk, Date.now());
        const ok = this.push(chunk);
        if (!ok) this.pause(); // wait for drain
      }
    }, intervalMs);
  }

  _transform(
    chunk: any,
    _encoding: BufferEncoding,
    callback: TransformCallback
  ) {
    this.queue.push(chunk);
    // console.log("Queued:", chunk, Date.now());
    callback();
  }

  _flush(callback: TransformCallback) {
    // clearInterval(this.interval);
    callback();
  }
}

import { Readable } from "stream";

const source = Readable.from(
  Array.from({ length: 100 }, (_, i) => i),
  { objectMode: true }
);

// console.log("Source created:", source);
source
  .pipe(new RateLimit(2)) // 2 items per second
  .on("data", (x) => console.log("Got:", x, Date.now()));
