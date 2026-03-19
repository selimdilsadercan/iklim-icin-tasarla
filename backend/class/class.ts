import { api, APIError, ErrCode } from "encore.dev/api";
import { supabase } from "../db/supabase";

export interface ClassResponse {
  id: string;
  name: string;
  created_at: string;
  student_count: number;
}

export interface ListClassesResponse {
  classes: ClassResponse[];
}

export interface StudentResponse {
  user_id: string;
  email: string;
  display_name: string;
  role: string;
  class_name: string;
  total_conversations: number;
  yaprak_conversations: number;
  robi_conversations: number;
  bugday_conversations: number;
  damla_conversations: number;
  last_message_date: string | null;
}

export interface ListStudentsResponse {
  students: StudentResponse[];
}

/**
 * Tüm sınıfları listeler (Admin kullanımı için)
 */
export const listClasses = api(
  { expose: true, method: "GET", path: "/classes" },
  async (): Promise<ListClassesResponse> => {
    // Sınıfları getir
    const { data: classes, error: classesError } = await supabase
      .from("classes")
      .select("id, name, created_at")
      .eq("is_active", true);

    if (classesError) {
      throw new APIError(ErrCode.Internal, classesError.message);
    }

    // Öğrenci sayılarını getir
    const { data: studentRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("class_id")
      .eq("role", "student");

    if (rolesError) {
      throw new APIError(ErrCode.Internal, rolesError.message);
    }

    const classList = (classes || []).map((c) => ({
      id: c.id,
      name: c.name,
      created_at: c.created_at,
      student_count: (studentRoles || []).filter((r) => r.class_id === c.id).length,
    }));

    return { classes: classList };
  }
);

interface GetClassStudentsParams {
  classId: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
}

/**
 * Belirli bir sınıfın öğrencilerini listeler (İstatistiklerle birlikte)
 */
export const getClassStudents = api(
  { expose: true, method: "GET", path: "/classes/:classId/students" },
  async (params: GetClassStudentsParams): Promise<ListStudentsResponse> => {
    const { classId, startDate, endDate, sortBy } = params;
    
    const rpcParams: any = {
      class_id_param: classId,
      sort_by: sortBy || 'conversations'
    };

    if (startDate) rpcParams.start_date = startDate;
    if (endDate) rpcParams.end_date = endDate;

    const { data, error } = await supabase.rpc("get_class_students", rpcParams);

    if (error) {
      throw new APIError(ErrCode.Internal, error.message);
    }

    return { 
      students: (data || []).map((s: any) => ({
        user_id: s.user_id,
        email: s.email,
        display_name: s.display_name,
        role: s.role,
        class_name: s.class_name,
        total_conversations: Number(s.total_conversations),
        yaprak_conversations: Number(s.yaprak_conversations),
        robi_conversations: Number(s.robi_conversations),
        bugday_conversations: Number(s.bugday_conversations),
        damla_conversations: Number(s.damla_conversations),
        last_message_date: s.last_message_date
      })) 
    };
  }
);
