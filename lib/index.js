"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parser_1 = require("./parser");
const tokenizer_1 = require("./tokenizer");
const interpreter_1 = require("./interpreter");
function getAst(code) {
    return parser_1.parse(tokenizer_1.tokenize(code));
}
exports.getAst = getAst;
exports.run = env => {
    let _evalAst = interpreter_1.evalAst(interpreter_1.makeAPI(env));
    return code => _evalAst(getAst(code));
};
//# sourceMappingURL=index.js.map