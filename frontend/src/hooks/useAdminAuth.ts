import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Admin {
  id: string
  email: string
  created_at: string
}

export const useAdminAuth = () => {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check if admin is logged in on mount
    const checkAuth = () => {
      const adminSession = localStorage.getItem('admin_session')
      if (adminSession) {
        try {
          const adminData = JSON.parse(adminSession)
          setAdmin(adminData)
          setIsAuthenticated(true)
        } catch (error) {
          console.error('Error parsing admin session:', error)
          localStorage.removeItem('admin_session')
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true)
      
      // Get admin from database with password
      const { data, error } = await supabase
        .from('admins')
        .select('id, email, password_hash, created_at')
        .eq('email', email)
        .single()

      if (error || !data) {
        return { success: false, error: 'Invalid credentials' }
      }

      // Check password
      if (data.password_hash !== password) {
        return { success: false, error: 'Invalid credentials' }
      }

      // Remove password from data before storing in session
      const { password_hash, ...adminData } = data
      
      // Store admin session
      localStorage.setItem('admin_session', JSON.stringify(adminData))
      setAdmin(adminData)
      setIsAuthenticated(true)
      
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Login failed' }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('admin_session')
    setAdmin(null)
    setIsAuthenticated(false)
  }

  return {
    admin,
    isAuthenticated,
    loading,
    login,
    logout
  }
} 