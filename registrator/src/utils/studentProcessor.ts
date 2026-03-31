import JSZip from 'jszip';
import { StudentData } from '@/types/student';
import { convertTurkishToEnglish, cleanClassName, getOriginalClassName, padStudentNo, toProperCase } from './turkishCharacters';

export const processStudentData = (data: any[]): { students: StudentData[], errors: string[] } => {
  const students: StudentData[] = [];
  const errors: string[] = [];

  data.forEach((row, index) => {
    try {
      // Support multiple formats: "Ad", "Ad Soyad", "Ad-Soyad"
      const fullName = row['Ad'] || row['ad'] || row['AD'] ||
                       row['Ad Soyad'] || row['ad soyad'] || row['AD SOYAD'] || 
                       row['Ad-Soyad'] || row['ad-soyad'] || row['AD-SOYAD'];
      
      // Get school code - check for "Okulkodu" first, then old formats
      const schoolCode = (row['Okulkodu'] || row['okulkodu'] || row['OKULKODU'] ||
                         row['Okul kod'] || row['okul kod'] || row['OKUL KOD'] ||
                         row['Okul_kod'] || row['okul_kod'] || row['OKUL_KOD'] || '').toString().trim().toLowerCase();
      
      // Get class code (Sınıf)
      let classCode = (row['Sınıf'] || row['Sinif'] || row['sinif'] || row['SINIF'] || '').toString().trim();
      
      // Support "Numara" first, then old formats
      const studentNo = row['Numara'] || row['numara'] || row['NUMARA'] || row['Num'] || row['num'] ||
                        row['No'] || row['no'] || row['NO'] || 
                        row['Okul no'] || row['okul no'] || row['OKUL NO'];
      
      // Get teacher name - check for "Hoca" first, then other variations
      const teacherName = row['Hoca'] || row['hoca'] || row['HOCA'] ||
                         row['Teacher'] || row['teacher'] || row['TEACHER'] ||
                         row['Öğretmen'] || row['ogretmen'] || row['OGRETMEN'] ||
                         row['öğretmen'] || '';

      if (!fullName || !classCode || !studentNo) {
        errors.push(`Satır ${index + 2}: Eksik zorunlu alanlar (Ad, Sınıf, Numara gerekli)`);
        return;
      }

      // Build full class name: combine school code with class
      let className = classCode;
      if (schoolCode) {
        // Use Okul_kod.Sınıf format
        className = `${schoolCode}.${classCode}`;
      } else {
        // If no school code, use just class code
        className = classCode;
      }

      // Get original class name for database matching (e.g., "e.6a")
      const originalClass = getOriginalClassName(className);
      
      // Clean class name for password (e.g., "e6a")
      const cleanedClass = cleanClassName(className);
      
      // Pad student number to 2 digits
      const paddedNo = padStudentNo(studentNo);

      // Split name: first word = first name, last word = last name
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : firstName;

      // Convert Turkish characters
      const firstNameEnglish = convertTurkishToEnglish(firstName).toLowerCase();
      const lastNameEnglish = convertTurkishToEnglish(lastName).toLowerCase();
      
      // For email, use all name parts (first, middle, last)
      const fullNameParts = fullName.trim().split(/\s+/);
      const emailParts = fullNameParts.map(part => {
        const converted = convertTurkishToEnglish(part).toLowerCase();
        // Remove any remaining non-alphanumeric characters except dots
        return converted.replace(/[^a-z0-9]/g, '');
      }).filter(part => part.length > 0); // Remove empty parts
      
      const email = emailParts.join('.') + '@iklim.proje';

      // Generate password: {first_initial}{last_initial}{character_count}
      const firstInitial = firstNameEnglish.charAt(0).toLowerCase();
      const lastInitial = lastNameEnglish.charAt(0).toLowerCase();
      const initials = `${firstInitial}${lastInitial}`; // e.g., "ab"
      
      // Count total characters in the full name (after converting Turkish chars and removing spaces)
      const fullNameConverted = convertTurkishToEnglish(fullName).replace(/\s/g, '');
      const characterCount = fullNameConverted.length;
      
      const password = `${initials}${characterCount}`;

      students.push({
        fullName: toProperCase(fullName.trim()),
        className: originalClass, // Store original for database matching
        classNameClean: cleanedClass, // Store clean for password
        studentNo: paddedNo,
        email,
        password,
        teacherName: teacherName.trim() || undefined,
      });
    } catch (error) {
      errors.push(`Satır ${index + 2}: ${error instanceof Error ? error.message : 'İşleme hatası'}`);
    }
  });

  return { students, errors };
};

