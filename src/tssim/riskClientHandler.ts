import moment from "moment";
import { readFileSync } from "fs";
import { v4 as uuidv4 } from 'uuid';

import { timestamp, hexdump } from "./util.js";
import { RiskReq, RiskResp } from "./riskReqResp.js";
import { Networker } from "./networker.js";

const recordType = "00";

let isHex = false;
let nRun : number = 0;
let nSend : number = 0;
let nRecv : number = 0;

let respCount = 0;

/**
 * Loads and processes JSON data from a file, replacing placeholders with the current date and time.
 *
 * @param {string} dataFile - The path to the JSON file to be loaded.
 * @returns {Object} The parsed JSON object with placeholders replaced by the current date and time.
 */
const loadData = (dataFile: string) => {
  let jsonStr : string = readFileSync(`${process.cwd()}/${dataFile}`, "utf8");

  const d = new Date();

  const mmdd = moment(d).format("MMDD");
  const hhmmss = moment(d).format("HHmmss");
  const yyyymmdd = moment(d).format("YYYYMMDD");

  jsonStr = jsonStr
    .replaceAll("@MMDD@", mmdd)
    .replaceAll("@HHMMSS@", hhmmss)
    .replaceAll("@YYYYMMDD@", yyyymmdd);
  // console.log(jsonStr);
  return JSON.parse(jsonStr);
};

export const createRiskReq = (reqObj: RiskReq) => {
  reqObj.uuid = uuidv4();
  let uuid = Buffer.from(reqObj.uuid.padEnd(36));
  let pan = Buffer.from(reqObj.pan.padEnd(20));
  let score = Buffer.from(reqObj.score.padEnd(3));
  let scoreType = Buffer.from(reqObj.scoreType.padEnd(1));
  let startDate = Buffer.from(reqObj.startDate.padEnd(20));
  let endDate = Buffer.from(reqObj.endDate.padEnd(20));
  let portfolio = Buffer.from(reqObj.portfolio.padEnd(14));

  return Buffer.concat([
    uuid,
    pan,
    score,
    scoreType,
    startDate,
    endDate,
    portfolio,
  ]);
};

export const createRiskResp = (reqObj: any) => {
  let payload = Buffer.allocUnsafe(36 + 8);

  Buffer.from(reqObj.uuid.padEnd(36)).copy(payload, 0);
  if (respCount > 1000) {
    respCount = 0;
  }
  respCount++;
  Buffer.from(respCount.toString().padEnd(8)).copy(payload, 36);
  return payload;
};

export const parseRiskResp = (dataBuf: Buffer) => {
  let obj : RiskResp = {
    uuid: "",
    respCode: "",
  };
  
  let idx = 0;

  let uuid = dataBuf.subarray(idx, idx + 36);
  // console.log('uuid: ', uuid.toString());
  obj["uuid"] = uuid.toString();
  idx += 36;
  let respCode = dataBuf.subarray(idx, idx + 8);
  // console.log(respCode.toString());
  obj["respCode"] = respCode.toString();

  return obj;
};

export const handleData = (networker : Networker, data: Buffer) => {
  let respObj = parseRiskResp(data);
  console.log(
    timestamp() +
      "Received: " +
      nRecv +
      ", len: " +
      data.length
  );
  nRecv++;
  if (isHex) {
    console.log(hexdump(data.toString()));
  }
  console.log(JSON.stringify(respObj, null, 2));
  if (nRecv >= nRun) {
    networker.destroy();
  }
};

const sendMsg = (doc: RiskReq, networker: Networker, idx: number) => {

  let msg = createRiskReq(doc);
 
  console.log(
    timestamp() + "Send: " + idx + ", len: " + msg.length
  );
  if (isHex) {
    console.log(hexdump(msg.toString()));
  }
  console.log(JSON.stringify(doc, null, 2));
  networker.send(msg.toString());
  nSend++;
};

const processMsg = (docs: RiskReq[], delay: number, networker: Networker, idx: number) => {
  // console.log('idx: ' + idx + ', run: ' + nRun);
  sendMsg(docs[idx], networker, idx);
  idx++;
  if (idx < nRun) {
    setTimeout(processMsg, delay, docs, delay, networker, idx);
  }
};

export const handleConnect = (networker: Networker, datafile: string, delay: number, debug = false) => {
  isHex = debug;
  let data = loadData(datafile);
  // console.log(JSON.stringify(data));
  let j = 0;
  if (Array.isArray(data)) {
    nRun = data.length;
    processMsg(data, delay, networker, j);
  } else {
    // single object
    // console.log('single run');
    nRun = 1;
    sendMsg(data, networker, j);
  }
};

export const handleClose = (parentPort = undefined) => {
  console.log(timestamp() + "Send: " + nSend + ", Recv: " + nRecv);
  // if (parentPort !== undefined) {
  //   parentPort.postMessage({ send: nSend, recv: nRecv });
  // }
};
