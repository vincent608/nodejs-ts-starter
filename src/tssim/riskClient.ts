import net from 'net';
import tls from "tls";
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { Networker } from './networker.js';
import minimist from 'minimist';

import { handleConnect, handleData, handleClose } from './riskClientHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// console.log(`${__dirname}/${__filename}`);
dotenv.config({path: `${__dirname}/.env`, quiet: true});

const argv = minimist(process.argv.slice(2));

let delay = 1000;
if (argv.s) {
  delay = argv.s;
}

let debug = false;
if (argv.d) {
  debug = true;
}

let hostname = process.env.RISK_SERVER_HOST || 'localhost';
if (argv.h) {
  hostname = argv.h;
}

let port = process.env.RISK_SERVER_PORT || 9088;
if (argv.p) {
  port = argv.p;
}

let enableTls = process.env.RISK_ENABLE_TLS || false;
if (argv.t != undefined) {
  enableTls = true;
}

let datafile = 'work.json';
if (argv.f) {
  datafile = argv.f;
} else {
  console.error('Error: Datafile is required. Use: [-f datafile]');
  process.exit(1);
}

console.log(`hostname: ${hostname}, port: ${port}, TLS: ${enableTls}, data: ${datafile}, delay: ${delay}, debug: ${debug}`);

let socket = null;
if (enableTls === true) {
  console.log("enable TLS");
  const options: tls.ConnectionOptions = {
    host: hostname,
    port: port as number,
    rejectUnauthorized: false,
    enableTrace: false
  };
  socket = tls.connect(options);
} else {
  socket = net.createConnection({ port: port, host: hostname } as net.NetConnectOpts);
}

socket.on('connect', () => {
  // if (socket.connecting) {
  //   console.log('connecting ...')
  // } else {
  //   console.log('connected');
  // }
});

socket.on('ready', () => {
  let networker = new Networker(socket,
    (data) => handleData(networker, data),
    () => handleClose());

  networker.init();
  handleConnect(networker, datafile, delay, debug);
});

socket.setTimeout(1000 * 30);
socket.on('timeout', () => {
  console.log('socket timed out!');
  handleClose();
  process.exit(1);
});
