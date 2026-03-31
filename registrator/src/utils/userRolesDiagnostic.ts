export const generateUserRolesDiagnosticSQL = (): string => {
  return `-- User Roles Diagnostic Script
-- Bu scripti Supabase SQL Editor'den çalıştırarak user_roles sorunlarını tespit edin

-- 1. Auth users sayısını kontrol et
SELECT 
  'Auth Users Count' as metric,
  COUNT(*) as count
FROM auth.users
WHERE email LIKE '%@iklim.proje'

UNION ALL

-- 2. User roles sayısını kontrol et
SELECT 
  'User Roles Count' as metric,
  COUNT(*) as count
FROM public.user_roles

UNION ALL

-- 3. Classes sayısını kontrol et
SELECT 
  'Classes Count' as metric,
  COUNT(*) as count
FROM public.classes

UNION ALL

-- 4. Auth users ile user_roles karşılaştırması
SELECT 
  'Users without roles' as metric,
  COUNT(*) as count
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email LIKE '%@student.com'
AND ur.id IS NULL;

-- 5. Detaylı auth users listesi (user_roles olmayanlar)
SELECT 
  u.id,
  u.email,
  u.created_at,
  u.raw_user_meta_data->>'display_name' as display_name,
  CASE 
    WHEN ur.id IS NULL THEN 'MISSING ROLE'
    ELSE 'HAS ROLE'
  END as role_status
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email LIKE '%@student.com'
ORDER BY u.created_at DESC
LIMIT 20;

-- 6. Classes tablosunu kontrol et
SELECT 
  id,
  name,
  is_active,
  created_at
FROM public.classes
ORDER BY created_at DESC
LIMIT 10;

-- 7. User roles tablosunu kontrol et
SELECT 
  ur.id,
  ur.user_id,
  ur.role,
  ur.class_id,
  ur.display_name,
  ur.created_at,
  c.name as class_name,
  u.email
FROM public.user_roles ur
LEFT JOIN public.classes c ON ur.class_id = c.id
LEFT JOIN auth.users u ON ur.user_id = u.id
ORDER BY ur.created_at DESC
LIMIT 10;

-- 8. Eksik user_roles için düzeltme scripti
-- Bu script eksik user_roles kayıtlarını oluşturur
INSERT INTO public.user_roles (user_id, role, class_id, display_name, created_at)
SELECT 
  u.id,
  'student',
  c.id,
  u.raw_user_meta_data->>'display_name',
  now()
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
CROSS JOIN public.classes c
WHERE u.email LIKE '%@student.com'
AND ur.id IS NULL
AND c.name = (
  -- Sınıf adını email'den çıkar (örn: ahmet.badam@student.com -> c.7a)
  SELECT name FROM public.classes 
  WHERE name LIKE '%' || split_part(u.email, '.', 1) || '%'
  LIMIT 1
)
ON CONFLICT (user_id) DO NOTHING;

-- 9. Sonuçları kontrol et
SELECT 
  'After fix - Users without roles' as metric,
  COUNT(*) as count
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email LIKE '%@student.com'
AND ur.id IS NULL;
`;
};

export const downloadUserRolesDiagnosticSQL = () => {
  const diagnosticSQL = generateUserRolesDiagnosticSQL();
  
  const blob = new Blob(['\ufeff' + diagnosticSQL], { type: 'text/plain;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'user_roles_diagnostic.sql';
  link.click();
};
