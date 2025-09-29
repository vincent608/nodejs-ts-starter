import debug from "debug";

debug("networker");

export class Networker {
  socket;
  dataHandler;
  closeHandler;

  #queue;
  #packet;
  #process;
  #state;
  #payloadLength;
  #bufferedBytes;

  constructor(socket, dataHandler, closeHandler = () => {}) {
    this.socket = socket;
    this.dataHandler = dataHandler;
    this.closeHandler = closeHandler;

    this.#packet = {};
    this.#process = false;
    this.#state = "HEADER";
    this.#payloadLength = 0;
    this.#bufferedBytes = 0;
    this.#queue = [];
  }

  init() {
    this.socket.on("data", (data) => {
      // console.log('recv: ' + data);
      this.#bufferedBytes += data.length;
      this.#queue.push(data);

      this.#process = true;
      this.#onData();
    });

    this.socket.on("end", () => {
      debug("socket end");
    });
    this.socket.on("close", () => {
      console.log("socket close");
      this.closeHandler();
    });
    this.socket.on("error", (e) => {
      console.log(e);
      this.closeHandler();
    });

    this.socket.on("served", this.dataHandler);
  }

  send(message) {
    let buffer = Buffer.from(message);
    this.#header(buffer.length);
    this.#packet.message = buffer;
    this.#send();
  }

  #hasEnough(size) {
    if (this.#bufferedBytes >= size) {
      return true;
    }
    this.#process = false;
    return false;
  }

  #readBytes(size) {
    let result;
    this.#bufferedBytes -= size;

    if (size === this.#queue[0].length) {
      return this.#queue.shift();
    }

    if (size < this.#queue[0].length) {
      result = this.#queue[0].slice(0, size);
      this.#queue[0] = this.#queue[0].slice(size);
      return result;
    }

    result = Buffer.allocUnsafe(size);
    let offset = 0;
    let length;

    while (size > 0) {
      length = this.#queue[0].length;

      if (size >= length) {
        this.#queue[0].copy(result, offset);
        offset += length;
        this.#queue.shift();
      } else {
        this.#queue[0].copy(result, offset, 0, size);
        this.#queue[0] = this.#queue[0].slice(size);
      }

      size -= length;
    }

    return result;
  }

  #getHeader() {
    if (this.#hasEnough(2)) {
      this.#payloadLength = this.#readBytes(2).readUInt16BE(0, true);
      this.#state = "PAYLOAD";
    }
  }

  #getPayload() {
    if (this.#hasEnough(this.#payloadLength)) {
      if (this.#payloadLength > 0) {
        let received = this.#readBytes(this.#payloadLength);
        this.socket.emit("served", received);
      }
      this.#state = "HEADER";
    }
  }

  #onData(data) {
    while (this.#process) {
      switch (this.#state) {
        case "HEADER":
          this.#getHeader();
          break;
        case "PAYLOAD":
          this.#getPayload();
          break;
      }
    }
  }

  #header(messageLength) {
    this.#packet.header = { length: messageLength };
  }

  #send() {
    let contentLength = Buffer.allocUnsafe(2);
    contentLength.writeUInt16BE(this.#packet.header.length);
    debug("write...", this.#packet);
    this.socket.write(contentLength);
    this.socket.write(this.#packet.message);
    this.#packet = {};
  }
}
