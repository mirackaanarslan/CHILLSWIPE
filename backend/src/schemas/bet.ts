import Joi from 'joi';
 
export const placeBetValidationSchema = Joi.object({
  questionId: Joi.string().required().min(1).max(100),
  optionId: Joi.string().required().min(1).max(100),
  amount: Joi.number().required().min(0.1).max(10000) // Minimum 0.1 CHZ, Maximum 10,000 CHZ
}); 