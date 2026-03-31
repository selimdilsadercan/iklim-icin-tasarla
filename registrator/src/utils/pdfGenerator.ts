import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StudentData } from '@/types/student';
import JSZip from 'jszip';

interface ClassGroup {
  className: string;
  teacherName: string;
  students: StudentData[];
}

export const downloadStudentListPDFs = async (students: StudentData[]) => {
  // Group students by class
  const classGroups = new Map<string, ClassGroup>();

  students.forEach(student => {
    const key = student.className;
    if (!classGroups.has(key)) {
      classGroups.set(key, {
        className: student.className,
        teacherName: student.teacherName || 'Öğretmen',
        students: []
      });
    }
    classGroups.get(key)!.students.push(student);
  });

  const zip = new JSZip();

  // Generate PDF for each class
  for (const [_, group] of classGroups) {
    const pdfBytes = generateClassPDF(group);
    const filename = generateFilename(group.teacherName, group.className);
    zip.file(`${filename}.pdf`, pdfBytes);
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

const generateClassPDF = (group: ClassGroup): Uint8Array => {
  // Create PDF in portrait orientation
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    compress: true
  });
  
  // Helper function to convert Turkish characters to ASCII for PDF display
  // This prevents font corruption since jsPDF's built-in fonts don't support Turkish characters well
  const convertTurkishChars = (text: string): string => {
    return text
      .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
      .replace(/ü/g, 'u').replace(/Ü/g, 'U')
      .replace(/ş/g, 's').replace(/Ş/g, 'S')
      .replace(/ı/g, 'i').replace(/İ/g, 'I')
      .replace(/ö/g, 'o').replace(/Ö/g, 'O')
      .replace(/ç/g, 'c').replace(/Ç/g, 'C');
  };
  
  // Convert for display (original data stays intact)
  const teacherName = convertTurkishChars(group.teacherName || 'Ogretmen');
  const title = `Ogrenci Listesi - ${convertTurkishChars(group.className)}`;
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 15);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Ogretmen: ${teacherName}`, 14, 22);
  doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 14, 27);
  
  // Prepare table data - convert Turkish characters for PDF display
  const tableData = group.students.map((student, index) => {
    return [
      (index + 1).toString(),
      convertTurkishChars(student.fullName).trim(),
      student.studentNo.trim(),
      student.email.trim(),
      student.password.trim()
    ];
  });

  // Add table
  autoTable(doc, {
    startY: 35,
    head: [['#', 'Ad Soyad', 'No', 'Email', 'Parola']],
    body: tableData,
    theme: 'striped',
    headStyles: { 
      fillColor: [59, 130, 246],
      fontStyle: 'bold',
      textColor: [255, 255, 255],
      font: 'helvetica'
    },
    styles: { 
      fontSize: 9,
      font: 'helvetica'
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 50, halign: 'left', fontSize: 8 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 65, fontSize: 7, halign: 'left' },
      4: { cellWidth: 25, fontSize: 7, halign: 'center' }
    }
  });

  // Convert to Uint8Array
  const pdfOutput = doc.output('arraybuffer');
  return new Uint8Array(pdfOutput);
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
  // E.g., "c.7C" -> "7C", "e.6a" -> "6a"
  const classOnly = className.includes('.') ? className.split('.')[1] : className;
  const classNameClean = normalize(classOnly);
  
  return `${teacher}_${classNameClean}`;
};
