"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openListDelimiters = ['(', '['];
exports.closeListDelimiters = [')', ']'];
exports.listDelimiters = [
    ...exports.openListDelimiters,
    ...exports.closeListDelimiters,
];
exports.stopChars = [...exports.listDelimiters, ' ', '\n', '\t'];
exports.avoidChars = [' ', '\n', '\t'];
exports.stringDelimiters = [`'`, '"'];
exports.tokenize = code => {
    let tokens = [];
    let chars = code.split('');
    let token = '';
    let stringFlag = false;
    for (let i = 0, char; char = chars[i]; i++) {
        if (stringFlag || exports.stopChars.indexOf(char) === -1) {
            if (exports.stringDelimiters.indexOf(char) !== -1) {
                stringFlag = !stringFlag;
            }
            if (stringFlag || exports.avoidChars.indexOf(char) === -1) {
                token += char;
            }
        }
        else {
            if (token !== '') {
                tokens.push(token);
            }
            if (exports.avoidChars.indexOf(char) === -1) {
                tokens.push(char);
            }
            token = '';
        }
    }
    tokens = tokens;
    return tokens;
};
//# sourceMappingURL=tokenizer.js.map