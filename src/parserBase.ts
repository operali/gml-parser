import {
    isBlank, bSearch
} from "./util";
import { var_t } from "./typedef";

export class ParserBase {
    src: string;
    stateStk: number[]
    idx: number;
    rcMap: [number, number][]
    lastErrIdx: number;
    lastErr: string;

    constructor(src: string) {
        this.lastErrIdx = 0;
        this.src = src;
        this.stateStk = [];
        this.idx = 0;
        this.rcMap = [];
        this.lastErrIdx = 0;
        this.lastErr = null;
        this.buildRcMap();
    }

    buildRcMap() {
        let start = 0;
        let len = this.src.length;
        for (let i = 0; i < len; ++i) {
            let ch = this.src[i];
            if (ch == '\n') {
                this.rcMap.push([start, i]);
                start = i + 1;
            }
        }
        if (start !== len) {
            this.rcMap.push([start, len]);
        }
    }

    curChar() {
        return this.src[this.idx];
    }

    idx2rowcol(idx: number) {
        let rcidx = bSearch(this.rcMap, idx, (idx, range) => {
            if (idx > range[1]) return true;
            return false;
        })
        let range = this.rcMap[rcidx];
        return [rcidx, idx - range[0]];
    }


    recErr(str: string, idx?: number) {
        if (idx == undefined) idx = this.idx - 1;
        if (idx >= this.lastErrIdx) {
            this.lastErr = str;
            this.lastErrIdx = idx;
        }
        // console.warn(this.reportErr())
    }

    reportErr(): string {
        if (this.lastErr != null) {
            let [row, col] = this.idx2rowcol(this.lastErrIdx);
            let [l, r] = this.rcMap[row];
            let line = this.src.substring(l, r);
            let pLine = new Array<string>(col).fill(' ').join('') + '^';
            return `\n${line}\n${pLine}\n${this.lastErr}\n at (${row + 1}:${col + 1})`;
        }
        return null;
    }

    trace() {
        this.stateStk.push(this.idx);
    }

    retrace(idx: number = -1) {
        let traceStk = this.stateStk;
        if (traceStk.length == 0) {
            throw `trace/retrace no match, length: ${this.stateStk.length}`
        }
        if (idx != -1) {
            traceStk.pop();
            this.idx = idx;
        } else {
            this.idx = traceStk.pop();
        }
    }

    parseOne() {
        if (this.src.length == this.idx) return null;
        let r = this.src[this.idx++];
        return r;
    }
    parseEOF() {
        let src = this.src;
        if (src.length == this.idx) return true;
        return null;
    }

    skipBlank(): void {
        for (; this.idx < this.src.length; ++this.idx) {
            if (!isBlank(this.src[this.idx])) {
                return;
            }
        }
    }

    parseREMLine(): boolean {
        let idx = this.idx;
        let src = this.src;

        let ch = src[idx++];
        if (ch != '/') return null;
        ch = src[idx++];
        if (ch != '/') return null;
        while (true) {
            ch = src[idx++];
            if (ch == '\n') {
                this.idx = idx;
                return true;
            }
            if (ch == undefined) {
                this.idx = idx;
                return true;
            }
        }
    }

    parseREMMulline(): boolean {
        let idx = this.idx;
        let src = this.src;

        let ch = src[idx++];
        if (ch != '/') return null;
        ch = src[idx++];
        if (ch != '*') return null;
        while (true) {
            ch = src[idx++];
            if (ch == '*') {
                ch = src[idx++];
                if (ch == '/') {
                    this.idx = idx;
                    return true;
                } else {
                    idx--;
                    continue;
                }
            }
            if (ch == undefined) {
                this.recErr('no finished recommend');
                return null;
            }
        }
    }

    parseStr(str: string): string {
        this.skipBlank();
        let src = this.src;
        let idx = this.idx;
        for (let strIdx = 0; strIdx < str.length; ++strIdx, ++idx) {
            let srcch = src[idx];
            let strch = str[strIdx];
            if (srcch != strch) {
                return null;
            }
        }
        this.idx = idx;
        return str;
    }

    parseQuotString(): string {
        let s = this.parseStr("'");
        if (s == null) {
            return null;
        }
        let start = this.idx;
        let rst = this.parseUntillChars(["'"]);
        if (!rst) {
            return null;
        } else {
            let r = this.src.substring(start, this.idx);
            this.idx++;
            return r;
        }
    }

    parseUntillChars(chs: string[]): boolean {
        let src = this.src;
        let idx = this.idx;
        for (; idx < src.length; ++idx) {
            let ch1 = src[idx];
            if (chs.indexOf(ch1) != -1) {
                this.idx = idx;
                return true;
            }
        }
        return null;
    }

    parseBoolean(): boolean {
        this.skipBlank();
        let src = this.src;
        let idx = this.idx;
        if (src.startsWith("true", idx)) {
            this.idx = idx + 4;
            return true;
        } else if (src.startsWith("false", idx)) {
            this.idx = idx + 5;
            return false;
        }
        return null;
    }

    parseVarable(): var_t {
        this.skipBlank();
        let src = this.src;
        let idx = this.idx;
        let start = this.idx;
        for (; idx < src.length; ++idx) {
            let ch = src[idx];
            if (ch == '_') {
                continue;
            } else if ((ch <= 'z' && ch >= 'a') ||
                (ch <= 'Z' && ch >= 'A')) {
                continue;
            } else if (ch <= '9' && ch >= '0') {
                if (idx == start) {
                    return null;
                }
                continue;
            } else {
                if (idx != start) {
                    this.idx = idx;
                    return { type: 'var', name: this.src.substring(start, idx) };
                }
                break;
            }
        }
        if (idx != start) {
            this.idx = idx;
            return { type: 'var', name: this.src.substring(start, idx) };
        }
        return null;
    }

    parseNumber(): number {
        this.skipBlank();
        let src = this.src;
        let idx = this.idx;
        let state: ('flag' | 'int' | 'float') = 'flag';
        let flag = 1; // 1 or -1
        let r = 0;
        let pointCount = 10; // 
        let numberCount = 0;
        for (; idx < src.length; ++idx) {
            let ch = src[idx];
            if (state == 'flag') {
                if (ch == '+') {
                    state = 'int';
                } else if (ch == '-') {
                    flag = -1;
                    state = 'int';
                } else if (ch >= '0' && ch <= '9') {
                    state = 'int';
                    idx--;
                } else {
                    return null;
                }
            } else if (state == 'int') {
                if (ch >= '0' && ch <= '9') {
                    numberCount++;
                    r = r * 10 + parseInt(ch);
                } else {
                    if (numberCount == 0) {
                        return null;
                    }
                    if (ch == '.') {
                        state = 'float';
                    } else {
                        this.idx = idx;
                        return r * flag;
                    }
                }
            } else if (state == 'float') {
                if (ch >= '0' && ch <= '9') {
                    let p = Number(ch) / pointCount;
                    r = r + p;
                    pointCount = pointCount * 10;
                } else {
                    this.idx = idx;
                    return r * flag;
                }
            }
        }
        if (state != 'int' && state != 'float') {
            return null;
        }
        this.idx = idx;
        return r * flag;
    }
}
