import { questionsService, storageService } from './supabase-service'
import { CreateQuestionData, Question } from '@/types/supabase'

// Add a new question
export const addQuestion = async (questionData: CreateQuestionData): Promise<string> => {
  try {
    console.log('Adding question with data:', questionData)
    
    // Validate required fields
    if (!questionData.title?.trim()) {
      throw new Error('Question title is required')
    }
    
    if (!questionData.image_url?.trim()) {
      throw new Error('Question image is required')
    }
    
    if (!questionData.category?.trim()) {
      throw new Error('Question category is required')
    }
    
    const question = await questionsService.create(questionData)
    console.log('Question added successfully with ID:', question.id)
    
    return question.id
  } catch (error: any) {
    console.error('Error adding question:', error)
    throw new Error(error.message || 'Failed to add question')
  }
}

// Update a question
export const updateQuestion = async (questionId: string, updates: Partial<CreateQuestionData>): Promise<void> => {
  try {
    console.log('Updating question:', questionId, 'with data:', updates)
    
    // Validate required fields if they're being updated
    if (updates.title !== undefined && !updates.title?.trim()) {
      throw new Error('Question title is required')
    }
    
    if (updates.category !== undefined && !updates.category?.trim()) {
      throw new Error('Question category is required')
    }
    
    await questionsService.update(questionId, updates)
    console.log('Question updated successfully')
  } catch (error: any) {
    console.error('Error updating question:', error)
    throw new Error(error.message || 'Failed to update question')
  }
}

// Delete a question
export const deleteQuestion = async (questionId: string): Promise<void> => {
  try {
    console.log('Deleting question:', questionId)
    await questionsService.delete(questionId)
    console.log('Question deleted successfully')
  } catch (error: any) {
    console.error('Error deleting question:', error)
    throw new Error(error.message || 'Failed to delete question')
  }
}

// Get all questions
export const getAllQuestions = async (): Promise<Question[]> => {
  try {
    console.log('Fetching all questions')
    const questions = await questionsService.getAll()
    console.log('Fetched questions:', questions.length)
    return questions
  } catch (error: any) {
    console.error('Error getting questions:', error)
    throw new Error(error.message || 'Failed to get questions')
  }
}

// Get question by ID
export const getQuestionById = async (questionId: string): Promise<Question> => {
  try {
    console.log('Fetching question by ID:', questionId)
    const question = await questionsService.getById(questionId)
    console.log('Fetched question:', question)
    return question
  } catch (error: any) {
    console.error('Error getting question by ID:', error)
    throw new Error(error.message || 'Failed to get question')
  }
}

// Upload image and return URL
export const uploadQuestionImage = async (file: File): Promise<string> => {
  try {
    console.log('Uploading image:', file.name)
    const fileName = `${Date.now()}-${file.name}`
    const imageUrl = await storageService.uploadImage(file, fileName)
    console.log('Image uploaded successfully:', imageUrl)
    return imageUrl
  } catch (error: any) {
    console.error('Error uploading image:', error)
    throw new Error(error.message || 'Failed to upload image')
  }
}

// Helper function to validate question data
export const validateQuestionData = (data: CreateQuestionData): string[] => {
  const errors: string[] = []
  
  if (!data.title?.trim()) {
    errors.push('Question title is required')
  }
  
  if (!data.image_url?.trim()) {
    errors.push('Question image is required')
  }
  
  if (!data.category?.trim()) {
    errors.push('Question category is required')
  }
  
  return errors
} 