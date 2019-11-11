import { ParserBase } from './parserBase';
import { native_t, var_t, object_t } from './typedef'

export type targ_t = var_t | apply_t | assign_t | native_t;

type tblock_t = targ_t[];

export interface assign_t extends object_t {
    type: 'assign',
    variable: string;
    exp: targ_t
}

export interface apply_t extends object_t {
    type: 'texp',
    tag: string,
    blocks: tblock_t[]
}

export class TExpParser extends ParserBase {
    constructor(src: string) {
        super(src);
    }
    // override
    skipBlank(): void {
        let idx = -1;
        while (idx != this.idx) {
            idx = this.idx;
            super.skipBlank();
            this.parseREMLine();
            this.parseREMMulline();
        }
    }

    parse(): targ_t {
        this.skipBlank();
        while (true) {
            let r = this.parseArg();
            if (r == null) {
                break;
            }
            this.skipBlank();
            if (this.parseEOF() == null) {
                this.recErr(`expect EOF here`);
                break;
            }
            this.idx = 0;
            return r;
        }
        this.idx = 0;
        return null;
    }

    parseApply(): apply_t {
        this.skipBlank();
        this.trace();
        while (true) {
            let blocks: tblock_t[] = [];
            let tag = this.parseVarable();
            if (tag == null) {
                break;
            }
            let firstBlock = this.parseBlock();
            if (firstBlock == null) break;
            blocks.push(firstBlock);
            while (true) {
                let block = this.parseBlock();
                if (block == null) break;
                blocks.push(block);
            }
            this.retrace(this.idx);
            return { type: 'texp', tag: tag.name, blocks }
        }
        this.retrace();
        return null;
    }

    parseAssign(): assign_t {
        this.skipBlank();
        this.trace();

        while (true) {
            let variable = this.parseVarable();
            if (variable == null) break;
            let eq = this.parseStr('=');
            if (eq == null) {
                this.recErr("expect '=' here");
                break;
            }
            let exp = this.parseArg();
            if (exp == null) break;
            this.retrace(this.idx);
            return { type: "assign", variable: variable.name, exp };
        }

        this.retrace();
        return null;
    }

    parseArg(): targ_t {
        let n = this.parseNumber();
        if (n !== null) return n;
        let q = this.parseQuotString();
        if (q != null) return q;
        let b = this.parseBoolean();
        if (b != null) return b;
        let e = this.parseApply();
        if (e != null) return e;
        let v = this.parseVarable();
        if (v != null) return v;
        this.recErr(`cannot find any expression here`)
        return null;
    }

    parseBlock(): tblock_t {
        this.skipBlank();
        this.trace();
        let r: tblock_t = [];
        while (true) {
            let ch = this.parseOne();
            if (ch == null) break;

            let _bracket = ')';
            if (ch == '(') _bracket = ')';
            else if (ch == '[') _bracket = ']';
            else if (ch == '{') _bracket = '}';
            else {
                this.recErr(`expect '(' here`);
                break;
            }
            let firstArg = this.parseArg();
            if (firstArg !== null) {
                r.push(firstArg);
                while (true) {
                    this.skipBlank();
                    ch = this.parseOne();
                    if (ch == null) break;
                    if ([',', ';'].indexOf(ch) == -1) {
                        this.idx--;
                    } else {
                        this.skipBlank();
                    }
                    let arg = this.parseArg();
                    if (arg == null) break;
                    r.push(arg);
                }
            }
            ch = this.parseOne();
            if (ch != _bracket) {
                this.recErr(`expect '${_bracket}' here`);
                break;
            }
            this.retrace(this.idx);
            return r;
        }
        this.retrace();
        return null;
    }
}
