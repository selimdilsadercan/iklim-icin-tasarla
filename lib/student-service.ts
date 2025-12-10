import { supabase } from './supabase';
import { Database } from './supabase-types';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';

// Types for student data
export interface StudentMessage {
  id: string;
  bot_index: number;
  created_at: string | null;
  is_user: boolean;
  message: string;
  user_id: string;
}

export interface StudentBotInteraction {
  bot_index: number;
  bot_name: string;
  total_messages: number;
  last_message_date: string | null;
  conversations: StudentMessage[];
}

export interface StudentDetail {
  user_id: string;
  display_name: string | null;
  email: string;
  class_name: string | null;
  total_messages: number;
  first_message_date: string | null;
  last_message_date: string | null;
  bot_interactions: StudentBotInteraction[];
}

export interface StudentStats {
  total_messages: number;
  total_bot_interactions: number;
  first_message_date: string | null;
  last_message_date: string | null;
}

export interface StudentBotDistribution {
  bot_index: number;
  bot_name: string;
  conversation_count: number;
  percentage: number;
}

export interface StudentMessageTrend {
  date: string;
  message_count: number;
}

export class StudentService {
  /**
   * Get all messages for a specific student using get_chat_history
   */
  static async getStudentMessages(studentId: string): Promise<StudentMessage[]> {
    try {
      // Get messages for all bots (0, 1, 2, 3)
      const allMessages: StudentMessage[] = [];
      const botIndices = [0, 1, 2, 3]; // yaprak, robi, bugday, damla
      
      for (const botIndex of botIndices) {
        const { data, error } = await supabase.rpc('get_chat_history_by_uid', {
          bot_idx: botIndex,
          user_id_param: studentId
        });

        if (error) {
          console.error(`Error fetching chat history for bot ${botIndex}:`, error);
          continue; // Continue with other bots even if one fails
        }

        if (data) {
          allMessages.push(...data);
        }
      }

      return allMessages;
    } catch (error) {
      console.error('Error in getStudentMessages:', error);
      throw error;
    }
  }

  /**
   * Get all messages for a specific student with date filtering
   */
  static async getStudentMessagesWithDateFilter(
    studentId: string, 
    startDate: string | null = null, 
    endDate: string | null = null
  ): Promise<StudentMessage[]> {
    try {
      const allMessages: StudentMessage[] = [];
      const botIndices = [0, 1, 2, 3]; // yaprak, robi, bugday, damla
      
      for (const botIndex of botIndices) {
        const { data, error } = await supabase.rpc('get_chat_history_by_uid_with_date_filter', {
          bot_idx: botIndex,
          user_id_param: studentId,
          start_date: startDate,
          end_date: endDate
        });

        if (error) {
          console.error(`Error fetching chat history for bot ${botIndex}:`, error);
          continue;
        }

        if (data) {
          allMessages.push(...data);
        }
      }

      return allMessages;
    } catch (error) {
      console.error('Error in getStudentMessagesWithDateFilter:', error);
      throw error;
    }
  }

  /**
   * Get messages for a specific student and bot using get_chat_history
   */
  static async getStudentBotMessages(studentId: string, botIndex: number): Promise<StudentMessage[]> {
    try {
      const { data, error } = await supabase.rpc('get_chat_history_by_uid', {
        bot_idx: botIndex,
        user_id_param: studentId
      });

      if (error) {
        console.error('Error fetching chat history:', error);
        throw error;
      }

      if (data) {
        return data;
      }

      return [];
    } catch (error) {
      console.error('Error in getStudentBotMessages:', error);
      throw error;
    }
  }

