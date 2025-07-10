"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.placeBetValidationSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.placeBetValidationSchema = joi_1.default.object({
    questionId: joi_1.default.string().required().min(1).max(100),
    optionId: joi_1.default.string().required().min(1).max(100),
    amount: joi_1.default.number().required().min(0.1).max(10000) // Minimum 0.1 CHZ, Maximum 10,000 CHZ
});
//# sourceMappingURL=bet.js.map