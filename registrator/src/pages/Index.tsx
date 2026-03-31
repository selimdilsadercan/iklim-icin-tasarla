import { useState, useMemo, useEffect } from "react";
import { FileUploader } from "@/components/FileUploader";
import { StudentData } from "@/types/student";
import { processStudentData } from "@/utils/studentProcessor";
import { convertTurkishToEnglish } from "@/utils/turkishCharacters";
import { downloadStudentListHTMLs } from "@/utils/htmlGenerator";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  FileText,
  Upload,
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
  EyeOff,
  SkipForward,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const Index = () => {
  // Load from localStorage on mount
  const loadPersistedData = () => {
    try {
      const savedStudents = localStorage.getItem("students");
      const savedErrors = localStorage.getItem("errors");

      if (savedStudents) {
        return {
          students: JSON.parse(savedStudents) as StudentData[],
          errors: savedErrors ? (JSON.parse(savedErrors) as string[]) : [],
        };
      }
    } catch (error) {
      console.error("Error loading persisted data:", error);
      // Clear corrupted data
      localStorage.removeItem("students");
      localStorage.removeItem("errors");
    }
    return { students: [], errors: [] };
  };

  const { students: initialStudents, errors: initialErrors } =
    loadPersistedData();

  const [studentsState, setStudentsState] =
    useState<StudentData[]>(initialStudents);
  const [errorsState, setErrorsState] = useState<string[]>(initialErrors);
  const [previewSubTab, setPreviewSubTab] = useState("classes");
  const [classesPage, setClassesPage] = useState(1);
  const [studentsPage, setStudentsPage] = useState(1);
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [serviceRoleKey, setServiceRoleKey] = useState("");
  const [showServiceKey, setShowServiceKey] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0,
  });
  const [uploadResults, setUploadResults] = useState<{
    success: number;
    failed: number;
    skipped: number;
    errors: Array<{ student: string; error: string }>;
    skippedUsers: Array<{ student: string; reason: string }>;
  } | null>(null);
  const [cleanupUsers, setCleanupUsers] = useState<any[]>([]);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [deleteEmailFilter, setDeleteEmailFilter] = useState("");
  const [showDeleteSection, setShowDeleteSection] = useState(false);
  const [uploadClasses, setUploadClasses] = useState(true);
  const [uploadStudents, setUploadStudents] = useState(true);
  const [uploadTeachers, setUploadTeachers] = useState(false);
  const [restoreClassIdsLoading, setRestoreClassIdsLoading] = useState(false);
  const [restoreClassIdsResults, setRestoreClassIdsResults] = useState<{
    success: number;
    failed: number;
    errors: Array<{ student: string; error: string }>;
  } | null>(null);
  const [linkStudentsLoading, setLinkStudentsLoading] = useState(false);
  const [linkStudentsResults, setLinkStudentsResults] = useState<{
    classesCreated: number;
    studentsLinked: number;
    teacherClassesCreated: number;
    failed: number;
    errors: Array<{ item: string; error: string }>;
  } | null>(null);
  const [linkStudentsData, setLinkStudentsData] = useState<any[]>([]);

  // Use aliases to keep the rest of the code unchanged
  const students = studentsState;
  const errors = errorsState;

  // Persist to localStorage whenever students or errors change
  useEffect(() => {
    if (studentsState.length > 0 || errorsState.length > 0) {
      localStorage.setItem("students", JSON.stringify(studentsState));
      localStorage.setItem("errors", JSON.stringify(errorsState));
    } else {
      // Clear localStorage if no data
      localStorage.removeItem("students");
      localStorage.removeItem("errors");
    }
  }, [studentsState, errorsState]);

  // Helper to set students with persistence
  const setStudents = (newStudents: StudentData[]) => {
    setStudentsState(newStudents);
  };

  // Helper to set errors with persistence
  const setErrors = (newErrors: string[]) => {
    setErrorsState(newErrors);
  };

  const handleFileProcessed = (data: any[]) => {
    const { students: processedStudents, errors: processingErrors } =
      processStudentData(data);

    setStudents(processedStudents);
    setErrors(processingErrors);

    if (processedStudents.length > 0) {
      toast.success(`${processedStudents.length} öğrenci başarıyla işlendi`);
    }

    if (processingErrors.length > 0) {
      toast.error(`${processingErrors.length} hata bulundu`);
    }
  };

  const handleError = (error: string) => {
    toast.error(error);
  };

  const handleLinkStudentsFileProcessed = (data: any[]) => {
    // Store the raw data for linking process
    console.log("Link students data received:", data);
    console.log("Data length:", data.length);
    if (data.length > 0) {
      console.log("First row sample:", data[0]);
    }
    setLinkStudentsData(data);
    if (data.length > 0) {
      toast.success(
        `${data.length} kayıt yüklendi. Bağlama işlemini başlatabilirsiniz.`
      );
    } else {
      toast.error(
        "Excel dosyası boş veya veri okunamadı. Lütfen dosyayı kontrol edin."
      );
    }
  };

  const handleClearData = () => {
    if (
      confirm(
        "Tüm verileri temizlemek istediğinizden emin misiniz? Bu işlem geri alınamaz."
      )
    ) {
      setStudents([]);
      setErrors([]);
      localStorage.removeItem("students");
      localStorage.removeItem("errors");
      toast.success("Veriler temizlendi");
    }
  };

  // Group students by class (className + teacherName)
  const classGroups = useMemo(() => {
    const groups = new Map<
      string,
      { className: string; teacherName: string; students: StudentData[] }
    >();

    students.forEach((student) => {
      const teacherName = student.teacherName || "Ogretmen";
      const key = `${student.className}_${teacherName}`;

      if (!groups.has(key)) {
        groups.set(key, {
          className: student.className,
          teacherName: teacherName,
          students: [],
        });
      }
      groups.get(key)!.students.push(student);
    });

    return Array.from(groups.values()).sort((a, b) => {
      if (a.className !== b.className) {
        return a.className.localeCompare(b.className);
      }
      return a.teacherName.localeCompare(b.teacherName);
    });
  }, [students]);

  // Extract unique teachers and generate their emails/passwords
  const teachers = useMemo(() => {
    const teacherMap = new Map<
      string,
      { name: string; email: string; password: string }
    >();

    students.forEach((student) => {
      if (student.teacherName && !teacherMap.has(student.teacherName)) {
        const fullName = student.teacherName.trim();
        const nameParts = fullName.split(/\s+/);
        const firstName = nameParts[0];
        const lastName =
          nameParts.length > 1 ? nameParts[nameParts.length - 1] : firstName;

        // Convert Turkish characters for email
        const firstNameEnglish =
          convertTurkishToEnglish(firstName).toLowerCase();
        const lastNameEnglish = convertTurkishToEnglish(lastName).toLowerCase();

        // Generate email: [firstname].ogretmen@iklim.proje (only first name)
        const firstNameClean = firstNameEnglish.replace(/[^a-z0-9]/g, "");
        const email = `${firstNameClean}.ogretmen@iklim.proje`;

        // Generate password: firstname2025 (e.g., Büşra -> büşra2025)
        const password = `${firstName.toLowerCase()}2025`;

        teacherMap.set(student.teacherName, {
          name: fullName,
          email,
          password,
        });
      }
    });

    return Array.from(teacherMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [students]);

  // Reset pagination when switching tabs or when data changes
  useEffect(() => {
    if (previewSubTab === "classes") {
      setClassesPage(1);
    } else if (previewSubTab === "students") {
      setStudentsPage(1);
    }
  }, [previewSubTab, classGroups.length, students.length]);

  const handleDownloadHTMLs = async () => {
    try {
      await downloadStudentListHTMLs(students);
      toast.success("HTML dosyaları ZIP olarak indirildi");
    } catch (error) {
      toast.error("HTML indirme hatası");
      console.error(error);
    }
  };

  const handleApiUpload = async () => {
    if (!supabaseUrl || !serviceRoleKey) {
      toast.error("Lütfen Supabase URL ve Service Role Key girin");
      return;
    }

    if (
      !supabaseUrl.startsWith("https://") ||
      !supabaseUrl.includes(".supabase.co")
    ) {
      toast.error("Geçersiz Supabase URL formatı");
      return;
    }

    if (!serviceRoleKey.startsWith("eyJ")) {
      toast.error("Geçersiz Service Role Key formatı");
      return;
    }

    setUploading(true);
    setUploadResults(null);

    // Calculate total items for progress tracking
    const totalItems =
      (uploadStudents ? students.length : 0) +
      (uploadTeachers ? teachers.length : 0);
    setUploadProgress({ current: 0, total: totalItems });

    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [] as Array<{ student: string; error: string }>,
      skippedUsers: [] as Array<{ student: string; reason: string }>,
    };

    try {
      const classIdMap = new Map<string, string>();

      // Step 1: Create all unique classes first (if classes upload is enabled)
      if (uploadClasses) {
        const uniqueClasses = [...new Set(students.map((s) => s.className))];

        console.log(`Creating ${uniqueClasses.length} unique classes...`);

        for (const className of uniqueClasses) {
          try {
            // Check if class already exists
            const checkClassResponse = await fetch(
              `${supabaseUrl}/rest/v1/classes?name=eq.${encodeURIComponent(
                className
              )}&select=id`,
              {
                headers: {
                  apikey: serviceRoleKey,
                  Authorization: `Bearer ${serviceRoleKey}`,
                },
              }
            );

            if (checkClassResponse.ok) {
              const classData = await checkClassResponse.json();
              if (classData && classData.length > 0) {
                classIdMap.set(className, classData[0].id);
                console.log(
                  `Class already exists: ${className} -> ${classData[0].id}`
                );
                continue;
              }
            }

            // Create new class
            const createClassResponse = await fetch(
              `${supabaseUrl}/rest/v1/classes`,
              {
                method: "POST",
                headers: {
                  apikey: serviceRoleKey,
                  Authorization: `Bearer ${serviceRoleKey}`,
                  "Content-Type": "application/json",
                  Prefer: "return=representation",
                },
                body: JSON.stringify({
                  name: className,
                  is_active: true,
                }),
              }
            );

            if (createClassResponse.ok) {
              const newClassData = await createClassResponse.json();
              classIdMap.set(className, newClassData[0].id);
              console.log(
                `Created new class: ${className} -> ${newClassData[0].id}`
              );
            } else {
              const errorData = await createClassResponse.json();
              console.error(
                `Class creation failed for ${className}:`,
                errorData
              );
              throw new Error(
                `Class creation failed for ${className}: ${
                  errorData.message || createClassResponse.statusText
                }`
              );
            }
          } catch (error) {
            throw new Error(
              `Failed to create/find class ${className}: ${
                error instanceof Error ? error.message : "Unknown error"
              }`
            );
          }
        }
      }

      // Step 2: Fetch ALL users once and cache them (needed for both students and teachers)
      console.log("Fetching all users for email checking...");
      let allUsers: any[] = [];
      let page = 1;
      const perPage = 50;
      let hasMore = true;

      while (hasMore && page <= 20) {
        // Safety limit for 1000 users
        try {
          const response = await fetch(
            `${supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=${perPage}`,
            {
              headers: {
                apikey: serviceRoleKey,
                Authorization: `Bearer ${serviceRoleKey}`,
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            const users = data.users || [];

            if (users.length === 0) {
              hasMore = false;
            } else {
              allUsers = allUsers.concat(users);
              page++;
              console.log(
                `Fetched page ${page - 1}: ${users.length} users (total: ${
                  allUsers.length
                })`
              );
            }
          } else {
            console.error(
              `Failed to fetch users page ${page}:`,
              response.status
            );
            hasMore = false;
          }
        } catch (error) {
          console.error(`Error fetching users page ${page}:`, error);
          hasMore = false;
        }
      }

      console.log(`Total users fetched: ${allUsers.length}`);

      let currentProgress = 0;

      // Step 3: Process students in batches of 50 (Supabase limit)
      if (uploadStudents) {
        const batchSize = 50;
        const totalBatches = Math.ceil(students.length / batchSize);

        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
          const startIndex = batchIndex * batchSize;
          const endIndex = Math.min(startIndex + batchSize, students.length);
          const batchStudents = students.slice(startIndex, endIndex);

          console.log(
            `Processing batch ${batchIndex + 1}/${totalBatches} (${
              batchStudents.length
            } students)`
          );

          // Add delay between batches to avoid rate limiting
          if (batchIndex > 0) {
            console.log("Waiting 2 seconds before next batch...");
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }

          for (let i = 0; i < batchStudents.length; i++) {
            const student = batchStudents[i];
            currentProgress++;
            setUploadProgress({
              current: currentProgress,
              total: totalItems,
            });

            try {
              // Check if user already exists using cached users
              let userId: string;
              let shouldCreateUser = true;
              let existingUserId: string | null = null;
              let userWasSkipped = false;

              // Search for the specific email in ALL cached users
              const matchingUser = allUsers.find(
                (user: any) => user.email === student.email
              );

              if (matchingUser) {
                existingUserId = matchingUser.id;
                console.log(
                  `Found existing user: ${student.email} with ID: ${existingUserId}`
                );

                // Fetch detailed user info to check identities/providers
                const detailResponse = await fetch(
                  `${supabaseUrl}/auth/v1/admin/users/${existingUserId}`,
                  {
                    method: "GET",
                    headers: {
                      apikey: serviceRoleKey,
                      Authorization: `Bearer ${serviceRoleKey}`,
                    },
                  }
                );

                if (detailResponse.ok) {
                  const userDetail = await detailResponse.json();
                  console.log(`User detail for ${student.email}:`, userDetail);
                  const hasProvider =
                    userDetail.identities && userDetail.identities.length > 0;

                  if (hasProvider) {
                    // User has valid provider - keep it and skip creation
                    console.log(`Kullanıcı zaten düzgün: ${student.email}`);
                    userId = existingUserId;
                    shouldCreateUser = false;
                    userWasSkipped = true;

                    // Track skipped user
                    results.skipped++;
                    results.skippedUsers.push({
                      student: student.fullName,
                      reason: "Kullanıcı zaten mevcut ve geçerli",
                    });
                  } else {
                    // Provider missing - DELETE and recreate
                    console.log(
                      `Provider eksik, kullanıcı siliniyor: ${student.email}`
                    );
                    const deleteResponse = await fetch(
                      `${supabaseUrl}/auth/v1/admin/users/${existingUserId}`,
                      {
                        method: "DELETE",
                        headers: {
                          apikey: serviceRoleKey,
                          Authorization: `Bearer ${serviceRoleKey}`,
                        },
                      }
                    );

                    if (!deleteResponse.ok) {
                      console.warn(`Kullanıcı silinemedi: ${student.email}`);
                    }
                  }
                } else {
                  console.log(
                    `Failed to get user detail for ${student.email}, will create new user`
                  );
                }
              } else {
                console.log(
                  `No existing user found for ${student.email} among ${allUsers.length} users`
                );
              }

              // Create auth user only if needed
              if (shouldCreateUser) {
                console.log(`Creating auth user: ${student.email}`);
                const authResponse = await fetch(
                  `${supabaseUrl}/auth/v1/admin/users`,
                  {
                    method: "POST",
                    headers: {
                      apikey: serviceRoleKey,
                      Authorization: `Bearer ${serviceRoleKey}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      email: student.email,
                      password: student.password,
                      email_confirm: true,
                      user_metadata: {
                        display_name: student.fullName,
                      },
                    }),
                  }
                );

                if (!authResponse.ok) {
                  const errorData = await authResponse.json();
                  throw new Error(
                    errorData.msg ||
                      `Auth oluşturma hatası: ${authResponse.statusText}`
                  );
                }

                const authData = await authResponse.json();
                userId = authData.id;
              }

              // Get class ID from our map
              const classId = classIdMap.get(student.className);
              if (!classId) {
                throw new Error(`Class ID not found for: ${student.className}`);
              }

              // Check if user_role already exists (by user_id only)
              const checkRoleResponse = await fetch(
                `${supabaseUrl}/rest/v1/user_roles?user_id=eq.${userId}&select=id,class_id`,
                {
                  headers: {
                    apikey: serviceRoleKey,
                    Authorization: `Bearer ${serviceRoleKey}`,
                  },
                }
              );

              if (checkRoleResponse.ok) {
                const existingRoles = await checkRoleResponse.json();
                console.log(
                  `User roles check for ${student.email}:`,
                  existingRoles
                );

                if (!existingRoles || existingRoles.length === 0) {
                  // No role exists - create new
                  const roleResponse = await fetch(
                    `${supabaseUrl}/rest/v1/user_roles`,
                    {
                      method: "POST",
                      headers: {
                        apikey: serviceRoleKey,
                        Authorization: `Bearer ${serviceRoleKey}`,
                        "Content-Type": "application/json",
                        Prefer: "return=minimal",
                      },
                      body: JSON.stringify({
                        user_id: userId,
                        role: "student",
                        class_id: classId,
                        display_name: student.fullName,
                      }),
                    }
                  );

                  if (!roleResponse.ok) {
                    const errorData = await roleResponse.json();
                    console.error("Role creation failed:", errorData);
                    throw new Error(
                      `Rol oluşturma hatası: ${
                        errorData.message || roleResponse.statusText
                      } (Class ID: ${classId})`
                    );
                  }

                  console.log(
                    `User role created successfully: ${student.email} -> ${student.className}`
                  );
                } else {
                  // Role exists - update class_id and display_name if different
                  const existingRole = existingRoles[0];
                  if (existingRole.class_id !== classId) {
                    const updateResponse = await fetch(
                      `${supabaseUrl}/rest/v1/user_roles?user_id=eq.${userId}`,
                      {
                        method: "PATCH",
                        headers: {
                          apikey: serviceRoleKey,
                          Authorization: `Bearer ${serviceRoleKey}`,
                          "Content-Type": "application/json",
                          Prefer: "return=minimal",
                        },
                        body: JSON.stringify({
                          class_id: classId,
                          display_name: student.fullName,
                        }),
                      }
                    );

                    if (!updateResponse.ok) {
                      throw new Error(
                        `Rol güncelleme hatası: ${updateResponse.statusText}`
                      );
                    }
                    console.log(
                      `Sınıf güncellendi: ${student.email} -> ${student.className}`
                    );
                  } else {
                    console.log(
                      `Kayıt zaten güncel: ${student.email} - ${student.className}`
                    );

                    // Track skipped user_roles update
                    if (shouldCreateUser === false) {
                      // User was already skipped, so this is a complete skip
                      userWasSkipped = true;
                      const existingSkippedIndex =
                        results.skippedUsers.findIndex(
                          (s) => s.student === student.fullName
                        );
                      if (existingSkippedIndex >= 0) {
                        results.skippedUsers[existingSkippedIndex].reason =
                          "Kullanıcı ve rol zaten mevcut ve güncel";
                      }
                    }
                  }
                }
              }

              // Only count as success if user was actually processed (not skipped)
              if (!userWasSkipped) {
                results.success++;
              }
            } catch (error) {
              results.failed++;
              results.errors.push({
                student: student.fullName,
                error:
                  error instanceof Error ? error.message : "Bilinmeyen hata",
              });
            }
          }

          console.log(
            `Batch ${batchIndex + 1} completed. Success: ${
              results.success
            }, Failed: ${results.failed}`
          );
        }
      }

      // Step 4: Process teachers in batches of 50 (Supabase limit)
      if (uploadTeachers) {
        // Build map of teacher names to their classes
        const teacherClassesMap = new Map<string, Set<string>>();
        students.forEach((student) => {
          if (student.teacherName && student.className) {
            if (!teacherClassesMap.has(student.teacherName)) {
              teacherClassesMap.set(student.teacherName, new Set());
            }
            teacherClassesMap.get(student.teacherName)!.add(student.className);
          }
        });

        // Ensure all class IDs are available for teacher_classes
        // If classes weren't uploaded, fetch existing class IDs from database
        if (!uploadClasses) {
          const uniqueClasses = [...new Set(students.map((s) => s.className))];
          console.log(`Fetching existing class IDs for teacher_classes...`);
          for (const className of uniqueClasses) {
            if (!classIdMap.has(className)) {
              try {
                const checkClassResponse = await fetch(
                  `${supabaseUrl}/rest/v1/classes?name=eq.${encodeURIComponent(
                    className
                  )}&select=id`,
                  {
                    headers: {
                      apikey: serviceRoleKey,
                      Authorization: `Bearer ${serviceRoleKey}`,
                    },
                  }
                );
                if (checkClassResponse.ok) {
                  const classData = await checkClassResponse.json();
                  if (classData && classData.length > 0) {
                    classIdMap.set(className, classData[0].id);
                    console.log(
                      `Found existing class: ${className} -> ${classData[0].id}`
                    );
                  }
                }
              } catch (error) {
                console.warn(
                  `Failed to fetch class ID for ${className}:`,
                  error
                );
              }
            }
          }
        }

        const batchSize = 50;
        const totalBatches = Math.ceil(teachers.length / batchSize);

        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
          const startIndex = batchIndex * batchSize;
          const endIndex = Math.min(startIndex + batchSize, teachers.length);
          const batchTeachers = teachers.slice(startIndex, endIndex);

          console.log(
            `Processing teacher batch ${batchIndex + 1}/${totalBatches} (${
              batchTeachers.length
            } teachers)`
          );

          // Add delay between batches to avoid rate limiting
          if (batchIndex > 0) {
            console.log("Waiting 2 seconds before next batch...");
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }

          for (let i = 0; i < batchTeachers.length; i++) {
            const teacher = batchTeachers[i];
            currentProgress++;
            setUploadProgress({
              current: currentProgress,
              total: totalItems,
            });

            try {
              // Check if user already exists using cached users
              let userId: string;
              let shouldCreateUser = true;
              let existingUserId: string | null = null;
              let userWasSkipped = false;

              // Search for the specific email in ALL cached users
              const matchingUser = allUsers.find(
                (user: any) => user.email === teacher.email
              );

              if (matchingUser) {
                existingUserId = matchingUser.id;
                console.log(
                  `Found existing user: ${teacher.email} with ID: ${existingUserId}`
                );

                // Fetch detailed user info to check identities/providers
                const detailResponse = await fetch(
                  `${supabaseUrl}/auth/v1/admin/users/${existingUserId}`,
                  {
                    method: "GET",
                    headers: {
                      apikey: serviceRoleKey,
                      Authorization: `Bearer ${serviceRoleKey}`,
                    },
                  }
                );

                if (detailResponse.ok) {
                  const userDetail = await detailResponse.json();
                  console.log(`User detail for ${teacher.email}:`, userDetail);
                  const hasProvider =
                    userDetail.identities && userDetail.identities.length > 0;

                  if (hasProvider) {
                    // User has valid provider - keep it and skip creation
                    console.log(`Kullanıcı zaten düzgün: ${teacher.email}`);
                    userId = existingUserId;
                    shouldCreateUser = false;
                    userWasSkipped = true;

                    // Track skipped user
                    results.skipped++;
                    results.skippedUsers.push({
                      student: teacher.name,
                      reason: "Kullanıcı zaten mevcut ve geçerli",
                    });
                  } else {
                    // Provider missing - DELETE and recreate
                    console.log(
                      `Provider eksik, kullanıcı siliniyor: ${teacher.email}`
                    );
                    const deleteResponse = await fetch(
                      `${supabaseUrl}/auth/v1/admin/users/${existingUserId}`,
                      {
                        method: "DELETE",
                        headers: {
                          apikey: serviceRoleKey,
                          Authorization: `Bearer ${serviceRoleKey}`,
                        },
                      }
                    );

                    if (!deleteResponse.ok) {
                      console.warn(`Kullanıcı silinemedi: ${teacher.email}`);
                    }
                  }
                } else {
                  console.log(
                    `Failed to get user detail for ${teacher.email}, will create new user`
                  );
                }
              } else {
                console.log(
                  `No existing user found for ${teacher.email} among ${allUsers.length} users`
                );
              }

              // Create auth user only if needed
              if (shouldCreateUser) {
                console.log(`Creating auth user: ${teacher.email}`);
                const authResponse = await fetch(
                  `${supabaseUrl}/auth/v1/admin/users`,
                  {
                    method: "POST",
                    headers: {
                      apikey: serviceRoleKey,
                      Authorization: `Bearer ${serviceRoleKey}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      email: teacher.email,
                      password: teacher.password,
                      email_confirm: true,
                      user_metadata: {
                        display_name: teacher.name,
                      },
                    }),
                  }
                );

                if (!authResponse.ok) {
                  const errorData = await authResponse.json();
                  throw new Error(
                    errorData.msg ||
                      `Auth oluşturma hatası: ${authResponse.statusText}`
                  );
                }

                const authData = await authResponse.json();
                userId = authData.id;
              }

              // Check if user_role already exists (by user_id and role)
              const checkRoleResponse = await fetch(
                `${supabaseUrl}/rest/v1/user_roles?user_id=eq.${userId}&role=eq.teacher&select=id`,
                {
                  headers: {
                    apikey: serviceRoleKey,
                    Authorization: `Bearer ${serviceRoleKey}`,
                  },
                }
              );

              if (checkRoleResponse.ok) {
                const existingRoles = await checkRoleResponse.json();
                console.log(
                  `User roles check for ${teacher.email}:`,
                  existingRoles
                );

                if (!existingRoles || existingRoles.length === 0) {
                  // No role exists - create new
                  const roleResponse = await fetch(
                    `${supabaseUrl}/rest/v1/user_roles`,
                    {
                      method: "POST",
                      headers: {
                        apikey: serviceRoleKey,
                        Authorization: `Bearer ${serviceRoleKey}`,
                        "Content-Type": "application/json",
                        Prefer: "return=minimal",
                      },
                      body: JSON.stringify({
                        user_id: userId,
                        role: "teacher",
                        class_id: null, // Teachers don't belong to a specific class
                        display_name: teacher.name,
                      }),
                    }
                  );

                  if (!roleResponse.ok) {
                    const errorData = await roleResponse.json();
                    console.error("Role creation failed:", errorData);
                    throw new Error(
                      `Rol oluşturma hatası: ${
                        errorData.message || roleResponse.statusText
                      }`
                    );
                  }

                  console.log(
                    `User role created successfully: ${teacher.email} -> teacher`
                  );
                } else {
                  console.log(`Kayıt zaten güncel: ${teacher.email} - teacher`);

                  // Track skipped user_roles update
                  if (shouldCreateUser === false) {
                    // User was already skipped, so this is a complete skip
                    userWasSkipped = true;
                    const existingSkippedIndex = results.skippedUsers.findIndex(
                      (s) => s.student === teacher.name
                    );
                    if (existingSkippedIndex >= 0) {
                      results.skippedUsers[existingSkippedIndex].reason =
                        "Kullanıcı ve rol zaten mevcut ve güncel";
                    }
                  }
                }

                // Create teacher_classes entries for this teacher (regardless of whether role was new or existing)
                const teacherClassNames = teacherClassesMap.get(teacher.name);
                if (teacherClassNames && teacherClassNames.size > 0) {
                  console.log(
                    `Creating teacher_classes for ${teacher.name}: ${Array.from(
                      teacherClassNames
                    ).join(", ")}`
                  );

                  for (const className of teacherClassNames) {
                    const classId = classIdMap.get(className);
                    if (!classId) {
                      console.warn(
                        `Class ID not found for ${className}, skipping teacher_classes entry`
                      );
                      continue;
                    }

                    // Check if teacher_classes entry already exists
                    const checkTeacherClassResponse = await fetch(
                      `${supabaseUrl}/rest/v1/teacher_classes?teacher_id=eq.${userId}&class_id=eq.${classId}&select=id`,
                      {
                        headers: {
                          apikey: serviceRoleKey,
                          Authorization: `Bearer ${serviceRoleKey}`,
                        },
                      }
                    );

                    if (checkTeacherClassResponse.ok) {
                      const existingEntries =
                        await checkTeacherClassResponse.json();
                      if (!existingEntries || existingEntries.length === 0) {
                        // Create new teacher_classes entry
                        const teacherClassResponse = await fetch(
                          `${supabaseUrl}/rest/v1/teacher_classes`,
                          {
                            method: "POST",
                            headers: {
                              apikey: serviceRoleKey,
                              Authorization: `Bearer ${serviceRoleKey}`,
                              "Content-Type": "application/json",
                              Prefer: "return=minimal",
                            },
                            body: JSON.stringify({
                              teacher_id: userId,
                              class_id: classId,
                            }),
                          }
                        );

                        if (!teacherClassResponse.ok) {
                          const errorData = await teacherClassResponse.json();
                          console.error(
                            `Teacher_classes creation failed for ${teacher.name} -> ${className}:`,
                            errorData
                          );
                          // Don't throw error, just log it - teacher upload should continue
                        } else {
                          console.log(
                            `Teacher_classes created: ${teacher.name} -> ${className}`
                          );
                        }
                      } else {
                        console.log(
                          `Teacher_classes already exists: ${teacher.name} -> ${className}`
                        );
                      }
                    }
                  }
                }
              }

              // Only count as success if user was actually processed (not skipped)
              if (!userWasSkipped) {
                results.success++;
              }
            } catch (error) {
              results.failed++;
              results.errors.push({
                student: teacher.name,
                error:
                  error instanceof Error ? error.message : "Bilinmeyen hata",
              });
            }
          }

          console.log(
            `Teacher batch ${batchIndex + 1} completed. Success: ${
              results.success
            }, Failed: ${results.failed}`
          );
        }
      }
    } catch (error) {
      results.failed = totalItems;
      results.errors.push({
        student: "System Error",
        error:
          error instanceof Error ? error.message : "Bilinmeyen sistem hatası",
      });
    }

    setUploadResults(results);
    setUploading(false);
    setUploadProgress({ current: 0, total: 0 });

    if (results.success > 0) {
      toast.success(`${results.success} öğrenci başarıyla yüklendi`);
    }

    if (results.failed > 0) {
      toast.error(`${results.failed} öğrenci yüklenemedi`);
    }
  };

  const handleFetchUsersThisWeek = async () => {
    if (!supabaseUrl || !serviceRoleKey) {
      toast.error("Lütfen Supabase URL ve Service Role Key girin");
      return;
    }

    setCleanupLoading(true);
    try {
      // Calculate date 7 days ago
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // Fetch users with pagination (Supabase limit: 50 users per request)
      let allUsers: any[] = [];
      let page = 1;
      const perPage = 50; // Supabase limit
      let hasMore = true;

      while (hasMore && page <= 10) {
        // Safety limit: max 500 users
        try {
          const response = await fetch(
            `${supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=${perPage}`,
            {
              headers: {
                apikey: serviceRoleKey,
                Authorization: `Bearer ${serviceRoleKey}`,
              },
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            console.error("API Error:", errorData);
            throw new Error(
              `API Hatası: ${errorData.msg || response.statusText}`
            );
          }

          const data = await response.json();
          const users = data.users || [];

          if (users.length === 0) {
            hasMore = false;
          } else {
            allUsers = allUsers.concat(users);
            page++;
          }
        } catch (error) {
          console.error("Page fetch error:", error);
          hasMore = false;
        }
      }

      // Filter users created in the last week

      const recentUsers = allUsers.filter((user: any) => {
        if (!user.created_at) return false;
        const userDate = new Date(user.created_at);
        return userDate >= oneWeekAgo;
      });

      setCleanupUsers(recentUsers);

      if (recentUsers.length === 0) {
        toast.success("Bu hafta oluşturulan kullanıcı bulunamadı");
      } else {
        toast.success(
          `${recentUsers.length} kullanıcı bulundu (bu hafta oluşturulan, toplam ${allUsers.length} kullanıcı kontrol edildi)`
        );
      }
    } catch (error) {
      console.error("Fetch users error:", error);
      toast.error(
        `Kullanıcıları getirme hatası: ${
          error instanceof Error ? error.message : "Bilinmeyen hata"
        }`
      );
    } finally {
      setCleanupLoading(false);
    }
  };

  const handleFetchUsersByEmail = async () => {
    if (!supabaseUrl || !serviceRoleKey) {
      toast.error("Lütfen Supabase URL ve Service Role Key girin");
      return;
    }

    if (!deleteEmailFilter.trim()) {
      toast.error(
        "Lütfen email filtresi girin (örn: @student.com, @iklim.com)"
      );
      return;
    }

    setCleanupLoading(true);
    try {
      // Fetch users with pagination (Supabase limit: 50 users per request)
      let allUsers: any[] = [];
      let page = 1;
      const perPage = 50; // Supabase limit
      let hasMore = true;

      while (hasMore && page <= 10) {
        // Safety limit: max 500 users
        try {
          const response = await fetch(
            `${supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=${perPage}`,
            {
              headers: {
                apikey: serviceRoleKey,
                Authorization: `Bearer ${serviceRoleKey}`,
              },
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            console.error("API Error:", errorData);
            throw new Error(
              `API Hatası: ${errorData.msg || response.statusText}`
            );
          }

          const data = await response.json();
          const users = data.users || [];

          if (users.length === 0) {
            hasMore = false;
          } else {
            allUsers = allUsers.concat(users);
            page++;
          }
        } catch (error) {
          console.error("Page fetch error:", error);
          hasMore = false;
        }
      }

      // Filter users by email pattern
      const filteredUsers = allUsers.filter(
        (user: any) =>
          user.email && user.email.includes(deleteEmailFilter.trim())
      );

      setCleanupUsers(filteredUsers);

      if (filteredUsers.length === 0) {
        toast.success(
          `"${deleteEmailFilter}" ile eşleşen kullanıcı bulunamadı (toplam ${allUsers.length} kullanıcı kontrol edildi)`
        );
      } else {
        toast.success(
          `${filteredUsers.length} kullanıcı bulundu ("${deleteEmailFilter}" ile eşleşen, toplam ${allUsers.length} kullanıcı kontrol edildi)`
        );
      }
    } catch (error) {
      console.error("Fetch users error:", error);
      toast.error(
        `Kullanıcıları getirme hatası: ${
          error instanceof Error ? error.message : "Bilinmeyen hata"
        }`
      );
    } finally {
      setCleanupLoading(false);
    }
  };

  const handleDeleteUsers = async () => {
    if (cleanupUsers.length === 0) {
      toast.error("Silinecek kullanıcı bulunamadı");
      return;
    }

    if (
      !confirm(
        `${cleanupUsers.length} kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!`
      )
    ) {
      return;
    }

    setCleanupLoading(true);
    let deletedCount = 0;
    let failedCount = 0;

    try {
      for (const user of cleanupUsers) {
        try {
          // Delete user_roles first
          const deleteRolesResponse = await fetch(
            `${supabaseUrl}/rest/v1/user_roles?user_id=eq.${user.id}`,
            {
              method: "DELETE",
              headers: {
                apikey: serviceRoleKey,
                Authorization: `Bearer ${serviceRoleKey}`,
              },
            }
          );

          // Delete auth user
          const deleteUserResponse = await fetch(
            `${supabaseUrl}/auth/v1/admin/users/${user.id}`,
            {
              method: "DELETE",
              headers: {
                apikey: serviceRoleKey,
                Authorization: `Bearer ${serviceRoleKey}`,
              },
            }
          );

          if (deleteUserResponse.ok) {
            deletedCount++;
            console.log(`Deleted user: ${user.email}`);
          } else {
            failedCount++;
            console.error(`Failed to delete user: ${user.email}`);
          }
        } catch (error) {
          failedCount++;
          console.error(`Error deleting user ${user.email}:`, error);
        }
      }

      setCleanupUsers([]);

      if (deletedCount > 0) {
        toast.success(`${deletedCount} kullanıcı başarıyla silindi`);
      }

      if (failedCount > 0) {
        toast.error(`${failedCount} kullanıcı silinemedi`);
      }
    } catch (error) {
      console.error("Delete users error:", error);
      toast.error(
        `Kullanıcı silme hatası: ${
          error instanceof Error ? error.message : "Bilinmeyen hata"
        }`
      );
    } finally {
      setCleanupLoading(false);
    }
  };

  const handleRestoreClassIds = async () => {
    if (!supabaseUrl || !serviceRoleKey) {
      toast.error("Lütfen Supabase URL ve Service Role Key girin");
      return;
    }

    if (
      !supabaseUrl.startsWith("https://") ||
      !supabaseUrl.includes(".supabase.co")
    ) {
      toast.error("Geçersiz Supabase URL formatı");
      return;
    }

    if (!serviceRoleKey.startsWith("eyJ")) {
      toast.error("Geçersiz Service Role Key formatı");
      return;
    }

    setRestoreClassIdsLoading(true);
    setRestoreClassIdsResults(null);

    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ student: string; error: string }>,
    };

    let allStudents: any[] = [];

    try {
      // Step 1: Fetch all students (user_roles where role='student')
      console.log("Fetching all students...");
      let page = 0;
      const perPage = 1000;
      let hasMore = true;

      while (hasMore) {
        const response = await fetch(
          `${supabaseUrl}/rest/v1/user_roles?role=eq.student&select=id,user_id,class_id,display_name&limit=${perPage}&offset=${
            page * perPage
          }`,
          {
            headers: {
              apikey: serviceRoleKey,
              Authorization: `Bearer ${serviceRoleKey}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch students: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.length === 0) {
          hasMore = false;
        } else {
          allStudents = allStudents.concat(data);
          page++;
          if (data.length < perPage) {
            hasMore = false;
          }
        }
      }

      console.log(`Found ${allStudents.length} students`);

      // Step 2: Fetch all classes
      console.log("Fetching all classes...");
      const classesResponse = await fetch(
        `${supabaseUrl}/rest/v1/classes?select=id,name`,
        {
          headers: {
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
          },
        }
      );

      if (!classesResponse.ok) {
        throw new Error(
          `Failed to fetch classes: ${classesResponse.statusText}`
        );
      }

      const classes = await classesResponse.json();
      const classMap = new Map<string, string>();
      classes.forEach((cls: any) => {
        classMap.set(cls.name, cls.id);
      });

      console.log(`Found ${classes.length} classes`);

      // Step 3: Fetch all teacher_classes
      console.log("Fetching all teacher_classes...");
      let allTeacherClasses: any[] = [];
      page = 0;
      hasMore = true;

      while (hasMore) {
        const response = await fetch(
          `${supabaseUrl}/rest/v1/teacher_classes?select=teacher_id,class_id&limit=${perPage}&offset=${
            page * perPage
          }`,
          {
            headers: {
              apikey: serviceRoleKey,
              Authorization: `Bearer ${serviceRoleKey}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch teacher_classes: ${response.statusText}`
          );
        }

        const data = await response.json();
        if (data.length === 0) {
          hasMore = false;
        } else {
          allTeacherClasses = allTeacherClasses.concat(data);
          page++;
          if (data.length < perPage) {
            hasMore = false;
          }
        }
      }

      console.log(`Found ${allTeacherClasses.length} teacher_classes`);

      // Step 4: Build teacher to classes map
      const teacherClassesMap = new Map<string, Set<string>>();
      allTeacherClasses.forEach((tc: any) => {
        if (!teacherClassesMap.has(tc.teacher_id)) {
          teacherClassesMap.set(tc.teacher_id, new Set());
        }
        teacherClassesMap.get(tc.teacher_id)!.add(tc.class_id);
      });

      // Step 5: Fetch all teachers (user_roles where role='teacher')
      console.log("Fetching all teachers...");
      let allTeachers: any[] = [];
      page = 0;
      hasMore = true;

      while (hasMore) {
        const response = await fetch(
          `${supabaseUrl}/rest/v1/user_roles?role=eq.teacher&select=user_id,display_name&limit=${perPage}&offset=${
            page * perPage
          }`,
          {
            headers: {
              apikey: serviceRoleKey,
              Authorization: `Bearer ${serviceRoleKey}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch teachers: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.length === 0) {
          hasMore = false;
        } else {
          allTeachers = allTeachers.concat(data);
          page++;
          if (data.length < perPage) {
            hasMore = false;
          }
        }
      }

      console.log(`Found ${allTeachers.length} teachers`);

      // Step 6: Build teacher name to user_id map
      const teacherNameMap = new Map<string, string>();
      allTeachers.forEach((teacher: any) => {
        teacherNameMap.set(teacher.display_name, teacher.user_id);
      });

      // Step 7: Fetch all auth users to get emails and metadata
      console.log("Fetching auth users...");
      let allUsers: any[] = [];
      page = 1;
      hasMore = true;

      while (hasMore && page <= 20) {
        const response = await fetch(
          `${supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=${perPage}`,
          {
            headers: {
              apikey: serviceRoleKey,
              Authorization: `Bearer ${serviceRoleKey}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const users = data.users || [];
          if (users.length === 0) {
            hasMore = false;
          } else {
            allUsers = allUsers.concat(users);
            page++;
          }
        } else {
          hasMore = false;
        }
      }

      console.log(`Found ${allUsers.length} auth users`);

      // Step 8: Process each student
      for (const student of allStudents) {
        try {
          // Skip if class_id already exists
          if (student.class_id) {
            console.log(
              `Student ${student.display_name} already has class_id: ${student.class_id}`
            );
            continue;
          }

          // Get student's auth user info
          const authUser = allUsers.find((u: any) => u.id === student.user_id);
          if (!authUser) {
            throw new Error("Auth user not found");
          }

          // Try to extract className from email or metadata
          // Email format: name.parts@iklim.proje
          // We need to find the class name from the student's data
          // Since we don't have className in user_roles, we'll use the students from localStorage
          // But wait, we need to match by email

          const studentEmail = authUser.email;
          const studentFromLocal = students.find(
            (s) => s.email === studentEmail
          );

          if (!studentFromLocal) {
            // Try to find class from teacher_classes by matching student's teacher
            // We need to find which teacher this student belongs to
            // Since we don't have teacherName in user_roles, we'll need another approach

            // Alternative: Find all classes that have teachers, and match by some logic
            // But this is complex. Let's use a simpler approach:
            // Find the class_id from teacher_classes where the teacher has the most students
            // Or better: Use the students from localStorage to match

            throw new Error(
              "Öğrenci bilgisi bulunamadı. Lütfen önce öğrenci listesini yükleyin."
            );
          }

          const className = studentFromLocal.className;
          const teacherName = studentFromLocal.teacherName;

          if (!className) {
            throw new Error("Sınıf bilgisi bulunamadı");
          }

          // Find class_id from class name
          const classId = classMap.get(className);
          if (!classId) {
            throw new Error(`Sınıf bulunamadı: ${className}`);
          }

          // If teacherName is available, verify it matches
          if (teacherName) {
            const teacherUserId = teacherNameMap.get(teacherName);
            if (teacherUserId) {
              const teacherClassIds = teacherClassesMap.get(teacherUserId);
              if (teacherClassIds && !teacherClassIds.has(classId)) {
                console.warn(
                  `Teacher ${teacherName} does not have class ${className}, but updating anyway`
                );
              }
            }
          }

          // Update student's class_id
          const updateResponse = await fetch(
            `${supabaseUrl}/rest/v1/user_roles?id=eq.${student.id}`,
            {
              method: "PATCH",
              headers: {
                apikey: serviceRoleKey,
                Authorization: `Bearer ${serviceRoleKey}`,
                "Content-Type": "application/json",
                Prefer: "return=minimal",
              },
              body: JSON.stringify({
                class_id: classId,
              }),
            }
          );

          if (!updateResponse.ok) {
            const errorData = await updateResponse.json();
            throw new Error(
              `Güncelleme hatası: ${
                errorData.message || updateResponse.statusText
              }`
            );
          }

          results.success++;
          console.log(
            `Updated student ${student.display_name} with class_id: ${classId} (${className})`
          );
        } catch (error) {
          results.failed++;
          results.errors.push({
            student: student.display_name || "Bilinmeyen öğrenci",
            error: error instanceof Error ? error.message : "Bilinmeyen hata",
          });
          console.error(
            `Error updating student ${student.display_name}:`,
            error
          );
        }
      }
    } catch (error) {
      results.failed = allStudents.length;
      results.errors.push({
        student: "Sistem Hatası",
        error:
          error instanceof Error ? error.message : "Bilinmeyen sistem hatası",
      });
      console.error("Restore class_ids error:", error);
    }

    setRestoreClassIdsResults(results);
    setRestoreClassIdsLoading(false);

    if (results.success > 0) {
      toast.success(`${results.success} öğrencinin class_id'si güncellendi`);
    }

    if (results.failed > 0) {
      toast.error(`${results.failed} öğrenci güncellenemedi`);
    }
  };

  const handleLinkStudentsToClasses = async () => {
    if (!supabaseUrl || !serviceRoleKey) {
      toast.error("Lütfen Supabase URL ve Service Role Key girin");
      return;
    }

    if (linkStudentsData.length === 0) {
      toast.error("Lütfen önce Excel dosyasını yükleyin");
      return;
    }

    setLinkStudentsLoading(true);
    setLinkStudentsResults(null);

    const results = {
      classesCreated: 0,
      studentsLinked: 0,
      teacherClassesCreated: 0,
      failed: 0,
      errors: [] as Array<{ item: string; error: string }>,
    };

    try {
      // Step 1: Process the data and create unique classes
      const classMap = new Map<
        string,
        { className: string; teacherName?: string }
      >();

      linkStudentsData.forEach((row) => {
        const okulismi = (
          row["Okulismi"] ||
          row["okulismi"] ||
          row["OKULISMI"] ||
          ""
        )
          .toString()
          .trim();
        const sinif = (
          row["Sınıf"] ||
          row["Sinif"] ||
          row["sinif"] ||
          row["SINIF"] ||
          ""
        )
          .toString()
          .trim();
        const hoca = (row["Hoca"] || row["hoca"] || row["HOCA"] || "")
          .toString()
          .trim();

        if (okulismi && sinif) {
          // Create class name: okulismi + sinif (e.g., "Ahmet Ali Aşçı Ortaokulu / Uşak.A")
          const className = `${okulismi}.${sinif}`;
          const key = className;

          if (!classMap.has(key)) {
            classMap.set(key, { className, teacherName: hoca || undefined });
          } else {
            // If teacher name is missing but we have it now, update it
            const existing = classMap.get(key)!;
            if (!existing.teacherName && hoca) {
              existing.teacherName = hoca;
            }
          }
        }
      });

      console.log(`Found ${classMap.size} unique classes to create`);

      // Step 2: Create classes
      const classIdMap = new Map<string, string>();

      for (const [key, classInfo] of classMap.entries()) {
        try {
          // Check if class already exists
          const checkClassResponse = await fetch(
            `${supabaseUrl}/rest/v1/classes?name=eq.${encodeURIComponent(
              classInfo.className
            )}&select=id`,
            {
              headers: {
                apikey: serviceRoleKey,
                Authorization: `Bearer ${serviceRoleKey}`,
              },
            }
          );

          if (checkClassResponse.ok) {
            const classData = await checkClassResponse.json();
            if (classData && classData.length > 0) {
              classIdMap.set(key, classData[0].id);
              console.log(
                `Class already exists: ${classInfo.className} -> ${classData[0].id}`
              );
              continue;
            }
          }

          // Create new class
          const createClassResponse = await fetch(
            `${supabaseUrl}/rest/v1/classes`,
            {
              method: "POST",
              headers: {
                apikey: serviceRoleKey,
                Authorization: `Bearer ${serviceRoleKey}`,
                "Content-Type": "application/json",
                Prefer: "return=representation",
              },
              body: JSON.stringify({
                name: classInfo.className,
                is_active: true,
              }),
            }
          );

          if (createClassResponse.ok) {
            const newClassData = await createClassResponse.json();
            classIdMap.set(key, newClassData[0].id);
            results.classesCreated++;
            console.log(
              `Created new class: ${classInfo.className} -> ${newClassData[0].id}`
            );
          } else {
            const errorData = await createClassResponse.json();
            throw new Error(
              `Class creation failed: ${
                errorData.message || createClassResponse.statusText
              }`
            );
          }
        } catch (error) {
          results.failed++;
          results.errors.push({
            item: classInfo.className,
            error: error instanceof Error ? error.message : "Bilinmeyen hata",
          });
          console.error(`Error creating class ${classInfo.className}:`, error);
        }
      }

      // Step 3: Fetch all students from database (by display_name)
      console.log("Fetching all students from database...");
      let allStudents: any[] = [];
      let page = 0;
      const perPage = 1000;
      let hasMore = true;

      while (hasMore) {
        const response = await fetch(
          `${supabaseUrl}/rest/v1/user_roles?role=eq.student&select=id,user_id,class_id,display_name&limit=${perPage}&offset=${
            page * perPage
          }`,
          {
            headers: {
              apikey: serviceRoleKey,
              Authorization: `Bearer ${serviceRoleKey}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch students: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.length === 0) {
          hasMore = false;
        } else {
          allStudents = allStudents.concat(data);
          page++;
          if (data.length < perPage) {
            hasMore = false;
          }
        }
      }

      console.log(`Found ${allStudents.length} students in database`);

      // Step 4: Create student name to user_roles map
      const studentNameMap = new Map<string, any>();
      allStudents.forEach((student) => {
        const name = student.display_name?.trim().toUpperCase();
        if (name) {
          // Handle multiple students with same name (take the first one without class_id)
          if (!studentNameMap.has(name) || !student.class_id) {
            studentNameMap.set(name, student);
          }
        }
      });

      // Step 5: Link students to classes
      for (const row of linkStudentsData) {
        try {
          const ad = (row["Ad"] || row["ad"] || row["AD"] || "")
            .toString()
            .trim();
          const okulismi = (
            row["Okulismi"] ||
            row["okulismi"] ||
            row["OKULISMI"] ||
            ""
          )
            .toString()
            .trim();
          const sinif = (
            row["Sınıf"] ||
            row["Sinif"] ||
            row["sinif"] ||
            row["SINIF"] ||
            ""
          )
            .toString()
            .trim();
          const hoca = (row["Hoca"] || row["hoca"] || row["HOCA"] || "")
            .toString()
            .trim();

          if (!ad || !okulismi || !sinif) {
            continue;
          }

          const className = `${okulismi}.${sinif}`;
          const classId = classIdMap.get(className);

          if (!classId) {
            results.failed++;
            results.errors.push({
              item: ad,
              error: `Sınıf bulunamadı: ${className}`,
            });
            continue;
          }

          // Find student by name (case-insensitive)
          const studentNameUpper = ad.toUpperCase();
          const student = studentNameMap.get(studentNameUpper);

          if (!student) {
            results.failed++;
            results.errors.push({
              item: ad,
              error: "Öğrenci bulunamadı (isim eşleşmedi)",
            });
            continue;
          }

          // Update student's class_id
          const updateResponse = await fetch(
            `${supabaseUrl}/rest/v1/user_roles?id=eq.${student.id}`,
            {
              method: "PATCH",
              headers: {
                apikey: serviceRoleKey,
                Authorization: `Bearer ${serviceRoleKey}`,
                "Content-Type": "application/json",
                Prefer: "return=minimal",
              },
              body: JSON.stringify({
                class_id: classId,
              }),
            }
          );

          if (!updateResponse.ok) {
            const errorData = await updateResponse.json();
            throw new Error(
              `Güncelleme hatası: ${
                errorData.message || updateResponse.statusText
              }`
            );
          }

          results.studentsLinked++;
          console.log(
            `Linked student ${ad} to class ${className} (${classId})`
          );
        } catch (error) {
          results.failed++;
          results.errors.push({
            item: row["Ad"] || "Bilinmeyen",
            error: error instanceof Error ? error.message : "Bilinmeyen hata",
          });
          console.error(`Error linking student:`, error);
        }
      }

      // Step 6: Create teacher_classes entries
      if (results.studentsLinked > 0) {
        console.log("Creating teacher_classes entries...");

        // Fetch all teachers
        let allTeachers: any[] = [];
        page = 0;
        hasMore = true;

        while (hasMore) {
          const response = await fetch(
            `${supabaseUrl}/rest/v1/user_roles?role=eq.teacher&select=user_id,display_name&limit=${perPage}&offset=${
              page * perPage
            }`,
            {
              headers: {
                apikey: serviceRoleKey,
                Authorization: `Bearer ${serviceRoleKey}`,
              },
            }
          );

          if (!response.ok) {
            break;
          }

          const data = await response.json();
          if (data.length === 0) {
            hasMore = false;
          } else {
            allTeachers = allTeachers.concat(data);
            page++;
            if (data.length < perPage) {
              hasMore = false;
            }
          }
        }

        // Create teacher name to user_id map
        const teacherNameMap = new Map<string, string>();
        allTeachers.forEach((teacher) => {
          const name = teacher.display_name?.trim();
          if (name) {
            teacherNameMap.set(name, teacher.user_id);
          }
        });

        // Create teacher_classes for each class with a teacher
        for (const [key, classInfo] of classMap.entries()) {
          if (!classInfo.teacherName) {
            continue;
          }

          const classId = classIdMap.get(key);
          if (!classId) {
            continue;
          }

          const teacherUserId = teacherNameMap.get(classInfo.teacherName);
          if (!teacherUserId) {
            console.warn(
              `Teacher not found: ${classInfo.teacherName} for class ${classInfo.className}`
            );
            continue;
          }

          try {
            // Check if teacher_classes entry already exists
            const checkResponse = await fetch(
              `${supabaseUrl}/rest/v1/teacher_classes?teacher_id=eq.${teacherUserId}&class_id=eq.${classId}&select=id`,
              {
                headers: {
                  apikey: serviceRoleKey,
                  Authorization: `Bearer ${serviceRoleKey}`,
                },
              }
            );

            if (checkResponse.ok) {
              const existing = await checkResponse.json();
              if (existing && existing.length > 0) {
                console.log(
                  `Teacher_classes already exists: ${classInfo.teacherName} -> ${classInfo.className}`
                );
                continue;
              }
            }

            // Create teacher_classes entry
            const createResponse = await fetch(
              `${supabaseUrl}/rest/v1/teacher_classes`,
              {
                method: "POST",
                headers: {
                  apikey: serviceRoleKey,
                  Authorization: `Bearer ${serviceRoleKey}`,
                  "Content-Type": "application/json",
                  Prefer: "return=minimal",
                },
                body: JSON.stringify({
                  teacher_id: teacherUserId,
                  class_id: classId,
                }),
              }
            );

            if (createResponse.ok) {
              results.teacherClassesCreated++;
              console.log(
                `Created teacher_classes: ${classInfo.teacherName} -> ${classInfo.className}`
              );
            } else {
              const errorData = await createResponse.json();
              console.error(
                `Failed to create teacher_classes: ${
                  errorData.message || createResponse.statusText
                }`
              );
            }
          } catch (error) {
            console.error(
              `Error creating teacher_classes for ${classInfo.teacherName}:`,
              error
            );
          }
        }
      }
    } catch (error) {
      results.failed = linkStudentsData.length;
      results.errors.push({
        item: "Sistem Hatası",
        error:
          error instanceof Error ? error.message : "Bilinmeyen sistem hatası",
      });
      console.error("Link students error:", error);
    }

    setLinkStudentsResults(results);
    setLinkStudentsLoading(false);

    if (results.classesCreated > 0) {
      toast.success(`${results.classesCreated} sınıf oluşturuldu`);
    }
    if (results.studentsLinked > 0) {
      toast.success(`${results.studentsLinked} öğrenci bağlandı`);
    }
    if (results.teacherClassesCreated > 0) {
      toast.success(
        `${results.teacherClassesCreated} öğretmen-sınıf bağlantısı oluşturuldu`
      );
    }
    if (results.failed > 0) {
      toast.error(`${results.failed} işlem başarısız oldu`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Öğrenci Toplu Kayıt Sistemi
          </h1>
          <p className="text-muted-foreground text-lg">
            Excel/CSV dosyasından öğrencileri Supabase'e toplu olarak ekleyin
          </p>
        </div>

        {/* File Upload Section */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6 mb-6">
          <FileUploader
            onFileProcessed={handleFileProcessed}
            onError={handleError}
          />
        </Card>

        {/* Link Students Section */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6 mb-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Öğrencileri Sınıflara Bağla
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Bu özellik, yeni formattaki Excel dosyasını (Okulismi, Sınıf,
                Hoca, Numara, Ad) yükleyip, mevcut öğrencileri isimlerine göre
                bulur ve yeni oluşturulan sınıflara bağlar. Yeni öğrenci
                oluşturmaz, sadece mevcut öğrencileri bağlar.
              </p>
            </div>
            <FileUploader
              onFileProcessed={handleLinkStudentsFileProcessed}
              onError={handleError}
            />
            {linkStudentsData.length > 0 ? (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-sm text-blue-400">
                  <strong>{linkStudentsData.length}</strong> kayıt yüklendi.
                  Bağlama işlemini başlatabilirsiniz.
                </p>
              </div>
            ) : (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <p className="text-sm text-yellow-400">
                  Excel dosyası yüklenmedi veya veri okunamadı. Lütfen dosyayı
                  kontrol edin.
                  <br />
                  <span className="text-xs mt-2 block">
                    Gerekli sütunlar: <strong>Okulismi</strong>,{" "}
                    <strong>Sınıf</strong>, <strong>Ad</strong>,{" "}
                    <strong>Numara</strong>
                    <br />
                    İsteğe bağlı: <strong>Hoca</strong>
                  </span>
                </p>
              </div>
            )}
            <div className="space-y-3">
              <div>
                <Label htmlFor="link-supabase-url" className="text-foreground">
                  Supabase Proje URL'si
                </Label>
                <Input
                  id="link-supabase-url"
                  type="url"
                  placeholder="https://xxxxx.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="mt-2"
                  disabled={linkStudentsLoading}
                />
              </div>
              <div>
                <Label
                  htmlFor="link-service-role-key"
                  className="text-foreground"
                >
                  Service Role Key
                </Label>
                <div className="relative mt-2">
                  <Input
                    id="link-service-role-key"
                    type={showServiceKey ? "text" : "password"}
                    placeholder="eyJhbG..."
                    value={serviceRoleKey}
                    onChange={(e) => setServiceRoleKey(e.target.value)}
                    className="pr-10"
                    disabled={linkStudentsLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowServiceKey(!showServiceKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showServiceKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <Button
                onClick={handleLinkStudentsToClasses}
                disabled={
                  linkStudentsLoading ||
                  !supabaseUrl ||
                  !serviceRoleKey ||
                  linkStudentsData.length === 0
                }
                className="w-full gap-2"
                size="lg"
                title={
                  !supabaseUrl
                    ? "Supabase URL gerekli"
                    : !serviceRoleKey
                    ? "Service Role Key gerekli"
                    : linkStudentsData.length === 0
                    ? "Excel dosyası yüklenmedi veya boş"
                    : "Bağlama işlemini başlat"
                }
              >
                {linkStudentsLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Bağlanıyor...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Öğrencileri Sınıflara Bağla
                  </>
                )}
              </Button>
              {linkStudentsResults && (
                <div className="space-y-2 mt-4">
                  <div className="grid grid-cols-3 gap-2">
                    <Card className="bg-green-500/10 border-green-500/20 p-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <div>
                          <p className="text-xs text-green-400/70">
                            Sınıf Oluşturuldu
                          </p>
                          <p className="text-lg font-bold text-green-400">
                            {linkStudentsResults.classesCreated}
                          </p>
                        </div>
                      </div>
                    </Card>
                    <Card className="bg-blue-500/10 border-blue-500/20 p-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                        <div>
                          <p className="text-xs text-blue-400/70">
                            Öğrenci Bağlandı
                          </p>
                          <p className="text-lg font-bold text-blue-400">
                            {linkStudentsResults.studentsLinked}
                          </p>
                        </div>
                      </div>
                    </Card>
                    <Card className="bg-purple-500/10 border-purple-500/20 p-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-purple-500" />
                        <div>
                          <p className="text-xs text-purple-400/70">
                            Öğretmen-Sınıf
                          </p>
                          <p className="text-lg font-bold text-purple-400">
                            {linkStudentsResults.teacherClassesCreated}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                  {linkStudentsResults.errors.length > 0 && (
                    <Card className="bg-red-500/10 border-red-500/20 p-3">
                      <h4 className="font-semibold text-red-400 mb-2 text-sm">
                        Hata Detayları ({linkStudentsResults.errors.length})
                      </h4>
                      <ul className="text-xs text-red-400/90 space-y-1 max-h-48 overflow-y-auto">
                        {linkStudentsResults.errors
                          .slice(0, 20)
                          .map((error, index) => (
                            <li key={index}>
                              <strong>{error.item}:</strong> {error.error}
                            </li>
                          ))}
                        {linkStudentsResults.errors.length > 20 && (
                          <li>
                            ... ve {linkStudentsResults.errors.length - 20} hata
                            daha
                          </li>
                        )}
                      </ul>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Error Display */}
        {errors.length > 0 && (
          <Card className="bg-destructive/10 backdrop-blur-lg border-destructive/20 p-4 mb-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
              <div>
                <h3 className="font-semibold text-destructive mb-2">
                  İşleme Hataları
                </h3>
                <ul className="text-sm text-destructive/90 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        )}

        {/* Main Content */}
        {students.length > 0 && (
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6">
            {/* Preview Section */}
            <div className="space-y-6">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <h3 className="text-xl font-semibold text-foreground">
                  Önizleme
                </h3>
                <div className="flex gap-2">
                  <Button onClick={handleDownloadHTMLs} className="gap-2">
                    <FileText className="w-4 h-4" />
                    HTML Listeleri İndir (ZIP)
                  </Button>
                  {students.length > 0 && (
                    <Button
                      onClick={handleClearData}
                      variant="outline"
                      className="gap-2"
                    >
                      <X className="w-4 h-4" />
                      Verileri Temizle
                    </Button>
                  )}
                </div>
              </div>

              {/* Nested Tabs for Classes, Students, and Teachers */}
              <Tabs value={previewSubTab} onValueChange={setPreviewSubTab}>
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="classes">
                    Sınıflar ({classGroups.length})
                  </TabsTrigger>
                  <TabsTrigger value="students">
                    Öğrenciler ({students.length})
                  </TabsTrigger>
                  <TabsTrigger value="teachers">
                    Öğretmenler ({teachers.length})
                  </TabsTrigger>
                </TabsList>

                {/* Classes Tab */}
                <TabsContent value="classes">
                  <div className="space-y-4">
                    {/* Pagination Calculations */}
                    {(() => {
                      const itemsPerPage = 10;
                      const totalPages = Math.ceil(
                        classGroups.length / itemsPerPage
                      );
                      const startIndex = (classesPage - 1) * itemsPerPage;
                      const endIndex = startIndex + itemsPerPage;
                      const paginatedGroups = classGroups.slice(
                        startIndex,
                        endIndex
                      );

                      return (
                        <>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-white/20">
                                  <th className="text-left py-3 px-4 text-foreground">
                                    Sınıf
                                  </th>
                                  <th className="text-left py-3 px-4 text-foreground">
                                    Öğretmen
                                  </th>
                                  <th className="text-left py-3 px-4 text-foreground">
                                    Öğrenci Sayısı
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {paginatedGroups.map((group, index) => (
                                  <tr
                                    key={startIndex + index}
                                    className="border-b border-white/10 hover:bg-white/5"
                                  >
                                    <td className="py-3 px-4 text-foreground font-medium">
                                      {group.className}
                                    </td>
                                    <td className="py-3 px-4 text-foreground">
                                      {group.teacherName}
                                    </td>
                                    <td className="py-3 px-4 text-foreground">
                                      {group.students.length}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Pagination Controls */}
                          {totalPages > 1 && (
                            <div className="flex items-center justify-between pt-4 border-t border-white/20">
                              <div className="text-sm text-muted-foreground">
                                Sayfa {classesPage} / {totalPages} (Toplam{" "}
                                {classGroups.length} sınıf)
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setClassesPage((p) => Math.max(1, p - 1))
                                  }
                                  disabled={classesPage === 1}
                                  className="gap-1"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                  Önceki
                                </Button>
                                <div className="flex items-center gap-1">
                                  {Array.from(
                                    { length: Math.min(5, totalPages) },
                                    (_, i) => {
                                      let pageNum;
                                      if (totalPages <= 5) {
                                        pageNum = i + 1;
                                      } else if (classesPage <= 3) {
                                        pageNum = i + 1;
                                      } else if (
                                        classesPage >=
                                        totalPages - 2
                                      ) {
                                        pageNum = totalPages - 4 + i;
                                      } else {
                                        pageNum = classesPage - 2 + i;
                                      }
                                      return (
                                        <Button
                                          key={pageNum}
                                          variant={
                                            classesPage === pageNum
                                              ? "default"
                                              : "outline"
                                          }
                                          size="sm"
                                          onClick={() =>
                                            setClassesPage(pageNum)
                                          }
                                          className="w-8 h-8 p-0"
                                        >
                                          {pageNum}
                                        </Button>
                                      );
                                    }
                                  )}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setClassesPage((p) =>
                                      Math.min(totalPages, p + 1)
                                    )
                                  }
                                  disabled={classesPage === totalPages}
                                  className="gap-1"
                                >
                                  Sonraki
                                  <ChevronRight className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </TabsContent>

                {/* Students Tab */}
                <TabsContent value="students">
                  <div className="space-y-4">
                    {/* Pagination Calculations */}
                    {(() => {
                      const itemsPerPage = 15;
                      const totalPages = Math.ceil(
                        students.length / itemsPerPage
                      );
                      const startIndex = (studentsPage - 1) * itemsPerPage;
                      const endIndex = startIndex + itemsPerPage;
                      const paginatedStudents = students.slice(
                        startIndex,
                        endIndex
                      );

                      return (
                        <>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-white/20">
                                  <th className="text-left py-3 px-4 text-foreground">
                                    Ad Soyad
                                  </th>
                                  <th className="text-left py-3 px-4 text-foreground">
                                    Hoca
                                  </th>
                                  <th className="text-left py-3 px-4 text-foreground">
                                    Sınıf
                                  </th>
                                  <th className="text-left py-3 px-4 text-foreground">
                                    No
                                  </th>
                                  <th className="text-left py-3 px-4 text-foreground">
                                    Email
                                  </th>
                                  <th className="text-left py-3 px-4 text-foreground">
                                    Parola
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {paginatedStudents.map((student, index) => (
                                  <tr
                                    key={startIndex + index}
                                    className="border-b border-white/10 hover:bg-white/5"
                                  >
                                    <td className="py-3 px-4 text-foreground">
                                      {student.fullName}
                                    </td>
                                    <td className="py-3 px-4 text-foreground">
                                      {student.teacherName || "-"}
                                    </td>
                                    <td className="py-3 px-4 text-foreground">
                                      {student.className}
                                    </td>
                                    <td className="py-3 px-4 text-foreground">
                                      {student.studentNo}
                                    </td>
                                    <td className="py-3 px-4 text-muted-foreground font-mono text-sm">
                                      {student.email}
                                    </td>
                                    <td className="py-3 px-4 text-muted-foreground font-mono text-sm">
                                      {student.password}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Pagination Controls */}
                          {totalPages > 1 && (
                            <div className="flex items-center justify-between pt-4 border-t border-white/20">
                              <div className="text-sm text-muted-foreground">
                                Sayfa {studentsPage} / {totalPages} (Toplam{" "}
                                {students.length} öğrenci)
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setStudentsPage((p) => Math.max(1, p - 1))
                                  }
                                  disabled={studentsPage === 1}
                                  className="gap-1"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                  Önceki
                                </Button>
                                <div className="flex items-center gap-1">
                                  {Array.from(
                                    { length: Math.min(5, totalPages) },
                                    (_, i) => {
                                      let pageNum;
                                      if (totalPages <= 5) {
                                        pageNum = i + 1;
                                      } else if (studentsPage <= 3) {
                                        pageNum = i + 1;
                                      } else if (
                                        studentsPage >=
                                        totalPages - 2
                                      ) {
                                        pageNum = totalPages - 4 + i;
                                      } else {
                                        pageNum = studentsPage - 2 + i;
                                      }
                                      return (
                                        <Button
                                          key={pageNum}
                                          variant={
                                            studentsPage === pageNum
                                              ? "default"
                                              : "outline"
                                          }
                                          size="sm"
                                          onClick={() =>
                                            setStudentsPage(pageNum)
                                          }
                                          className="w-8 h-8 p-0"
                                        >
                                          {pageNum}
                                        </Button>
                                      );
                                    }
                                  )}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setStudentsPage((p) =>
                                      Math.min(totalPages, p + 1)
                                    )
                                  }
                                  disabled={studentsPage === totalPages}
                                  className="gap-1"
                                >
                                  Sonraki
                                  <ChevronRight className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </TabsContent>

                {/* Teachers Tab */}
                <TabsContent value="teachers">
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/20">
                            <th className="text-left py-3 px-4 text-foreground">
                              Ad Soyad
                            </th>
                            <th className="text-left py-3 px-4 text-foreground">
                              Email
                            </th>
                            <th className="text-left py-3 px-4 text-foreground">
                              Parola
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {teachers.length > 0 ? (
                            teachers.map((teacher, index) => (
                              <tr
                                key={index}
                                className="border-b border-white/10 hover:bg-white/5"
                              >
                                <td className="py-3 px-4 text-foreground font-medium">
                                  {teacher.name}
                                </td>
                                <td className="py-3 px-4 text-muted-foreground font-mono text-sm">
                                  {teacher.email}
                                </td>
                                <td className="py-3 px-4 text-muted-foreground font-mono text-sm">
                                  {teacher.password}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan={3}
                                className="py-8 text-center text-muted-foreground"
                              >
                                Öğretmen bulunamadı. Öğrenci verilerinde "Hoca"
                                sütunu bulunduğundan emin olun.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Doğrudan Yükle Section */}
            <div className="space-y-6 mt-8 pt-6 border-t border-white/20">
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Doğrudan Yükle
              </h3>
              <div className="space-y-6">
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <p className="text-sm text-yellow-400 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Uyarı:</strong> Bu işlem admin yetkilerine sahip
                      bir Service Role Key gerektirir. Bu anahtarı asla
                      paylaşmayın veya client tarafında göstermeyin. Service
                      Role Key'i Project Settings {">"} API {">"} service_role
                      bölümünden alabilirsiniz.
                    </span>
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="supabase-url" className="text-foreground">
                      Supabase Proje URL'si
                    </Label>
                    <Input
                      id="supabase-url"
                      type="url"
                      placeholder="https://xxxxx.supabase.co"
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                      className="mt-2"
                      disabled={uploading}
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="service-role-key"
                      className="text-foreground"
                    >
                      Service Role Key
                    </Label>
                    <div className="relative mt-2">
                      <Input
                        id="service-role-key"
                        type={showServiceKey ? "text" : "password"}
                        placeholder="eyJhbG..."
                        value={serviceRoleKey}
                        onChange={(e) => setServiceRoleKey(e.target.value)}
                        className="pr-10"
                        disabled={uploading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowServiceKey(!showServiceKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showServiceKey ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Upload Options */}
                  <div className="space-y-3 border-t border-white/20 pt-4">
                    <Label className="text-foreground font-semibold">
                      Yüklenecek İçerik
                    </Label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="upload-classes"
                          checked={uploadClasses}
                          onCheckedChange={(checked) =>
                            setUploadClasses(checked === true)
                          }
                          disabled={uploading}
                        />
                        <Label
                          htmlFor="upload-classes"
                          className="text-sm font-normal cursor-pointer"
                        >
                          Sınıflar ({classGroups.length})
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="upload-students"
                          checked={uploadStudents}
                          onCheckedChange={(checked) =>
                            setUploadStudents(checked === true)
                          }
                          disabled={uploading}
                        />
                        <Label
                          htmlFor="upload-students"
                          className="text-sm font-normal cursor-pointer"
                        >
                          Öğrenciler ({students.length})
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="upload-teachers"
                          checked={uploadTeachers}
                          onCheckedChange={(checked) =>
                            setUploadTeachers(checked === true)
                          }
                          disabled={uploading}
                        />
                        <Label
                          htmlFor="upload-teachers"
                          className="text-sm font-normal cursor-pointer"
                        >
                          Öğretmenler ({teachers.length})
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={handleApiUpload}
                      disabled={
                        uploading ||
                        !supabaseUrl ||
                        !serviceRoleKey ||
                        (!uploadClasses && !uploadStudents && !uploadTeachers)
                      }
                      className="w-full gap-2"
                      size="lg"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Yükleniyor... ({uploadProgress.current}/
                          {uploadProgress.total}) - Batch{" "}
                          {Math.ceil(uploadProgress.current / 50)}/
                          {Math.ceil(uploadProgress.total / 50)}
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Yükle
                          {uploadClasses && ` (${classGroups.length} Sınıf)`}
                          {uploadStudents && ` (${students.length} Öğrenci)`}
                          {uploadTeachers && ` (${teachers.length} Öğretmen)`}
                        </>
                      )}
                    </Button>

                    {/* Restore Class IDs Button */}
                    <div className="border-t border-white/20 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-foreground">
                          Class ID'leri Geri Yükle
                        </h4>
                      </div>
                      <div className="space-y-3">
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                          <p className="text-xs text-blue-400">
                            Bu buton, veritabanındaki öğrencilerin
                            class_id'lerini, yüklenen öğrenci listesindeki
                            bilgilere göre otomatik olarak günceller. Öğrencinin
                            sınıfı, öğretmeninin sınıfı ile eşleştirilir.
                          </p>
                        </div>
                        <Button
                          onClick={handleRestoreClassIds}
                          disabled={
                            restoreClassIdsLoading ||
                            !supabaseUrl ||
                            !serviceRoleKey ||
                            students.length === 0
                          }
                          variant="outline"
                          className="w-full gap-2"
                        >
                          {restoreClassIdsLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Class ID'leri Güncelleniyor...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Öğrenci Class ID'lerini Geri Yükle
                            </>
                          )}
                        </Button>
                        {restoreClassIdsResults && (
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <Card className="bg-green-500/10 border-green-500/20 p-3">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                  <div>
                                    <p className="text-xs text-green-400/70">
                                      Başarılı
                                    </p>
                                    <p className="text-lg font-bold text-green-400">
                                      {restoreClassIdsResults.success}
                                    </p>
                                  </div>
                                </div>
                              </Card>
                              <Card className="bg-red-500/10 border-red-500/20 p-3">
                                <div className="flex items-center gap-2">
                                  <AlertCircle className="w-4 h-4 text-red-500" />
                                  <div>
                                    <p className="text-xs text-red-400/70">
                                      Başarısız
                                    </p>
                                    <p className="text-lg font-bold text-red-400">
                                      {restoreClassIdsResults.failed}
                                    </p>
                                  </div>
                                </div>
                              </Card>
                            </div>
                            {restoreClassIdsResults.errors.length > 0 && (
                              <Card className="bg-red-500/10 border-red-500/20 p-3">
                                <h4 className="font-semibold text-red-400 mb-2 text-sm">
                                  Hata Detayları
                                </h4>
                                <ul className="text-xs text-red-400/90 space-y-1 max-h-32 overflow-y-auto">
                                  {restoreClassIdsResults.errors
                                    .slice(0, 10)
                                    .map((error, index) => (
                                      <li key={index}>
                                        <strong>{error.student}:</strong>{" "}
                                        {error.error}
                                      </li>
                                    ))}
                                  {restoreClassIdsResults.errors.length >
                                    10 && (
                                    <li>
                                      ... ve{" "}
                                      {restoreClassIdsResults.errors.length -
                                        10}{" "}
                                      hata daha
                                    </li>
                                  )}
                                </ul>
                              </Card>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-white/20 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-foreground">
                          Kullanıcı Temizleme
                        </h4>
                        <Button
                          onClick={() =>
                            setShowDeleteSection(!showDeleteSection)
                          }
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                        >
                          {showDeleteSection ? "Gizle" : "Gelişmiş"}
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Button
                            onClick={handleFetchUsersThisWeek}
                            disabled={
                              cleanupLoading || !supabaseUrl || !serviceRoleKey
                            }
                            variant="outline"
                            className="gap-2"
                          >
                            {cleanupLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <AlertCircle className="w-4 h-4" />
                            )}
                            Bu Hafta Oluşturulanları Getir
                          </Button>

                          {cleanupUsers.length > 0 && (
                            <Button
                              onClick={handleDeleteUsers}
                              disabled={cleanupLoading}
                              variant="destructive"
                              className="gap-2"
                            >
                              {cleanupLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <AlertCircle className="w-4 h-4" />
                              )}
                              {cleanupUsers.length} Kullanıcıyı Sil
                            </Button>
                          )}
                        </div>

                        {showDeleteSection && (
                          <div className="space-y-2">
                            <Label
                              htmlFor="email-filter"
                              className="text-xs text-foreground"
                            >
                              Email Filtresi (örn: @student.com, @iklim.com)
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                id="email-filter"
                                type="text"
                                placeholder="@student.com"
                                value={deleteEmailFilter}
                                onChange={(e) =>
                                  setDeleteEmailFilter(e.target.value)
                                }
                                className="text-sm"
                                disabled={cleanupLoading}
                              />
                              <Button
                                onClick={handleFetchUsersByEmail}
                                disabled={
                                  cleanupLoading ||
                                  !supabaseUrl ||
                                  !serviceRoleKey ||
                                  !deleteEmailFilter.trim()
                                }
                                variant="outline"
                                size="sm"
                                className="gap-1"
                              >
                                {cleanupLoading ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <AlertCircle className="w-3 h-3" />
                                )}
                                Getir
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      {cleanupUsers.length > 0 && (
                        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                          <p className="text-sm text-red-400 mb-2">
                            <strong>
                              Silinecek Kullanıcılar ({cleanupUsers.length}):
                            </strong>
                          </p>
                          <div className="max-h-32 overflow-y-auto text-xs text-red-400/80">
                            {cleanupUsers.slice(0, 10).map((user, index) => (
                              <div key={index}>
                                {user.email} -{" "}
                                {user.created_at
                                  ? new Date(
                                      user.created_at
                                    ).toLocaleDateString("tr-TR")
                                  : "Tarih bilinmiyor"}
                              </div>
                            ))}
                            {cleanupUsers.length > 10 && (
                              <div>
                                ... ve {cleanupUsers.length - 10} kullanıcı daha
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Results */}
              {uploadResults && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="bg-green-500/10 border-green-500/20 p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="text-sm text-green-400/70">Başarılı</p>
                          <p className="text-2xl font-bold text-green-400">
                            {uploadResults.success}
                          </p>
                        </div>
                      </div>
                    </Card>

                    <Card className="bg-yellow-500/10 border-yellow-500/20 p-4">
                      <div className="flex items-center gap-2">
                        <SkipForward className="w-5 h-5 text-yellow-500" />
                        <div>
                          <p className="text-sm text-yellow-400/70">Atlandı</p>
                          <p className="text-2xl font-bold text-yellow-400">
                            {uploadResults.skipped || 0}
                          </p>
                        </div>
                      </div>
                    </Card>

                    <Card className="bg-red-500/10 border-red-500/20 p-4">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <div>
                          <p className="text-sm text-red-400/70">Başarısız</p>
                          <p className="text-2xl font-bold text-red-400">
                            {uploadResults.failed}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {uploadResults.errors.length > 0 && (
                    <Card className="bg-red-500/10 border-red-500/20 p-4">
                      <h4 className="font-semibold text-red-400 mb-2">
                        Hata Detayları
                      </h4>
                      <ul className="text-sm text-red-400/90 space-y-1 max-h-48 overflow-y-auto">
                        {uploadResults.errors.map((error, index) => (
                          <li key={index}>
                            <strong>{error.student}:</strong> {error.error}
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}

                  {uploadResults.skippedUsers &&
                    uploadResults.skippedUsers.length > 0 && (
                      <Card className="bg-yellow-500/10 border-yellow-500/20 p-4">
                        <h4 className="font-semibold text-yellow-400 mb-2">
                          Atlanan Kullanıcılar
                        </h4>
                        <ul className="text-sm text-yellow-400/90 space-y-1 max-h-48 overflow-y-auto">
                          {uploadResults.skippedUsers.map((skipped, index) => (
                            <li key={index}>
                              <strong>{skipped.student}:</strong>{" "}
                              {skipped.reason}
                            </li>
                          ))}
                        </ul>
                      </Card>
                    )}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6 mt-6">
          <h3 className="text-xl font-semibold text-foreground mb-4">
            Nasıl Kullanılır?
          </h3>
          <ol className="space-y-2 text-muted-foreground">
            <li>
              1. Gerekli sütunlar: <strong>Ad</strong> (G),{" "}
              <strong>Numara</strong> (F), <strong>Sınıf</strong> (C) içeren CSV
              veya Excel dosyası yükleyin. İsteğe bağlı: <strong>Hoca</strong>{" "}
              (E), <strong>Okulkodu</strong> (B)
            </li>
            <li>
              2. İşlenen öğrenci verilerini <strong>Önizleme</strong> sekmesinde
              inceleyin
            </li>
            <li>
              3. Tercih ettiğiniz yöntemi seçin:
              <ul className="ml-6 mt-2 space-y-1">
                <li>
                  • <strong>Önizleme:</strong> Sınıf bazında HTML listeleri ZIP
                  dosyası olarak indirin (örnek: Busra_Manay_7C.html)
                </li>
                <li>
                  • <strong>Doğrudan Yükle:</strong> Öğrencileri doğrudan
                  Supabase'e yükleyin (Service Role Key gerektirir)
                </li>
              </ul>
            </li>
          </ol>

          <div className="mt-4 space-y-3">
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
              <p className="text-sm text-purple-400">
                <strong>Sınıf Formatı:</strong> {"{okul_kodu}.{sınıf_kodu}"}
                <br />
                <strong>Örnek:</strong> e.6a → "e" okul kodu, "6a" sınıf kodu
                <br />
                <strong>Önemli:</strong> Veritabanınızdaki classes tablosunda
                sınıflar bu formatta (e.6a, o.7c, i.8b gibi) oluşturulmalıdır
              </p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <p className="text-sm text-blue-400">
                <strong>Email Formatı:</strong>{" "}
                {"{ad}.{orta_ad}.{soyad}@iklim.proje"}
                <br />
                <strong>Örnek 1:</strong> ahmet badam → ahmet.badam@iklim.proje
                <br />
                <strong>Örnek 2:</strong> uğur ediz dumantepe →
                ugur.ediz.dumantepe@iklim.proje
                <br />
                <strong>Not:</strong> Tüm isim parçaları dahil edilir ve Türkçe
                karakterler İngilizce'ye çevrilir
              </p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <p className="text-sm text-blue-400">
                <strong>Parola Formatı:</strong>{" "}
                {"{isim_baş_harfi}{soyisim_baş_harfi}{karakter_sayısı}"}
                <br />
                <strong>Örnek 1:</strong> ahmet badam → Parola: ab10
                <br />
                <strong>Örnek 2:</strong> selim ercan → Parola: se10
                <br />
                <strong>Örnek 3:</strong> muhammed efe yıldız → Parola: my18
                <br />
                <strong>Not:</strong> Türkçe karakterler İngilizce'ye çevrilir
                ve harf sayısı hesaplanır
              </p>
            </div>

            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <p className="text-sm text-green-400">
                <strong>Öğrenci Rolü:</strong> Tüm kayıtlar otomatik olarak{" "}
                <strong>'student'</strong> rolü ile oluşturulur
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Index;
