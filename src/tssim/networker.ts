import debug from "debug";

debug("networker");
export type DataHandler = (data: Buffer) => void;
export type CloseHandler = () => void;
type Packet = { header?: { length: number }; message?: Buffer };

export class Networker {
  private socket: any;
  private dataHandler: DataHandler;
  private closeHandler: CloseHandler;

  private queue: Buffer[];
  private packet: Packet;
  private process: boolean;
  private state: "HEADER" | "PAYLOAD";
  private payloadLength: number;
  private bufferedBytes: number;

  constructor(
    socket: any,
    dataHandler: DataHandler,
    closeHandler: CloseHandler = () => {}
  ) {
    this.socket = socket;
    this.dataHandler = dataHandler;
    this.closeHandler = closeHandler;

    this.packet = {};
    this.process = false;
    this.state = "HEADER";
    this.payloadLength = 0;
    this.bufferedBytes = 0;
    this.queue = [];
  }

  public init(): void {
    this.socket.on("data", (data: Buffer) => {
      // console.log('recv: ' + data);
      this.bufferedBytes += data.length;
      this.queue.push(data);

      this.process = true;
      this.onData();
    });

    this.socket.on("end", () => {
      debug("socket end");
    });
    this.socket.on("close", () => {
      console.log("socket close");
      this.closeHandler();
    });
    this.socket.on("error", (e: Error) => {
      console.log(e);
      this.closeHandler();
    });

    this.socket.on("served", this.dataHandler);
  }

  public send(message: string): void {
    let buffer = Buffer.from(message);
    this.header(buffer.length);
    this.packet.message = buffer;
    this.write();
  }

  public getSocket(): any {
    return this.socket;
  }

  public close(): void {
    this.socket.end();
  }

  public destroy(): void {
    this.socket.destroy();
  }

  private hasEnough(size: number): boolean {
    if (this.bufferedBytes >= size) {
      return true;
    }
    this.process = false;
    return false;
  }

  private readBytes(size: number): Buffer | undefined {
    let result: Buffer;
    this.bufferedBytes -= size;
    if (size === this.queue[0].length) {
      return this.queue.shift();
    }

    if (size < this.queue[0].length) {
      result = this.queue[0].subarray(0, size);
      this.queue[0] = this.queue[0].subarray(size);
      return result;
    }

    result = Buffer.allocUnsafe(size);
    let offset: number = 0;
    let length: number;

    while (size > 0) {
      length = this.queue[0].length;

      if (size >= length) {
        // this.queue[0].copy(new Uint8Array(result), offset);
        this.queue[0].copy(result as Uint8Array, offset);

        offset += length;
        this.queue.shift();
      } else {
        // this.queue[0].copy(new Uint8Array(result), offset, 0, size);
        this.queue[0].copy(result as Uint8Array, offset, 0, size);

        this.queue[0] = this.queue[0].subarray(size);
        offset += size;
      }

      size -= length;
    }

    return result;
  }

  private getHeader(): void {
    if (this.hasEnough(2)) {
      const headerBuf = this.readBytes(2);
      if (headerBuf) {
        this.payloadLength = headerBuf.readUInt16BE(0);
        this.state = "PAYLOAD";
      }
    }
  }

  private getPayload() {
    if (this.hasEnough(this.payloadLength)) {
      if (this.payloadLength > 0) {
        let received = this.readBytes(this.payloadLength);
        this.socket.emit("served", received);
      }
      this.state = "HEADER";
    }
  }

  private onData(): void {
    while (this.process) {
      switch (this.state) {
        case "HEADER":
          this.getHeader();
          break;
        case "PAYLOAD":
          this.getPayload();
          break;
      }
    }
  }

  private header(messageLength: number): void {
    this.packet.header = { length: messageLength };
  }

  private write(): void {
    let contentLength: Buffer = Buffer.allocUnsafe(2);
    if (this.packet.header && typeof this.packet.header.length === "number") {
      contentLength.writeUInt16BE(this.packet.header.length);
    } else {
      throw new Error("Packet header is undefined or missing length");
    }
    debug("write... " + JSON.stringify(this.packet));
    this.socket.write(new Uint8Array(contentLength), (err?: Error) => {});
    if (this.packet.message) {
      this.socket.write(
        new Uint8Array(this.packet.message),
        (err?: Error) => {}
      );
    }
    this.packet = {};
  }
}
