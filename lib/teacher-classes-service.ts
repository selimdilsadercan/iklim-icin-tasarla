import { supabase } from "./supabase";

export interface TeacherClass {
  id: string;
  name: string;
  created_at: string;
  is_active: boolean;
  student_count: number;
  conversation_count: number;
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
   */
  static async getTeacherClassesByUid(
    teacherUid: string
  ): Promise<TeacherClass[]> {
    const { data, error } = await supabase.rpc("get_teacher_classes_by_uid", {
      teacher_uid: teacherUid,
    });

    if (error) {
      console.error("Error fetching teacher classes by UID:", error);
      throw new Error("Failed to fetch teacher classes");
    }

    return data || [];
  }

  /**
   * Get students for a specific class
   */
  static async getClassStudents(classId: string): Promise<ClassStudent[]> {
    const { data, error } = await supabase.rpc("get_class_students", {
      class_id_param: classId,
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
}
