import { StudentData } from '@/types/student';
import JSZip from 'jszip';

interface ClassGroup {
  className: string;
  teacherName: string;
  students: StudentData[];
}

export const downloadStudentListHTMLs = async (students: StudentData[]) => {
  // Group students by teacher AND class (so each teacher-class combination is separate)
  const classGroups = new Map<string, ClassGroup>();

  students.forEach(student => {
    // Create a unique key from both teacher and class
    const teacherName = student.teacherName || 'Ogretmen';
    const key = `${teacherName}_${student.className}`;
    
    if (!classGroups.has(key)) {
      classGroups.set(key, {
        className: student.className,
        teacherName: teacherName,
        students: []
      });
    }
    classGroups.get(key)!.students.push(student);
  }); 

  const zip = new JSZip();

  // Generate HTML for each class
  for (const [_, group] of classGroups) {
    const htmlContent = generateClassHTML(group);
    const filename = generateFilename(group.teacherName, group.className);
    zip.file(`${filename}.html`, htmlContent);
  }

  // Download the zip file
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ogrenci_listeleri_${new Date().getTime()}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const generateClassHTML = (group: ClassGroup): string => {
  const teacherName = group.teacherName || 'Öğretmen';
  const className = group.className;
  const currentDate = new Date().toLocaleDateString('tr-TR');
  
  const tableRows = group.students.map((student, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${student.fullName}</td>
      <td>${student.studentNo}</td>
      <td>${student.email}</td>
      <td>${student.password}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Öğrenci Listesi - ${className}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      padding: 20px;
      background-color: #f5f5f5;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    h1 {
      color: #1f2937;
      margin-bottom: 10px;
      font-size: 24px;
    }
    
    .info {
      color: #6b7280;
      margin-bottom: 30px;
      font-size: 14px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    
    thead {
      background-color: #3b82f6;
      color: white;
    }
    
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    
    th {
      font-weight: 600;
      font-size: 14px;
    }
    
    tbody tr:hover {
      background-color: #f9fafb;
    }
    
    tbody tr:nth-child(even) {
      background-color: #f9fafb;
    }
    
    td {
      font-size: 13px;
      color: #1f2937;
    }
    
    .number {
      text-align: center;
      width: 50px;
    }
    
    .email {
      font-family: 'Courier New', monospace;
      font-size: 11px;
    }
    
    .password {
      font-family: 'Courier New', monospace;
      font-size: 11px;
      color: #6b7280;
    }
    
    @media print {
      body {
        background-color: white;
        padding: 0;
      }
      
      .container {
        box-shadow: none;
        padding: 0;
      }
      
      h1 {
        font-size: 20px;
      }
      
      table {
        font-size: 12px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Öğrenci Listesi - ${className}</h1>
    <div class="info">
      <strong>Öğretmen:</strong> ${teacherName}<br>
      <strong>Tarih:</strong> ${currentDate}
    </div>
    
    <table>
      <thead>
        <tr>
          <th class="number">#</th>
          <th>Ad Soyad</th>
          <th>No</th>
          <th>Email</th>
          <th>Parola</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  </div>
</body>
</html>`;
};

const generateFilename = (teacherName: string, className: string): string => {
  // Remove Turkish characters and normalize
  const normalize = (text: string) => {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ğ/g, 'g')
      .replace(/Ğ/g, 'G')
      .replace(/ü/g, 'u')
      .replace(/Ü/g, 'U')
      .replace(/ş/g, 's')
      .replace(/Ş/g, 'S')
      .replace(/ı/g, 'i')
      .replace(/İ/g, 'I')
      .replace(/ö/g, 'o')
      .replace(/Ö/g, 'O')
      .replace(/ç/g, 'c')
      .replace(/Ç/g, 'C')
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '');
  };

  const teacher = normalize(teacherName);
  
  // Extract only the class part (remove school code if present)
  const classOnly = className.includes('.') ? className.split('.')[1] : className;
  const classNameClean = normalize(classOnly);
  
  return `${teacher}_${classNameClean}`;
};