export const generateSQLScript = (students: StudentData[]): string => {
  // Get unique class names
  const uniqueClasses = [...new Set(students.map(s => s.className))];
  
  let sql = `-- Öğrenci Toplu Kayıt SQL Scripti
-- Oluşturulma tarihi: ${new Date().toLocaleString('tr-TR')}
-- Toplam Öğrenci: ${students.length}
-- Toplam Sınıf: ${uniqueClasses.length}
-- 
-- NOT: Bu scripti Supabase SQL Editor'den çalıştırın
-- NOT: pgcrypto extension aktif olmalıdır
-- NOT: Sınıf formatı => okul_kodu.sınıf_kodu (örn: c.7a -> c=okul, 7a=sınıf)
-- NOT: Tüm öğrenciler 'student' rolü ile kaydedilir
-- NOT: Her benzersiz sınıf için sadece bir kayıt oluşturulur
-- NOT: Classes tablosunda name sütunu için unique constraint önerilir (performans için)
-- NOT: Auth users ve identities tablolarına tam kayıt yapılır (provider bilgisi dahil)

`;

  // First, create all unique classes (check if they exist first)
  sql += `-- 0. Classes tablosunda unique constraint oluştur (opsiyonel, performans için)
-- ALTER TABLE public.classes ADD CONSTRAINT classes_name_unique UNIQUE (name);

-- 1. Sınıfları oluştur (sadece benzersiz olanlar)
-- Mevcut sınıfları kontrol et ve eksik olanları ekle
`;
  
  uniqueClasses.forEach(className => {
    sql += `INSERT INTO public.classes (name, is_active, created_at)
SELECT '${className}', true, now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.classes WHERE name = '${className}'
);

`;
  });

  // Then create users and assign them to classes
  students.forEach((student, index) => {
    sql += `-- Öğrenci ${index + 1}: ${student.fullName} (${student.className})
-- Email: ${student.email}
-- Parola: ${student.password}

-- 2. Kimlik doğrulama kullanıcısı oluştur (sadece yoksa)
WITH new_user AS (
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    last_sign_in_at,
    raw_app_meta_data,
    is_super_admin,
    is_sso_user
  )
  SELECT 
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    '${student.email}',
    crypt('${student.password}', gen_salt('bf')),
    now(),
    '{"display_name": "${student.fullName}"}'::jsonb,
    now(),
    now(),
    '',
    '',
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    false,
    false
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = '${student.email}'
  )
  RETURNING id
),
-- 3. Provider identity oluştur (sadece yoksa)
new_identity AS (
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  SELECT 
    gen_random_uuid(),
    COALESCE(new_user.id, existing_user.id),
    jsonb_build_object(
      'sub', COALESCE(new_user.id, existing_user.id)::text,
      'email', '${student.email}',
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    '${student.email}',
    now(),
    now(),
    now()
  FROM new_user
  FULL OUTER JOIN (
    SELECT id FROM auth.users WHERE email = '${student.email}'
  ) existing_user ON true
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.identities 
    WHERE user_id = COALESCE(new_user.id, existing_user.id) 
    AND provider = 'email'
  )
  RETURNING user_id
)
-- 4. Kullanıcı rolü oluştur (mevcut sınıf ile ilişkilendir)
INSERT INTO public.user_roles (
  user_id,
  role,
  class_id,
  display_name,
  created_at
)
SELECT 
  new_identity.user_id,
  'student',
  c.id,
  '${student.fullName}',
  now()
FROM new_identity, public.classes c
WHERE c.name = '${student.className}'
ON CONFLICT DO NOTHING;

`;
  });

  return sql;
};

