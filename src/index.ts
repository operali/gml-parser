
import { TExpParser, targ_t } from './TExpParser'
import { marginLeft } from './util';

let _lastError = "";
let _parser = null;
export const fromString = (script: string): targ_t => {
    if (typeof (script) != 'string') {
        _lastError = "parse script of non-string";
        return null;
    }
    try {
        _parser = new TExpParser(script);
        let r = _parser.parse();
        if (r == null) {
            _lastError = _parser.reportErr();
        }
        return r;
    } catch (ex) {
        _lastError = '' + ex;
        return null;
    }
}


export const getLastError = () => {
    return _lastError;
}

interface option_t {
    indent: number
}

const defaultOption: option_t = {
    indent: 4
}

export const toString = (app: targ_t, option?: option_t): string => {
    if (option == undefined) {
        option = defaultOption;
    }
    if (typeof (app) == "string") {
        return `'${app}'`;
    } else if (typeof (app) == "number") {
        return app.toString();
    } else if (typeof (app) == "boolean") {
        return app.toString();
    } else if (typeof (app) == "object") {
        if (app.type == "var") {
            return app.name;
        } else if (app.type == 'assign') {
            return `${app.variable} = ${toString(app.exp, option)}`;
        } else if (app.type == 'texp') {
            let blocks: string[] = [];
            for (let b of app.blocks) {
                if (b.length == 0) {
                    blocks.push(`()`);
                } else if (b.length == 1) {
                    blocks.push(`( ${toString(b[0])} )`);
                } else {
                    let strArgs: string[] = [];
                    for (let arg of b) {
                        strArgs.push(marginLeft(toString(arg), option.indent));
                    }
                    blocks.push(`(\n${strArgs.join('\n')} )`);
                }
            }
            return `${app.tag} ${blocks.join(' ')}`;
        }
        return null;
    }
    return null;
}
