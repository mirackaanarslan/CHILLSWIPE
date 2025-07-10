export interface Question {
  id: string
  title: string
  description?: string
  category: string
  image_url: string
  status: 'open' | 'closed' | 'resolved'
  created_at: string
  updated_at: string
}

export interface CreateQuestionData {
  title: string
  description?: string
  category: string
  image_url: string
} 