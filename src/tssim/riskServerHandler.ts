import { hexdump, timestamp } from "./util.js";
import { Networker } from "./networker.js";
import { RiskReq } from "./riskReqResp.js";

let clients: { socket: any; networker: Networker }[] = [];
let isHex = false;
let respCount = 0;

export const handleConnect = (
  socket: any,
  networker: Networker,
  debug: boolean
) => {
  isHex = debug;
  console.log("Client arrived: ", socket.id);
  networker.init();
  clients.push({ socket, networker });
  console.log("num of client: ", clients.length);
};

export const sendResp = (networker: Networker, resp: Buffer) => {
  networker.send(resp.toString());
};

export const handleData = (
  networker: Networker,
  data: Buffer,
  delay: number
) => {
  const reqObj = parseRiskReq(data);
  console.log(
    timestamp() + "Received: len: " + data.length + ", uuid: " + reqObj.uuid
  );
  if (isHex) {
    console.log(hexdump(data.toString()));
    console.log(JSON.stringify(reqObj, null, 2));
  }

  const resp = createRiskResp(reqObj);
  console.log(timestamp() + "Response: len: " + resp.length);
  if (isHex) {
    console.log(hexdump(resp.toString()));
  }
  setTimeout(sendResp, delay, networker, resp);
};

export const parseRiskReq = (dataBuf: Buffer): RiskReq => {
  const obj: RiskReq = {
    uuid: "",
    pan: "",
    score: "",
    scoreType: "",
    startDate: "",
    endDate: "",
    portfolio: "",
  };
  let idx = 0;

  const uuid = dataBuf.subarray(idx, idx + 36);
  // console.log('uuid: ', uuid.toString());
  obj["uuid"] = uuid.toString();
  idx += 36;
  const pan = dataBuf.subarray(idx, idx + 20);
  // console.log(pan.toString());
  obj["pan"] = pan.toString();
  idx += 20;
  // console.log(pan.toString());
  const score = dataBuf.subarray(idx, idx + 3);
  obj["score"] = score.toString();
  idx += 3;
  const scoreType = dataBuf.subarray(idx, idx + 1);
  obj["scoreType"] = scoreType.toString();
  idx += 1;

  const startDate = dataBuf.subarray(idx, idx + 20);
  obj["startDate"] = startDate.toString();
  idx += 20;

  const endDate = dataBuf.subarray(idx, idx + 20);
  obj["endDate"] = endDate.toString();
  idx += 20;

  const portfolio = dataBuf.subarray(idx, idx + 14);
  obj["portfolio"] = portfolio.toString();
  idx += 14;

  return obj;
};

export const createRiskResp = (reqObj: RiskReq) => {
  const payload = Buffer.allocUnsafe(36 + 8);

  Buffer.from(reqObj.uuid.padEnd(36)).copy(payload as Uint8Array, 0);
  if (respCount > 1000) {
    respCount = 0;
  }
  respCount++;
  Buffer.from(respCount.toString().padEnd(8)).copy(payload as Uint8Array, 36);
  return payload;
};

export const handleClose = (networker: Networker) => {
  console.log("Client left: ", networker.getSocket().id);
  clients = clients.filter(
    (item) => item.socket.id !== networker.getSocket().id
  );
};
