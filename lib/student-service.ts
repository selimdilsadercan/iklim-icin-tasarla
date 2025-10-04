import { supabase } from './supabase';
import { Database } from './supabase-types';

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
   * Download conversation data in different formats
   */
  static downloadConversation(
    messages: StudentMessage[], 
    format: 'csv' | 'json' | 'txt',
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

  private static downloadJSON(messages: StudentMessage[], filename: string): void {
    const jsonContent = JSON.stringify(messages, null, 2);
    this.downloadFile(jsonContent, `${filename}.json`, 'application/json');
  }

  private static downloadTXT(messages: StudentMessage[], filename: string): void {
    const txtContent = messages.map(msg => {
      const date = new Date(msg.created_at || '').toLocaleString();
      const sender = msg.is_user ? 'User' : 'Bot';
      return `[${date}] ${sender}: ${msg.message}`;
    }).join('\n');
    
    this.downloadFile(txtContent, `${filename}.txt`, 'text/plain');
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
}
