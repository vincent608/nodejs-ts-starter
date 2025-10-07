import { Transform, TransformCallback } from "stream";

export class TokenBucketRateLimit extends Transform {
  private queue: any[] = [];
  private tokens: number;
  private lastRefill: number;
  private refillInterval: NodeJS.Timeout;

  constructor(private rate: number, private capacity: number = rate) {
    super({ objectMode: true });
    this.tokens = capacity;
    this.lastRefill = Date.now();

    // Refill loop (every 100ms)
    this.refillInterval = setInterval(() => this.refillTokens(), 100);
  }

  private refillTokens() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000; // in seconds
    this.lastRefill = now;

    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.rate);
    this.drainQueue();
  }

  private drainQueue() {
    while (this.tokens >= 1 && this.queue.length > 0) {
      const chunk = this.queue.shift();
      this.tokens -= 1;

      const ok = this.push(chunk);
      if (!ok) {
        this.once("drain", () => this.drainQueue());
        break;
      }
    }
  }

  _transform(
    chunk: any,
    _encoding: BufferEncoding,
    callback: TransformCallback
  ) {
    this.queue.push(chunk);
    this.drainQueue();
    callback();
  }

  _flush(callback: TransformCallback) {
    // clearInterval(this.refillInterval);
    callback();
  }
}


import { Readable } from "stream";

const source = Readable.from(
  Array.from({ length: 100 }, (_, i) => i),
  {
    objectMode: true,
  }
);

source
  .pipe(new TokenBucketRateLimit(5, 10)) // 5 TPS, burst up to 10
  .on("data", (item) => console.log("Got:", item, Date.now()));
