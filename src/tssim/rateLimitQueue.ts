import { Transform, TransformCallback } from "stream";

class RateLimitQueue extends Transform {
  rateLimit: any;
  batchSize: any;
  autoStart: boolean;
  queue: any[];
  processing: boolean;
  processedCount: number;
  lastProcessedTime: number;
  interval: number;
  
  constructor(options: any = {}) {
    super({
      objectMode: true,
      highWaterMark: options.highWaterMark || 100,
    });

    this.rateLimit = options.rateLimit || 10; // items per second
    this.batchSize = options.batchSize || 1;
    this.autoStart = options.autoStart !== false;

    this.queue = [];
    this.processing = false;
    this.processedCount = 0;
    this.lastProcessedTime = Date.now();
    this.interval = 1000 / this.rateLimit; // ms between items

    if (this.autoStart) {
      this.start();
    }
  }

  _transform(
    chunk: any,
    _encoding: BufferEncoding,
    callback: TransformCallback
  ) {
    this.queue.push(chunk);
    if (!this.processing && this.autoStart) {
      this._processQueue();
    }
    callback();
  }

  _flush(callback: TransformCallback) {
    // Process remaining items when stream ends
    if (this.queue.length > 0) {
      this._processUntilEmpty(callback);
    } else {
      callback();
    }
  }

  start() {
    this.autoStart = true;
    if (this.queue.length > 0 && !this.processing) {
      this._processQueue();
    }
  }

  stop() {
    this.autoStart = false;
  }

  _processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    this._processNext();
  }

  _processNext() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    const now = Date.now();
    const timeSinceLastProcess = now - this.lastProcessedTime;
    const delay = Math.max(0, this.interval - timeSinceLastProcess);

    setTimeout(() => {
      const items = this.queue.splice(0, this.batchSize);

      items.forEach((item) => {
        this.processedCount++;
        this.push(item);
      });

      this.lastProcessedTime = Date.now();

      if (this.queue.length > 0) {
        this._processNext();
      } else {
        this.processing = false;
      }
    }, delay);
  }

  _processUntilEmpty(callback: TransformCallback) {
    const processNext = () => {
      if (this.queue.length === 0) {
        callback();
        return;
      }

      const now = Date.now();
      const timeSinceLastProcess = now - this.lastProcessedTime;
      const delay = Math.max(0, this.interval - timeSinceLastProcess);

      setTimeout(() => {
        const items = this.queue.splice(0, this.batchSize);

        items.forEach((item) => {
          this.processedCount++;
          this.push(item);
        });

        this.lastProcessedTime = Date.now();
        processNext();
      }, delay);
    };

    processNext();
  }

  getQueueLength() {
    return this.queue.length;
  }

  getProcessedCount() {
    return this.processedCount;
  }
}

import { Readable } from "stream";

const source = Readable.from(
  Array.from({ length: 100 }, (_, i) => i),
  { objectMode: true }
);

// console.log("Source created:", source);
source
  .pipe(new RateLimitQueue({ rateLimit: 2 })) // 2 items per second
  .on("data", (x) => console.log("Got:", x, Date.now()));
