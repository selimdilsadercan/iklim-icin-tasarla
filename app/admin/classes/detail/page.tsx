"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { TeacherClassesService, ClassStudent } from "@/lib/teacher-classes-service";
import { useRouter, useSearchParams } from "next/navigation";

export default function ClassDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams.get('id');
  
  const [students, setStudents] = useState<ClassStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [className, setClassName] = useState<string>("Sınıf");

  const fetchStudents = async () => {
    if (!user || !classId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const classStudents = await TeacherClassesService.getClassStudents(classId);
      setStudents(classStudents);
      
      // Get class name from the first student's data or use a default
      if (classStudents.length > 0) {
        setClassName(classStudents[0].class_name || "Sınıf");
      } else {
        setClassName("Sınıf");
      }
    } catch (err) {
      console.error('Error fetching class students:', err);
      setError('Öğrenciler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [user, classId]);

  // Redirect if no classId
  useEffect(() => {
    if (!classId) {
      router.push('/admin/classes');
    }
  }, [classId, router]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-green-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-sm mx-auto flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-800">{className}</h1>
              <p className="text-sm text-gray-600">Sınıf Öğrencileri</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 py-8">
          <div className="max-w-sm mx-auto">
            {/* Error State */}
            {error && (
              <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
                <button 
                  onClick={fetchStudents}
                  className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                >
                  Tekrar Dene
                </button>
              </div>
            )}

            {/* Students List */}
            <div className="space-y-3">
              {/* Skeleton Loaders */}
              {loading && (
                <>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white/80 rounded-2xl p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-24"></div>
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-32"></div>
                        </div>
                        <div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Empty State */}
              {!loading && students.length === 0 && (
                <div className="bg-white/80 rounded-2xl p-8 border border-gray-200 shadow-sm text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Henüz öğrenci yok</h3>
                  <p className="text-gray-600 text-sm">
                    Bu sınıfa henüz hiç öğrenci eklenmemiş.
                  </p>
                </div>
              )}

              {/* Students Cards */}
              {!loading && students.map((student) => (
                <div key={student.user_id} className="bg-white/80 rounded-2xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    {/* Student Avatar */}
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {student.display_name?.charAt(0).toUpperCase() || student.email?.charAt(0).toUpperCase() || 'S'}
                      </span>
                    </div>
                    
                    {/* Student Info */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">
                        {student.display_name || 'İsimsiz Öğrenci'}
                      </h3>
                      <p className="text-sm text-gray-600">{student.email}</p>
                    </div>
                    
                    {/* Role Badge */}
                    <div className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      {student.role === 'student' ? 'Öğrenci' : student.role}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            {!loading && students.length > 0 && (
              <div className="mt-6 bg-white/80 rounded-2xl p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    <span className="text-sm text-gray-600">Toplam Öğrenci</span>
                  </div>
                  <span className="text-lg font-bold text-gray-800">{students.length}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
