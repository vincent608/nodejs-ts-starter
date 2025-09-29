import net from "net";
import tls from "tls";
import path from "path";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import minimist from "minimist";

import { Networker } from "./networker.js";
import { handleConnect, handleData, handleClose } from "./riskServerHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// console.log(`${__dirname}/${__filename}`);
dotenv.config({ path: `${__dirname}/.env` });

const argv = minimist(process.argv.slice(2));

let debug = false;
if (argv.d != undefined) {
  debug = true;
}

let port = process.env.RISK_SERVER_PORT || 9088;
if (argv.p != undefined) {
  port = argv.p;
}

let enableTls = process.env.RISK_ENABLE_TLS || false;
if (argv.t != undefined) {
  enableTls = true;
}

let server: net.Server | tls.Server;
let connectionEvent = "connection";
if (enableTls == true) {
  const options = {
    key: readFileSync(`${process.cwd()}/cert/server-key.pem`),
    cert: readFileSync(`${process.cwd()}/cert/server-cert.pem`),
    rejectUnauthorized: false,
    enableTrace: false,
  };

  server = tls.createServer(options);
  connectionEvent = "secureConnection";
} else {
  server = net.createServer();
}

server.on(connectionEvent, (socket) => {
  socket.id = uuidv4();

  let networker = new Networker(
    socket,
    (data) => {
      handleData(networker, data, 0);
    },
    () => {
      handleClose(networker);
    }
  );

  handleConnect(socket, networker, debug);
});

server.on("error", (e) => {
  console.log("server error: ", e);
});

server.listen(port, () => {
  console.log(`Listening on port: ${port}, TLS: ${enableTls}, debug: ${debug}`);
});
