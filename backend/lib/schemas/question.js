"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateQuestionSchema = exports.questionValidationSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const shared_1 = require("@prediction-market/shared");
exports.questionValidationSchema = joi_1.default.object({
    marketId: joi_1.default.string().required().min(1).max(100),
    title: joi_1.default.string().required().min(5).max(200),
    description: joi_1.default.string().required().min(10).max(1000),
    questionType: joi_1.default.string().valid(shared_1.QuestionType.BINARY, shared_1.QuestionType.MULTIPLE_CHOICE, shared_1.QuestionType.NUMERIC).required(),
    options: joi_1.default.array().items(joi_1.default.object({
        text: joi_1.default.string().required().min(1).max(100)
    })).min(2).max(10).required()
});
exports.updateQuestionSchema = joi_1.default.object({
    title: joi_1.default.string().min(5).max(200),
    description: joi_1.default.string().min(10).max(1000),
    isActive: joi_1.default.boolean(),
    options: joi_1.default.array().items(joi_1.default.object({
        id: joi_1.default.string().required(),
        text: joi_1.default.string().required().min(1).max(100),
        probability: joi_1.default.number().min(0).max(1),
        totalBets: joi_1.default.number().min(0).integer(),
        totalAmount: joi_1.default.number().min(0)
    })).min(2).max(10)
});
//# sourceMappingURL=question.js.map