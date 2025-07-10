import Joi from 'joi';
import { QuestionType } from '@prediction-market/shared';

export const questionValidationSchema = Joi.object({
  marketId: Joi.string().required().min(1).max(100),
  title: Joi.string().required().min(5).max(200),
  description: Joi.string().required().min(10).max(1000),
  questionType: Joi.string().valid(
    QuestionType.BINARY,
    QuestionType.MULTIPLE_CHOICE,
    QuestionType.NUMERIC
  ).required(),
  options: Joi.array().items(
    Joi.object({
      text: Joi.string().required().min(1).max(100)
    })
  ).min(2).max(10).required()
});

export const updateQuestionSchema = Joi.object({
  title: Joi.string().min(5).max(200),
  description: Joi.string().min(10).max(1000),
  isActive: Joi.boolean(),
  options: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      text: Joi.string().required().min(1).max(100),
      probability: Joi.number().min(0).max(1),
      totalBets: Joi.number().min(0).integer(),
      totalAmount: Joi.number().min(0)
    })
  ).min(2).max(10)
}); 