export const downloadCSV = (students: StudentData[], filename: string = 'ogrenci_giris_bilgileri.csv') => {
  const headers = ['Ad Soyad', 'Sınıf', 'No', 'Email', 'Parola'];
  const rows = students.map(s => [
    s.fullName,
    s.className,
    s.studentNo,
    s.email,
    s.password,
  ]);

  const csvContent = [
    '\ufeff', // UTF-8 BOM for Turkish characters
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

export const downloadPrintableList = (students: StudentData[], filename: string = 'ogrenci_parolalari.txt') => {
  let content = `ÖĞRENCİ GİRİŞ BİLGİLERİ\n`;
  content += `Oluşturulma Tarihi: ${new Date().toLocaleString('tr-TR')}\n`;
  content += `Toplam Öğrenci: ${students.length}\n`;
  content += `${'='.repeat(60)}\n\n`;

  students.forEach((student, index) => {
    content += `${index + 1}. ${student.fullName}\n`;
    content += `   Sınıf: ${student.className} | No: ${student.studentNo}\n`;
    content += `   Email: ${student.email}\n`;
    content += `   Parola: ${student.password}\n`;
    content += `${'-'.repeat(60)}\n\n`;
  });

  const blob = new Blob(['\ufeff' + content], { type: 'text/plain;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

export const generateSQLBySchool = (students: StudentData[]): { [schoolCode: string]: string } => {
  if (students.length === 0) {
    return {};
  }

  // Group students by school code (Okul_kod)
  const studentsBySchool: { [schoolCode: string]: StudentData[] } = {};
  
  students.forEach(student => {
    // Extract school code from class name (e.g., "c.7a" -> "c")
    const schoolCode = student.className.split('.')[0];
    if (!studentsBySchool[schoolCode]) {
      studentsBySchool[schoolCode] = [];
    }
    studentsBySchool[schoolCode].push(student);
  });

  const sqlBySchool: { [schoolCode: string]: string } = {};

  // Generate SQL for each school
  Object.entries(studentsBySchool).forEach(([schoolCode, schoolStudents]) => {
    const uniqueClasses = [...new Set(schoolStudents.map(s => s.className))];
    
    let sql = `-- ${schoolCode.toUpperCase()} Okulu Öğrenci Kayıt SQL Scripti
-- Oluşturulma Tarihi: ${new Date().toLocaleString('tr-TR')}
-- Okul Kodu: ${schoolCode}
-- Toplam Öğrenci Sayısı: ${schoolStudents.length}
-- Toplam Sınıf Sayısı: ${uniqueClasses.length}

-- NOT: Bu scripti Supabase SQL Editor'den çalıştırın
-- NOT: pgcrypto extension aktif olmalıdır
-- NOT: Sınıf formatı => okul_kodu.sınıf_kodu (örn: ${schoolCode}.7a)
-- NOT: Tüm öğrenciler 'student' rolü ile kaydedilir
-- NOT: Her benzersiz sınıf için sadece bir kayıt oluşturulur
-- NOT: Auth users ve identities tablolarına tam kayıt yapılır (provider bilgisi dahil)

`;

    // First, create all unique classes for this school
    sql += `-- 0. Classes tablosunda unique constraint oluştur (opsiyonel, performans için)
-- ALTER TABLE public.classes ADD CONSTRAINT classes_name_unique UNIQUE (name);

-- 1. Sınıfları oluştur (sadece benzersiz olanlar)
-- Mevcut sınıfları kontrol et ve eksik olanları ekle
`;
    
    uniqueClasses.forEach(className => {
      sql += `INSERT INTO public.classes (name, is_active, created_at)
SELECT '${className}', true, now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.classes WHERE name = '${className}'
);

`;
    });

    // Then create users and assign them to classes
    schoolStudents.forEach((student, index) => {
      sql += `-- Öğrenci ${index + 1}: ${student.fullName} (${student.className})
-- Email: ${student.email}
-- Parola: ${student.password}

-- 2. Kimlik doğrulama kullanıcısı oluştur (sadece yoksa)
WITH new_user AS (
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    last_sign_in_at,
    raw_app_meta_data,
    is_super_admin,
    is_sso_user
  )
  SELECT 
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    '${student.email}',
    crypt('${student.password}', gen_salt('bf')),
    now(),
    '{"display_name": "${student.fullName}"}'::jsonb,
    now(),
    now(),
    '',
    '',
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    false,
    false
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = '${student.email}'
  )
  RETURNING id
),
-- 3. Provider identity oluştur (sadece yoksa)
new_identity AS (
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  SELECT 
    gen_random_uuid(),
    COALESCE(new_user.id, existing_user.id),
    jsonb_build_object(
      'sub', COALESCE(new_user.id, existing_user.id)::text,
      'email', '${student.email}',
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    '${student.email}',
    now(),
    now(),
    now()
  FROM new_user
  FULL OUTER JOIN (
    SELECT id FROM auth.users WHERE email = '${student.email}'
  ) existing_user ON true
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.identities 
    WHERE user_id = COALESCE(new_user.id, existing_user.id) 
    AND provider = 'email'
  )
  RETURNING user_id
)
-- 4. Kullanıcı rolü oluştur (mevcut sınıf ile ilişkilendir)
INSERT INTO public.user_roles (
  user_id,
  role,
  class_id,
  display_name,
  created_at
)
SELECT 
  new_identity.user_id,
  'student',
  c.id,
  '${student.fullName}',
  now()
FROM new_identity, public.classes c
WHERE c.name = '${student.className}'
ON CONFLICT DO NOTHING;

`;
    });

    sqlBySchool[schoolCode] = sql;
  });

  return sqlBySchool;
};

export const downloadSQL = (sqlScript: string, filename: string = 'ogrenci_kayit.sql') => {
  const blob = new Blob(['\ufeff' + sqlScript], { type: 'text/plain;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

export const downloadSQLBySchool = async (sqlBySchool: { [schoolCode: string]: string }) => {
  const zip = new JSZip();
  
  // Add each school's SQL file to the ZIP
  Object.entries(sqlBySchool).forEach(([schoolCode, sqlScript]) => {
    const filename = `ogrenci_kayit_${schoolCode.toUpperCase()}.sql`;
    zip.file(filename, '\ufeff' + sqlScript); // Add UTF-8 BOM
  });
  
  // Generate ZIP file
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  
  // Download the ZIP file
  const link = document.createElement('a');
  link.href = URL.createObjectURL(zipBlob);
  link.download = 'ogrenci_kayit_okullar.zip';
  link.click();
};

export const downloadExampleExcel = () => {
  const exampleData = [
    ['Okul_kod', 'Sınıf', 'Okul no', 'Ad-Soyad'],
    ['e', '6a', '5', 'ahmet badam'],
    ['o', '7c', '12', 'selim ercan'],
    ['e', '6a', '7', 'şeyma çağla öztürk'],
    ['i', '8b', '3', 'zeynep kaya'],
  ];

  const csvContent = [
    '\ufeff', // UTF-8 BOM
    ...exampleData.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'ornek_ogrenci_listesi.csv';
  link.click();
};

export const generateAuthDiagnosticSQL = (): string => {
  return `-- Auth Schema Diagnostic Script
-- Bu scripti Supabase SQL Editor'den çalıştırarak auth sorunlarını tespit edin

-- 1. Auth tablolarının varlığını kontrol et
SELECT 
  schemaname, 
  tablename, 
  tableowner 
FROM pg_tables 
WHERE schemaname = 'auth' 
ORDER BY tablename;

-- 2. Auth.users tablosunun yapısını kontrol et
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'auth' AND table_name = 'users'
ORDER BY ordinal_position;

-- 3. Auth.identities tablosunun yapısını kontrol et
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'auth' AND table_name = 'identities'
ORDER BY ordinal_position;

-- 4. RLS politikalarını kontrol et
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'auth'
ORDER BY tablename, policyname;

-- 5. RLS'nin aktif olup olmadığını kontrol et
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE schemaname = 'auth'
ORDER BY tablename;

-- 6. Son oluşturulan kullanıcıları kontrol et
SELECT 
  id, 
  email, 
  email_confirmed_at, 
  created_at,
  raw_app_meta_data,
  is_super_admin,
  is_sso_user
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 7. Son oluşturulan identity'leri kontrol et
SELECT 
  id,
  user_id,
  provider,
  provider_id,
  identity_data,
  created_at
FROM auth.identities 
ORDER BY created_at DESC 
LIMIT 5;

-- 8. Kullanıcı-Identity ilişkisini kontrol et
SELECT 
  u.id as user_id,
  u.email,
  u.email_confirmed_at,
  i.id as identity_id,
  i.provider,
  i.provider_id,
  i.identity_data
FROM auth.users u
LEFT JOIN auth.identities i ON u.id = i.user_id
ORDER BY u.created_at DESC
LIMIT 10;

-- 9. Eksik identity'leri tespit et
SELECT 
  u.id,
  u.email,
  u.created_at
FROM auth.users u
LEFT JOIN auth.identities i ON u.id = i.user_id
WHERE i.id IS NULL
ORDER BY u.created_at DESC;

-- 10. pgcrypto extension'ının aktif olup olmadığını kontrol et
SELECT * FROM pg_extension WHERE extname = 'pgcrypto';

-- 11. Auth fonksiyonlarını kontrol et
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'auth'
ORDER BY routine_name;
`;
};

export const downloadAuthDiagnosticSQL = () => {
  const diagnosticSQL = generateAuthDiagnosticSQL();
  downloadSQL(diagnosticSQL, 'auth_diagnostic.sql');
};

export const generateAuthFixSQL = (): string => {
  return `-- Auth Schema Fix Script (Supabase Compatible)
-- Bu scripti Supabase SQL Editor'den çalıştırarak yaygın auth sorunlarını düzeltin
-- NOT: Bu script sadece public tabloları ve RLS politikalarını düzenler

-- 1. pgcrypto extension'ını aktif et (şifreleme için gerekli)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Public tablolarında RLS'yi geçici olarak devre dışı bırak (sorun giderme için)
ALTER TABLE public.classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- 3. Auth kullanıcıları için eksik identity'leri kontrol et ve raporla
-- NOT: auth.users ve auth.identities tablolarını doğrudan değiştiremeyiz
-- Bu sorgu sadece sorunları tespit eder
SELECT 
  'Users without identities' as issue,
  COUNT(*) as count
FROM auth.users u
LEFT JOIN auth.identities i ON u.id = i.user_id
WHERE i.id IS NULL

UNION ALL

SELECT 
  'Users without email confirmation' as issue,
  COUNT(*) as count
FROM auth.users 
WHERE email_confirmed_at IS NULL

UNION ALL

SELECT 
  'Users without app metadata' as issue,
  COUNT(*) as count
FROM auth.users 
WHERE raw_app_meta_data IS NULL 
OR raw_app_meta_data = '{}'::jsonb;

-- 4. Auth sorunlarını çözmek için Supabase Dashboard kullanın:
-- - Authentication > Users bölümünden kullanıcıları kontrol edin
-- - Eksik identity'leri olan kullanıcıları silin ve yeniden oluşturun
-- - Email confirmation'ı manuel olarak onaylayın

-- 5. Alternatif: Kullanıcıları yeniden oluşturmak için SQL scripti
-- Bu script mevcut kullanıcıları siler ve yeniden oluşturur
-- DİKKAT: Bu işlem geri alınamaz!

/*
-- Mevcut kullanıcıları sil (dikkatli kullanın!)
DELETE FROM public.user_roles WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@iklim.proje'
);

DELETE FROM auth.identities WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@iklim.proje'
);

DELETE FROM auth.users WHERE email LIKE '%@iklim.proje';
*/

-- 6. RLS'yi tekrar aktif et (isteğe bağlı)
-- ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 7. Basit RLS politikaları oluştur (isteğe bağlı)
-- CREATE POLICY "Users can view own roles" ON public.user_roles
--   FOR SELECT USING (auth.uid() = user_id);

-- CREATE POLICY "Users can view classes" ON public.classes
--   FOR SELECT USING (true);

-- 8. Sonuçları kontrol et
SELECT 
  'Total users' as metric,
  COUNT(*) as count
FROM auth.users

UNION ALL

SELECT 
  'Total identities' as metric,
  COUNT(*) as count
FROM auth.identities

UNION ALL

SELECT 
  'Total user roles' as metric,
  COUNT(*) as count
FROM public.user_roles

UNION ALL

SELECT 
  'Total classes' as metric,
  COUNT(*) as count
FROM public.classes;

-- 9. Supabase Dashboard'da yapılması gerekenler:
-- 1. Authentication > Users > Problemli kullanıcıları sil
-- 2. Yeniden öğrenci kayıt scriptini çalıştır
-- 3. Authentication > Users > Email confirmation'ları kontrol et
-- 4. Authentication > Settings > Email templates'i kontrol et
`;
};

export const generateAuthCompatibleSQL = (students: StudentData[]): string => {
  if (students.length === 0) {
    return '-- No students to process';
  }

  // Get unique class names
  const uniqueClasses = [...new Set(students.map(s => s.className))];

  let sql = `-- Öğrenci Toplu Kayıt SQL Scripti (Auth Uyumlu)
-- Oluşturulma Tarihi: ${new Date().toLocaleString('tr-TR')}
-- Toplam Öğrenci Sayısı: ${students.length}
-- Toplam Sınıf Sayısı: ${uniqueClasses.length}

-- NOT: Bu script Supabase Auth API kullanır, doğrudan auth tablolarına yazmaz
-- NOT: Bu scripti Supabase SQL Editor'den çalıştırın
-- NOT: pgcrypto extension aktif olmalıdır
-- NOT: Sınıf formatı => okul_kodu.sınıf_kodu (örn: c.7a -> c=okul, 7a=sınıf)
-- NOT: Tüm öğrenciler 'student' rolü ile kaydedilir
-- NOT: Her benzersiz sınıf için sadece bir kayıt oluşturulur

-- ÖNEMLİ: Bu script sadece public tabloları oluşturur
-- Auth kullanıcıları Supabase Dashboard'dan veya Auth API'den oluşturulmalıdır

`;

  // First, create all unique classes
  sql += `-- 1. Sınıfları oluştur (sadece benzersiz olanlar)
`;
  
  uniqueClasses.forEach(className => {
    sql += `INSERT INTO public.classes (name, is_active, created_at)
SELECT '${className}', true, now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.classes WHERE name = '${className}'
);

`;
  });

  // Create a temporary table for students (for reference)
  sql += `-- 2. Geçici öğrenci tablosu oluştur (referans için)
CREATE TEMP TABLE temp_students (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  class_name TEXT NOT NULL,
  student_no TEXT NOT NULL
);

-- 3. Öğrenci verilerini geçici tabloya ekle
`;

  students.forEach((student, index) => {
    sql += `INSERT INTO temp_students (full_name, email, password, class_name, student_no) 
VALUES ('${student.fullName}', '${student.email}', '${student.password}', '${student.className}', '${student.studentNo}');

`;
  });

  sql += `-- 4. Auth kullanıcıları için hazırlık
-- NOT: Auth kullanıcıları Supabase Dashboard'dan oluşturulmalıdır
-- Bu script sadece public tabloları hazırlar

-- 5. Öğrenci listesini göster (Auth API için)
SELECT 
  full_name,
  email,
  password,
  class_name,
  student_no
FROM temp_students
ORDER BY class_name, full_name;

-- 6. Auth kullanıcıları oluşturulduktan sonra bu scripti çalıştırın:
-- (Auth kullanıcıları oluşturulduktan sonra user_roles tablosuna ekleyin)

/*
-- Auth kullanıcıları oluşturulduktan sonra user_roles ekleme:
INSERT INTO public.user_roles (user_id, role, class_id, display_name, created_at)
SELECT 
  u.id,
  'student',
  c.id,
  ts.full_name,
  now()
FROM temp_students ts
JOIN auth.users u ON u.email = ts.email
JOIN public.classes c ON c.name = ts.class_name
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id
);
*/

-- 7. Temizlik
DROP TABLE temp_students;
`;

  return sql;
};

export const downloadAuthCompatibleSQL = (students: StudentData[]) => {
  const sqlScript = generateAuthCompatibleSQL(students);
  downloadSQL(sqlScript, 'ogrenci_kayit_auth_uyumlu.sql');
};

export const generateAuthWorkflowGuide = (): string => {
  return `-- Supabase Auth Workflow Guide
-- Bu rehber Supabase'de doğru auth kullanıcıları oluşturma sürecini açıklar

-- ADIM 1: SQL Script ile Sınıfları ve Öğrenci Listesini Hazırla
-- 1. "Auth Uyumlu" butonuna tıklayın
-- 2. İndirilen SQL scripti Supabase SQL Editor'de çalıştırın
-- 3. Bu script sadece public.classes tablosunu oluşturur ve öğrenci listesini gösterir

-- ADIM 2: Supabase Dashboard'da Auth Kullanıcıları Oluştur
-- 1. Supabase Dashboard'a gidin
-- 2. Authentication > Users bölümüne gidin
-- 3. "Add user" butonuna tıklayın
-- 4. Her öğrenci için:
--    - Email: öğrenci email'i (örn: ugur.ediz.dumantepe@iklim.proje)
--    - Password: öğrenci şifresi (örn: ab10)
--    - Email Confirm: true olarak işaretleyin
--    - User Metadata: {"display_name": "Ahmet Badam"} ekleyin

-- ADIM 3: Toplu Auth Kullanıcı Oluşturma (Alternatif)
-- Eğer çok sayıda öğrenci varsa, Supabase CLI kullanabilirsiniz:

/*
-- Supabase CLI ile toplu kullanıcı oluşturma:
-- 1. Supabase CLI'yi yükleyin: npm install -g supabase
-- 2. Projenize bağlanın: supabase link --project-ref YOUR_PROJECT_REF
-- 3. Her öğrenci için:

supabase auth users create \\
  --email ugur.ediz.dumantepe@iklim.proje \\
  --password ab10 \\
  --email-confirm true \\
  --user-metadata '{"display_name": "Ahmet Badam"}'
*/

-- ADIM 4: User Roles Tablosunu Doldur
-- Auth kullanıcıları oluşturulduktan sonra bu scripti çalıştırın:

INSERT INTO public.user_roles (user_id, role, class_id, display_name, created_at)
SELECT 
  u.id,
  'student',
  c.id,
  u.raw_user_meta_data->>'display_name',
  now()
FROM auth.users u
JOIN public.classes c ON c.name = (
  -- Sınıf adını email'den çıkar (örn: ahmet.badam@iklim.proje -> c.7a)
  SELECT name FROM public.classes 
  WHERE name LIKE '%' || split_part(u.email, '.', 1) || '%'
  LIMIT 1
)
WHERE u.email LIKE '%@iklim.proje'
AND NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id
);

-- ADIM 5: RLS Politikalarını Ayarla
-- Auth kullanıcıları oluşturulduktan sonra RLS'yi aktif edin:

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Basit RLS politikaları oluştur:
CREATE POLICY "Users can view classes" ON public.classes
  FOR SELECT USING (true);

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- ADIM 6: Test Et
-- 1. Bir öğrenci ile giriş yapmayı deneyin
-- 2. Email: ugur.ediz.dumantepe@iklim.proje
-- 3. Password: ab10
-- 4. Başarılı olursa auth sistemi çalışıyor demektir

-- SORUN GİDERME:
-- Eğer giriş yapamıyorsanız:
-- 1. "Auth Tanı" butonuna tıklayın ve diagnostic scripti çalıştırın
-- 2. "Auth Düzelt" butonuna tıklayın ve fix scripti çalıştırın
-- 3. Supabase Dashboard'da Authentication > Users'da kullanıcıları kontrol edin

-- ÖNEMLİ NOTLAR:
-- - Auth kullanıcıları doğrudan SQL ile oluşturulamaz
-- - Supabase Dashboard veya Auth API kullanılmalıdır
-- - Email confirmation önemlidir
-- - User metadata display_name içermelidir
-- - RLS politikaları doğru ayarlanmalıdır
`;
};

export const downloadAuthWorkflowGuide = () => {
  const guideSQL = generateAuthWorkflowGuide();
  downloadSQL(guideSQL, 'auth_workflow_guide.sql');
};
