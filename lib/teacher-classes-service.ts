import { supabase } from "./supabase";

export interface TeacherClass {
  id: string;
  name: string;
  created_at: string;
  is_active: boolean;
  student_count: number;
  conversation_count: number;
  last_message_date?: string | null;
}

export interface ClassStudent {
  user_id: string;
  email: string;
  display_name: string;
  role: string;
  class_name?: string;
  total_conversations: number;
  yaprak_conversations: number;
  robi_conversations: number;
  bugday_conversations: number;
  damla_conversations: number;
  last_message_date?: string | null;
}

export interface ClassInfo {
  id: string;
  name: string;
  created_at: string;
  student_count: number;
}

export interface OtherStudentsStats {
  student_count: number;
  conversation_count: number;
}

export interface Teacher {
  user_id: string;
  email: string;
  display_name: string;
  role: string;
  total_classes: number;
  total_students: number;
  total_conversations: number;
}

export class TeacherClassesService {
  /**
   * Get all classes for the current teacher
   */
  static async getTeacherClasses(): Promise<TeacherClass[]> {
    const { data, error } = await supabase.rpc("get_teacher_classes");

    if (error) {
      console.error("Error fetching teacher classes:", error);
      throw new Error("Failed to fetch teacher classes");
    }

    return data || [];
  }

  /**
   * Get all classes for a specific teacher by UID
   * @param sortBy - Sort type: 'conversations' (default), 'name', or 'date'
   */
  static async getTeacherClassesByUid(
    teacherUid: string,
    sortBy: "conversations" | "name" | "date" = "conversations"
  ): Promise<TeacherClass[]> {
    const { data, error } = await supabase.rpc("get_teacher_classes_by_uid", {
      teacher_uid: teacherUid,
      sort_by: sortBy,
    });

    if (error) {
      console.error("Error fetching teacher classes by UID:", error);
      throw new Error("Failed to fetch teacher classes");
    }

    return data || [];
  }

  /**
   * Get students for a specific class
   * @param sortBy - Sort type: 'conversations' (default), 'name', or 'date'
   */
  static async getClassStudents(
    classId: string,
    startDate?: string | null,
    endDate?: string | null,
    sortBy: "conversations" | "name" | "date" = "conversations"
  ): Promise<ClassStudent[]> {
    const { data, error } = await supabase.rpc("get_class_students", {
      class_id_param: classId,
      start_date: startDate || null,
      end_date: endDate || null,
      sort_by: sortBy,
    });

    if (error) {
      console.error("Error fetching class students:", error);
      throw new Error("Failed to fetch class students");
    }

    return data || [];
  }

  /**
   * Get student count for a specific class
   */
  static async getClassStudentCount(classId: string): Promise<number> {
    const students = await this.getClassStudents(classId);
    return students.length;
  }

  /**
   * Get class information by ID
   */
  static async getClassInfo(classId: string): Promise<ClassInfo | null> {
    const { data, error } = await supabase.rpc("get_class_info", {
      class_id_param: classId,
    });

    if (error) {
      console.error("Error fetching class info:", error);
      throw new Error("Failed to fetch class information");
    }

    return data?.[0] || null;
  }

  /**
   * Get statistics for students without a class (other students)
   */
  static async getOtherStudentsStats(): Promise<OtherStudentsStats | null> {
    const { data, error } = await supabase.rpc("get_other_students_stats");

    if (error) {
      console.error("Error fetching other students stats:", error);
      throw new Error("Failed to fetch other students statistics");
    }

    return data?.[0] || null;
  }

  /**
   * Get students without a class (other students)
   */
  static async getOtherStudents(): Promise<ClassStudent[]> {
    const { data, error } = await supabase.rpc("get_other_students");

    if (error) {
      console.error("Error fetching other students:", error);
      throw new Error("Failed to fetch other students");
    }

    return data || [];
  }

  /**
   * Get all teachers (admin only)
   */
  static async getAllTeachers(): Promise<Teacher[]> {
    const { data, error } = await supabase.rpc("get_all_teachers");

    if (error) {
      console.error("Error fetching all teachers:", error);
      throw new Error("Failed to fetch all teachers");
    }

    return data || [];
  }
}
