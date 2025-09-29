import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import moment from 'moment';
import xml2js from 'xml2js';

export const timestamp = () => {
  return moment().format('YY.MM.DD HH:mm:ss.SSS: ');
}

export const getRecordType = (datafile: string) => {
  const match = datafile.match(/(?<=[_]).*(?=[\.])/);
  return match ? match[0] : "";
}

// Convert a hex string to a byte array
export function hexToBytes(hex: string): number[] {
  let bytes: number[] = [];
  for (let c = 0; c < hex.length; c += 2)
      bytes.push(parseInt(hex.substr(c, 2), 16));
  return bytes;
}

// Convert a byte array to a hex string
export function bytesToHex(bytes: number[]): string {
  let hex = [];
  for (let i = 0; i < bytes.length; i++) {
      let current = bytes[i] < 0 ? bytes[i] + 256 : bytes[i];
      hex.push((current >>> 4).toString(16));
      hex.push((current & 0xF).toString(16));
  }
  return hex.join("");
}

export function hexdump(buffer: string, blockSize = 16): string {
  blockSize = blockSize || 16;
  let lines: string[] = [];
  let hex = "0123456789ABCDEF";
  for (let b = 0; b < buffer.length; b += blockSize) {
    let block = buffer.slice(b, Math.min(b + blockSize, buffer.length));
    let addr = ("00000" + b.toString(16)).slice(-5);
    let codes = block.split('').map(function (ch) {
      let code = ch.charCodeAt(0);
      return " " + hex[(0xF0 & code) >> 4] + hex[0x0F & code];
    }).join("");
    codes += "   ".repeat(blockSize - block.length);
    let chars = block.replace(/[\x00-\x1F\x20]/g, '.');
    chars += " ".repeat(blockSize - block.length);
    lines.push(addr + " " + codes + " | " + chars);
  }
  return lines.join("\n");
}

export function toHex(str: string): string {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    result += str.charCodeAt(i).toString(16);
  }
  return result;
}

export function loadCsv(csvfile: string, options = {
  delimiter: ',',
  columns: true,
  skip_empty_lines: true
}) {
  let csvStr = readFileSync(csvfile, 'utf8');
  return parseCsv(csvStr, options);
}

export function parseCsv(csvStr: string, options: any) {
  let csvData = parse(csvStr, options);
  return csvData;
}

const parserOptions = {
  normalize: true, // Trim whitespace inside text nodes
  normalizeTags: false, // Transform tags to lowercase
  explicitArray: false // Only put nodes in array if >1
};

const parser = new xml2js.Parser(parserOptions);
// const builder = new xml2js.Builder();

export function parseXml(xml: string) {
  let json = {};
  parser.parseString(xml, (err, result) => {
    json = result;
  });
  return json;
};

export function sleep(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

const SPACE = " ";
const NONE_COL = 0;
const OFFSET_COL = 1;
const HEX_COL = 2;
const TEXT_COL = 3;

export function parseHexLine(line: string) {
  const arr: number[] = [];
  const cols = line.split("");
  let state = NONE_COL;

  for (let i = 0, len = cols.length; i < len; i++) {
    const char = cols[i];

    if (state === NONE_COL && char === SPACE) {
      continue;
    }

    if (state === NONE_COL && char !== SPACE) {
      state = OFFSET_COL;
      continue;
    }

    if (state === OFFSET_COL && char !== SPACE) {
      continue; // ignore offset col
    }

    if (state === OFFSET_COL && char === SPACE) {
      state = HEX_COL;
      i++; // two cols are seperating
      continue;
    }

    if (state === HEX_COL && char !== SPACE && char !== "|") {
      let hex = "";

      while (cols[i] !== SPACE) {
        hex += cols[i];
        i++;
      }

      arr.push(parseInt(hex, 16));
      continue;
    }

    if (state === HEX_COL && char === SPACE) {
      continue;
    }

    if (state === HEX_COL && char === "|") {
      state = TEXT_COL;
      continue;
    }

    if (state === TEXT_COL) {
      continue; // ignore text col
    }

    throw new Error("unexpected char " + JSON.stringify(char)
      + " in state " + state);
  }

  return arr;
}

export function parseHex(input: string) {
  const arr: number[] = [];
  const lines = input.split("\n");

  if (lines.length > 0) {
    lines.forEach(line => {
      if (line.match(/^([\s\da-fA-F]+)\s+([ \da-fA-F]+)/) != null) {
        arr.push(...parseHexLine(line));
      }
    });
  }
  return Uint8Array.from(arr);
}

// const ISTDumpDataReg = /(?<=Data\(.*\):\n)([\s\S]*)/

export function loadHexDump(dumpfile: string) {
  let dump = readFileSync(dumpfile);
  // let hstr = dump.toString().match(ISTDumpDataReg)[0];
  let reqdata = parseHex(dump.toString());
  return reqdata;
}

// const CommentReg = /\#*[\s\S]*?\*\#|([^:]|^)\#.*$/gm
// const SpaceTabReg = /(?:( |\t)*( |\t))/g
// const TabReg = /(?:(\t)*(\t))/g

export function loadVal(valfile: string) {
  let valStr = readFileSync(valfile).toString();
  let r = /\#*[\s\S]*?\*\#|([^:]|^)\#.*$/gm
  valStr = valStr.replace(r, '');
  // valStr = valStr.toString().replace(/["']/g, '');
  let lines = valStr.split('\n');
  let jsonObj: { [key: string]: string } = {};
  lines.forEach(line => {
    if (line.length === 0) {
      return;
    }
    let len = line.length;
    let tl = line;
    let arr = [];
    let m = null;
    while (len > 0) {
      if ((m = tl.match(/^"([^"]*)"\s*/g))
        || (m = tl.match(/^'([^']*)'\s*/g))
        || (m = tl.match(/^(\S+)\s*/g))) {
        arr.push(m[0].trim().replace(/["']/g, ''));
        if (m[0].length < len) {
          tl = tl.substring(m[0].length)
          len -= m[0].length;
          continue;
        } else {
          break;
        }
      } else {
        console.log('no match: ', line);
        break;
      }
    }
    if (arr.length == 2) {
      jsonObj[arr[0]] = arr[1];
    } else {
      console.log('bad line: ', arr);
    }
  });
  // console.log(JSON.stringify(jsonObj, null, 2));
  return jsonObj;
}
