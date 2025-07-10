import { supabase } from './supabase'
import { Question, CreateQuestionData } from '@/types/supabase'

// Questions CRUD operations
export const questionsService = {
  // Get all questions
  async getAll(): Promise<Question[]> {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching questions:', error)
      throw error
    }
    return data || []
  },

  // Get question by ID
  async getById(id: string): Promise<Question> {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching question by ID:', error)
      throw error
    }
    return data
  },

  // Create new question
  async create(questionData: CreateQuestionData): Promise<Question> {
    const { data, error } = await supabase
      .from('questions')
      .insert([questionData])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating question:', error)
      throw error
    }
    return data
  },

  // Update question
  async update(id: string, updates: Partial<CreateQuestionData>): Promise<Question> {
    const { data, error } = await supabase
      .from('questions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating question:', error)
      throw error
    }
    return data
  },

  // Delete question
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting question:', error)
      throw error
    }
  }
}

// Storage operations
export const storageService = {
  // Upload image to storage
  async uploadImage(file: File, fileName: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('question-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) {
      console.error('Storage upload error:', error)
      throw error
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('question-images')
      .getPublicUrl(data.path)
    
    return urlData.publicUrl
  },

  // Delete image from storage
  async deleteImage(fileName: string): Promise<void> {
    const { error } = await supabase.storage
      .from('question-images')
      .remove([fileName])
    
    if (error) {
      console.error('Storage delete error:', error)
      throw error
    }
  }
} 