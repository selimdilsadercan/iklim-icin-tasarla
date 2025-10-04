"use client";

import { useState, useEffect, Suspense } from "react";
import { AdminProtectedRoute } from "@/components/auth/AdminProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { TeacherClassesService, ClassStudent } from "@/lib/teacher-classes-service";
import AdminAppBar from "@/components/AdminAppBar";
import AdminSidebar from "@/components/AdminSidebar";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ClassDetailPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams.get('id');
  
  const [students, setStudents] = useState<ClassStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [className, setClassName] = useState<string>("Sınıf");
  const [retryCount, setRetryCount] = useState(0);

  const fetchStudents = async (isRetry = false) => {
    if (!user || !classId) {
      setLoading(false);
      return;
    }

    try {
      if (!isRetry) {
        setLoading(true);
        setError(null);
      }
      
      const classStudents = await TeacherClassesService.getClassStudents(classId);
      setStudents(classStudents);
      setRetryCount(0); // Reset retry count on success
      
      // Get class name from the first student's data or use a default
      if (classStudents.length > 0) {
        setClassName(classStudents[0].class_name || "Sınıf");
      } else {
        setClassName("Sınıf");
      }
    } catch (err) {
      console.error('Error fetching class students:', err);
      setError('Öğrenciler yüklenirken bir hata oluştu');
      
      // Auto-retry logic
      if (retryCount < 3) {
        console.log(`Retrying fetchStudents, attempt ${retryCount + 1}`);
        setRetryCount(prev => prev + 1);
        setTimeout(() => fetchStudents(true), 2000 * (retryCount + 1)); // Exponential backoff
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [user, classId]);

  // Handle page visibility changes to refresh data when tab becomes active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user && classId) {
        console.log('Page became visible, refreshing students');
        fetchStudents();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, classId]);

  // Redirect if no classId
  useEffect(() => {
    if (!classId) {
      router.push('/admin/classes');
    }
  }, [classId, router]);

  // Timeout mechanism to prevent infinite loading
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.log('Loading timeout reached, stopping loading state');
        setLoading(false);
        setError('Yükleme zaman aşımına uğradı. Lütfen sayfayı yenileyin.');
      }, 15000); // 15 second timeout

      return () => clearTimeout(timeout);
    }
  }, [loading]);

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-green-50">
        <AdminSidebar currentPage={null} />
        
        {/* Main Content with responsive layout */}
        <div className="lg:ml-64">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
            <div className="max-w-sm lg:max-w-4xl mx-auto flex items-center gap-4">
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

          {/* Content */}
          <div className="px-6 pb-24 lg:pb-8 pt-8">
            <div className="max-w-sm lg:max-w-4xl mx-auto">
            {/* Error State */}
            {error && (
              <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
                <button 
                  onClick={() => fetchStudents()}
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
                <Link 
                  key={student.user_id} 
                  href={`/admin/student?studentId=${student.user_id}`}
                  className="block bg-white/80 rounded-2xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {/* Student Avatar */}
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {student.display_name?.charAt(0).toUpperCase() || student.email?.charAt(0).toUpperCase() || 'S'}
                      </span>
                    </div>
                    
                    {/* Student Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate" title={student.display_name || 'İsimsiz Öğrenci'}>
                        {student.display_name || 'İsimsiz Öğrenci'}
                      </h3>
                      <p className="text-sm text-gray-600 truncate" title={student.email}>
                        {student.email}
                      </p>
                      {student.total_conversations > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <svg className="w-3 h-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span className="text-xs text-blue-600 font-medium">
                            {student.total_conversations} konuşma
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Role Badge and Arrow */}
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        {student.role === 'student' ? 'Öğrenci' : student.role}
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            </div>
          </div>
        </div>
      </div>
      </AdminProtectedRoute>
  );
}

export default function ClassDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ClassDetailPageContent />
    </Suspense>
  );
}
