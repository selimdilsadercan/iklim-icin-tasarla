import { supabase } from './supabase'

export class UserRoleService {
  /**
   * Get user role from the database using Supabase ORM
   */
  static async getUserRole(userId: string): Promise<string | null> {
    try {
      console.log('UserRoleService: Fetching role for user:', userId)
      
      const { data, error } = await supabase
        .rpc('get_user_role', { user_id_param: userId })

      console.log('UserRoleService: SQL function result:', { data, error })

      if (error) {
        console.error('UserRoleService: Database error:', error)
        return null
      }

      const role = data || null
      console.log('UserRoleService: Resolved role:', role)
      
      // If no role found, this might be a new user or the user doesn't exist in user_roles table
      if (!role) {
        console.log('UserRoleService: No role found for user, this might be a new user')
      }
      
      return role
    } catch (error) {
      console.error('UserRoleService: Exception:', error)
      return null
    }
  }

  /**
   * Check if user is admin
   */
  static async isAdmin(userId: string): Promise<boolean> {
    const role = await this.getUserRole(userId)
    return role === 'admin'
  }

  /**
   * Check if user is teacher
   */
  static async isTeacher(userId: string): Promise<boolean> {
    const role = await this.getUserRole(userId)
    return role === 'teacher'
  }

  /**
   * Check if user is student
   */
  static async isStudent(userId: string): Promise<boolean> {
    const role = await this.getUserRole(userId)
    return role === 'student'
  }

}