  /**
   * Get bots that a student has interacted with using get_chat_history
   */
  static async getStudentBots(studentId: string): Promise<number[]> {
    try {
      const botIndices = [0, 1, 2, 3]; // yaprak, robi, bugday, damla
      const studentBotIndices: number[] = [];
      
      for (const botIndex of botIndices) {
        const { data, error } = await supabase.rpc('get_chat_history_by_uid', {
          bot_idx: botIndex,
          user_id_param: studentId
        });

        if (error) {
          console.error(`Error fetching chat history for bot ${botIndex}:`, error);
          continue;
        }

        if (data && data.length > 0) {
          studentBotIndices.push(botIndex);
        }
      }

      return studentBotIndices;
    } catch (error) {
      console.error('Error in getStudentBots:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive student detail with all interactions
   */
  static async getStudentDetail(studentId: string): Promise<StudentDetail | null> {
    try {
      // First, get student details using SQL function
      console.log('Fetching student details for:', studentId);
      const { data: studentInfo, error: studentError } = await supabase.rpc('get_student_details_by_uid', {
        user_id_param: studentId
      });

      if (studentError) {
        console.error('Error fetching student details:', studentError);
        throw studentError;
      }

      console.log('Student info result:', studentInfo);

      if (!studentInfo || studentInfo.length === 0) {
        console.log('No student info found, returning null');
        return null; // Student not found
      }

      const student = studentInfo[0];
      console.log('Found student:', student);

      // Get all messages for the student
      const messages = await this.getStudentMessages(studentId);
      
      // Get unique bot indices
      const botIndices = [...new Set(messages.map(msg => msg.bot_index))];
      
      // Get bot interactions
      const botInteractions: StudentBotInteraction[] = [];
      const botNames = ['yaprak', 'robi', 'bugday', 'damla'];
      
      for (const botIndex of botIndices) {
        const botMessages = messages.filter(msg => msg.bot_index === botIndex);
        const userMessages = botMessages.filter(msg => msg.is_user);
        const lastMessage = botMessages.sort((a, b) => 
          new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
        )[0];
        
        botInteractions.push({
          bot_index: botIndex,
          bot_name: botNames[botIndex] || `Bot ${botIndex}`,
          total_messages: botMessages.length,
          last_message_date: lastMessage?.created_at || null,
          conversations: botMessages.sort((a, b) => 
            new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime()
          )
        });
      }
      
      // Sort messages by date
      const sortedMessages = messages.sort((a, b) => 
        new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime()
      );
      
      return {
        user_id: studentId,
        display_name: student.display_name,
        email: '', // Not available from simplified function
        class_name: null, // Not available from simplified function
        total_messages: messages.length,
        first_message_date: sortedMessages[0]?.created_at || null,
        last_message_date: sortedMessages[sortedMessages.length - 1]?.created_at || null,
        bot_interactions: botInteractions.sort((a, b) => b.total_messages - a.total_messages)
      };
    } catch (error) {
      console.error('Error in getStudentDetail:', error);
      throw error;
    }
  }

  /**
   * Get student statistics (message counts, bot interactions, dates)
   */
  static async getStudentStats(studentId: string): Promise<StudentStats | null> {
    try {
      const { data, error } = await supabase.rpc('get_student_stats', {
        student_uid: studentId
      });

      if (error) {
        console.error('Error fetching student stats:', error);
        throw error;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Error in getStudentStats:', error);
      throw error;
    }
  }

  /**
   * Get student's bot distribution (which bots they talked to and percentages)
   */
  static async getStudentBotDistribution(studentId: string): Promise<StudentBotDistribution[]> {
    try {
      const { data, error } = await supabase.rpc('get_student_bot_distribution', {
        student_uid: studentId
      });

      if (error) {
        console.error('Error fetching student bot distribution:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getStudentBotDistribution:', error);
      throw error;
    }
  }

  /**
   * Get student's message trend over time
   */
  static async getStudentMessageTrend(
    studentId: string, 
    daysBack: number = 30
  ): Promise<StudentMessageTrend[]> {
    try {
      const { data, error } = await supabase.rpc('get_student_message_trend', {
        student_uid: studentId,
        days_back: daysBack
      });

      if (error) {
        console.error('Error fetching student message trend:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getStudentMessageTrend:', error);
      throw error;
    }
  }

  /**
   * Download conversation data in different formats
   */
  static downloadConversation(
    messages: StudentMessage[], 
    format: 'csv' | 'json' | 'txt' | 'xlsx',
    includeOnlyUser: boolean = false
  ): void {
    let filteredMessages = messages;
    
    if (includeOnlyUser) {
      filteredMessages = messages.filter(msg => msg.is_user);
    }
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `conversation_${timestamp}`;
    
    switch (format) {
      case 'csv':
        this.downloadCSV(filteredMessages, filename);
        break;
      case 'json':
        this.downloadJSON(filteredMessages, filename);
        break;
      case 'txt':
        this.downloadTXT(filteredMessages, filename);
        break;
      case 'xlsx':
        this.downloadXLSX(filteredMessages, filename);
        break;
    }
  }

  /**
   * Download all bots' conversations grouped by bot
   */
  static downloadAllBotsConversation(
    botInteractions: StudentBotInteraction[],
    format: 'csv' | 'json' | 'txt' | 'xlsx',
    includeOnlyUser: boolean = false,
    studentName: string
  ): void {
    const timestamp = new Date().toISOString().split('T')[0];
    const safeStudentName = this.sanitizeFilename(studentName);
    const filename = `${safeStudentName}_tum_botlar_${timestamp}`;
    
    switch (format) {
      case 'csv':
        this.downloadAllBotsCSV(botInteractions, filename, includeOnlyUser);
        break;
      case 'json':
        this.downloadAllBotsJSON(botInteractions, filename, includeOnlyUser);
        break;
      case 'txt':
        this.downloadAllBotsTXT(botInteractions, filename, includeOnlyUser);
        break;
      case 'xlsx':
        this.downloadAllBotsXLSX(botInteractions, filename, includeOnlyUser);
        break;
    }
  }

  /**
   * Sanitize filename by converting Turkish characters to ASCII-safe equivalents
   * Uses normalization to handle all Unicode variants
   */
  private static sanitizeFilename(filename: string): string {
    // First normalize the string (decompose combined characters)
    let normalized = filename.normalize('NFD');
    
    // Turkish character mapping with all possible representations
    const replacements: Array<[RegExp, string]> = [
      // Turkish specific
      [/ç/g, 'c'],
      [/Ç/g, 'C'],
      [/ğ/g, 'g'],
      [/Ğ/g, 'G'],
      [/ı/g, 'i'],
      [/İ/g, 'I'],
      [/ö/g, 'o'],
      [/Ö/g, 'O'],
      [/ş/g, 's'],
      [/Ş/g, 'S'],
      [/ü/g, 'u'],
      [/Ü/g, 'U'],
      // Other diacritics - lowercase
      [/[àáâãäåāăąǎǻ]/g, 'a'],
      [/[èéêëēĕėęě]/g, 'e'],
      [/[ìíîïĩīĭįı]/g, 'i'],
      [/[òóôõöøōŏőǒǿ]/g, 'o'],
      [/[ùúûüũūŭůűų]/g, 'u'],
      [/[ñńņň]/g, 'n'],
      [/[çćĉċč]/g, 'c'],
      [/[ğĝğ]/g, 'g'],
      [/[ýÿŷ]/g, 'y'],
      [/[żźž]/g, 'z'],
      [/[śŝşšș]/g, 's'],
      [/[ťţț]/g, 't'],
      [/[ŕř]/g, 'r'],
      [/[ďđ]/g, 'd'],
      [/[ĥħ]/g, 'h'],
      [/[ĵ]/g, 'j'],
      [/[ķ]/g, 'k'],
      [/[ĺļľŀł]/g, 'l'],
      [/[ŵ]/g, 'w'],
      // Other diacritics - uppercase
      [/[ÀÁÂÃÄÅĀĂĄǍǺ]/g, 'A'],
      [/[ÈÉÊËĒĔĖĘĚ]/g, 'E'],
      [/[ÌÍÎÏĨĪĬĮI]/g, 'I'],
      [/[ÒÓÔÕÖØŌŎŐǑǾ]/g, 'O'],
      [/[ÙÚÛÜŨŪŬŮŰŲ]/g, 'U'],
      [/[ÑŃŅŇ]/g, 'N'],
      [/[ÇĆĈĊČ]/g, 'C'],
      [/[ĞĜĞ]/g, 'G'],
      [/[ÝŸŶ]/g, 'Y'],
      [/[ŻŹŽ]/g, 'Z'],
      [/[ŚŜŞŠȘ]/g, 'S'],
      [/[ŤŢȚ]/g, 'T'],
      [/[ŔŘ]/g, 'R'],
      [/[ĎĐ]/g, 'D'],
      [/[ĤĦ]/g, 'H'],
      [/[Ĵ]/g, 'J'],
      [/[Ķ]/g, 'K'],
      [/[ĹĻĽĿŁ]/g, 'L'],
      [/[Ŵ]/g, 'W'],
      // Remove combining diacritical marks
      [/[\u0300-\u036f]/g, '']
    ];

    let sanitized = normalized;
    
    // Apply all replacements
    replacements.forEach(([pattern, replacement]) => {
      sanitized = sanitized.replace(pattern, replacement);
    });
    
    // Replace spaces with underscores
    sanitized = sanitized.replace(/\s+/g, '_');
    
    // Keep only safe characters
    sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');
    
    // Remove multiple consecutive underscores
    sanitized = sanitized.replace(/_+/g, '_');
    
    // Remove leading/trailing underscores and dots
    sanitized = sanitized.replace(/^[._]+|[._]+$/g, '');
    
    // Ensure we have at least something
    return sanitized || 'unnamed';
  }

  /**
   * Download all students' conversations in a class as a ZIP file
   */
  static async downloadClassConversationsAsZip(
    students: Array<{ user_id: string; display_name: string | null; email: string }>,
    format: 'csv' | 'json' | 'txt' | 'xlsx',
    className: string,
    startDate: string | null = null,
    endDate: string | null = null
  ): Promise<void> {
    try {
      const zip = new JSZip();
      const timestamp = new Date().toISOString().split('T')[0];
      
      // Process each student
      for (const student of students) {
        try {
          // Get mes student with date filter
          const messages = await this.getStudentMessagesWithDateFilter(
            student.user_id,
            startDate,
            endDate
          );

          if (messages.length === 0) continue;

          // Group messages by bot
          const botIndices = [...new Set(messages.map(msg => msg.bot_index))];
          const botNames = ['yaprak', 'robi', 'bugday', 'damla'];
          const botInteractions: StudentBotInteraction[] = [];

          for (const botIndex of botIndices) {
            const botMessages = messages.filter(msg => msg.bot_index === botIndex);
            if (botMessages.length > 0) {
              botInteractions.push({
                bot_index: botIndex,
                bot_name: botNames[botIndex] || `Bot ${botIndex}`,
                total_messages: botMessages.length,
                last_message_date: null,
                conversations: botMessages.sort((a, b) => 
                  new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime()
                )
              });
            }
          }

          // Generate file content based on format
          const studentName = student.display_name || student.email || 'unknown';
          const safeStudentName = this.sanitizeFilename(studentName);
          
          // Debug log
          if (studentName !== safeStudentName) {
            console.log(`Sanitized filename: "${studentName}" -> "${safeStudentName}"`);
          }
          
          let fileContent: string;
          let fileExtension: string;

          switch (format) {
            case 'csv':
              fileContent = this.generateAllBotsCSVContent(botInteractions, false);
              // Add UTF-8 BOM for proper Excel encoding
              fileContent = '\uFEFF' + fileContent;
              fileExtension = 'csv';
              break;
            case 'json':
              fileContent = this.generateAllBotsJSONContent(botInteractions, false);
              fileExtension = 'json';
              break;
            case 'txt':
              fileContent = this.generateAllBotsTXTContent(botInteractions, false);
              fileExtension = 'txt';
              break;
            case 'xlsx':
              // For XLSX, we need to generate as blob instead of string
              const xlsxBlob = this.generateAllBotsXLSXBlob(botInteractions, false);
              zip.file(`${safeStudentName}.xlsx`, xlsxBlob);
              continue; // Skip the string-based file addition below
          }

          // Add file to ZIP with encoding
          zip.file(`${safeStudentName}.${fileExtension}`, fileContent, {
            binary: false
          });
        } catch (error) {
          console.error(`Error processing student ${student.display_name}:`, error);
          // Continue with other students even if one fails
        }
      }

      // Generate ZIP file with UTF-8 encoding
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      
      // Download ZIP
      const safeClassName = this.sanitizeFilename(className);
      const dateRange = startDate && endDate 
        ? `_${startDate.split('T')[0]}_${endDate.split('T')[0]}`
        : '';
      const zipFilename = `${safeClassName}_tum_ogrenciler${dateRange}_${timestamp}.zip`;
      
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = zipFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating ZIP file:', error);
      throw error;
    }
  }

  private static downloadCSV(messages: StudentMessage[], filename: string): void {
    const headers = ['Date', 'Time', 'User', 'Message'];
    const csvContent = [
      headers.join(','),
      ...messages.map(msg => [
        new Date(msg.created_at || '').toLocaleDateString(),
        new Date(msg.created_at || '').toLocaleTimeString(),
        msg.is_user ? 'User' : 'Bot',
        `"${msg.message.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');
    
    this.downloadFile(csvContent, `${filename}.csv`, 'text/csv');
  }

  private static downloadAllBotsCSV(botInteractions: StudentBotInteraction[], filename: string, includeOnlyUser: boolean): void {
    const content = this.generateAllBotsCSVContent(botInteractions, includeOnlyUser);
    this.downloadFile(content, `${filename}.csv`, 'text/csv');
  }

  private static downloadJSON(messages: StudentMessage[], filename: string): void {
    const jsonContent = JSON.stringify(messages, null, 2);
    this.downloadFile(jsonContent, `${filename}.json`, 'application/json');
  }

  private static downloadAllBotsJSON(botInteractions: StudentBotInteraction[], filename: string, includeOnlyUser: boolean): void {
    const content = this.generateAllBotsJSONContent(botInteractions, includeOnlyUser);
    this.downloadFile(content, `${filename}.json`, 'application/json');
  }

  private static downloadTXT(messages: StudentMessage[], filename: string): void {
    const txtContent = messages.map(msg => {
      const date = new Date(msg.created_at || '').toLocaleString();
      const sender = msg.is_user ? 'User' : 'Bot';
      return `[${date}] ${sender}: ${msg.message}`;
    }).join('\n');
    
    this.downloadFile(txtContent, `${filename}.txt`, 'text/plain');
  }

  private static downloadAllBotsTXT(botInteractions: StudentBotInteraction[], filename: string, includeOnlyUser: boolean): void {
    const content = this.generateAllBotsTXTContent(botInteractions, includeOnlyUser);
    this.downloadFile(content, `${filename}.txt`, 'text/plain');
  }

  // Content generation helpers (for ZIP creation)
  private static generateAllBotsCSVContent(botInteractions: StudentBotInteraction[], includeOnlyUser: boolean): string {
    const headers = ['Bot Name', 'Date', 'Time', 'User', 'Message'];
    const rows: string[] = [headers.join(',')];
    
    botInteractions.forEach(bot => {
      const messages = includeOnlyUser 
        ? bot.conversations.filter(msg => msg.is_user)
        : bot.conversations;
        
      messages.forEach(msg => {
        rows.push([
          bot.bot_name,
          new Date(msg.created_at || '').toLocaleDateString(),
          new Date(msg.created_at || '').toLocaleTimeString(),
          msg.is_user ? 'User' : 'Bot',
          `"${msg.message.replace(/"/g, '""')}"`
        ].join(','));
      });
    });
    
    return rows.join('\n');
  }

  private static generateAllBotsJSONContent(botInteractions: StudentBotInteraction[], includeOnlyUser: boolean): string {
    const data = botInteractions.map(bot => ({
      bot_name: bot.bot_name,
      bot_index: bot.bot_index,
      total_messages: bot.total_messages,
      conversations: includeOnlyUser 
        ? bot.conversations.filter(msg => msg.is_user)
        : bot.conversations
    }));
    
    return JSON.stringify(data, null, 2);
  }

  private static generateAllBotsTXTContent(botInteractions: StudentBotInteraction[], includeOnlyUser: boolean): string {
    const sections: string[] = [];
    
    botInteractions.forEach(bot => {
      const messages = includeOnlyUser 
        ? bot.conversations.filter(msg => msg.is_user)
        : bot.conversations;
      
      if (messages.length === 0) return;
      
      const header = `${'='.repeat(60)}\n${bot.bot_name.toUpperCase()} - ${messages.length} mesaj\n${'='.repeat(60)}`;
      const messagesText = messages.map(msg => {
        const date = new Date(msg.created_at || '').toLocaleString('tr-TR');
        const sender = msg.is_user ? 'Öğrenci' : bot.bot_name;
        return `\n[${date}] ${sender}:\n${msg.message}`;
      }).join('\n');
      
      sections.push(`${header}\n${messagesText}\n`);
    });
    
    return sections.join('\n\n');
  }

  private static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // XLSX Download Methods
  private static downloadXLSX(messages: StudentMessage[], filename: string): void {
    const wb = XLSX.utils.book_new();
    
    const data = messages.map(msg => ({
      'Tarih': new Date(msg.created_at || '').toLocaleDateString('tr-TR'),
      'Saat': new Date(msg.created_at || '').toLocaleTimeString('tr-TR'),
      'Kullanıcı': msg.is_user ? 'Öğrenci' : 'Bot',
      'Mesaj': msg.message
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 12 }, // Date
      { wch: 10 }, // Time
      { wch: 10 }, // User
      { wch: 80 }  // Message
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, 'Konuşmalar');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }

  private static downloadAllBotsXLSX(botInteractions: StudentBotInteraction[], filename: string, includeOnlyUser: boolean): void {
    const wb = XLSX.utils.book_new();
    
    botInteractions.forEach(bot => {
      const messages = includeOnlyUser 
        ? bot.conversations.filter(msg => msg.is_user)
        : bot.conversations;
      
      if (messages.length === 0) return;
      
      const data = messages.map(msg => ({
        'Bot': bot.bot_name,
        'Tarih': new Date(msg.created_at || '').toLocaleDateString('tr-TR'),
        'Saat': new Date(msg.created_at || '').toLocaleTimeString('tr-TR'),
        'Kullanıcı': msg.is_user ? 'Öğrenci' : 'Bot',
        'Mesaj': msg.message
      }));
      
      const ws = XLSX.utils.json_to_sheet(data);
      
      // Set column widths
      ws['!cols'] = [
        { wch: 12 }, // Bot
        { wch: 12 }, // Date
        { wch: 10 }, // Time
        { wch: 10 }, // User
        { wch: 80 }  // Message
      ];
      
      // Sanitize sheet name (max 31 chars, no special chars)
      const sheetName = bot.bot_name.substring(0, 31).replace(/[\\/*?[\]:]/g, '');
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });
    
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }

  private static generateAllBotsXLSXBlob(botInteractions: StudentBotInteraction[], includeOnlyUser: boolean): Blob {
    const wb = XLSX.utils.book_new();
    
    botInteractions.forEach(bot => {
      const messages = includeOnlyUser 
        ? bot.conversations.filter(msg => msg.is_user)
        : bot.conversations;
      
      if (messages.length === 0) return;
      
      const data = messages.map(msg => ({
        'Bot': bot.bot_name,
        'Tarih': new Date(msg.created_at || '').toLocaleDateString('tr-TR'),
        'Saat': new Date(msg.created_at || '').toLocaleTimeString('tr-TR'),
        'Kullanıcı': msg.is_user ? 'Öğrenci' : 'Bot',
        'Mesaj': msg.message
      }));
      
      const ws = XLSX.utils.json_to_sheet(data);
      
      // Set column widths
      ws['!cols'] = [
        { wch: 12 }, // Bot
        { wch: 12 }, // Date
        { wch: 10 }, // Time
        { wch: 10 }, // User
        { wch: 80 }  // Message
      ];
      
      // Sanitize sheet name (max 31 chars, no special chars)
      const sheetName = bot.bot_name.substring(0, 31).replace(/[\\/*?[\]:]/g, '');
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });
    
    // Generate buffer and convert to blob
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
}
