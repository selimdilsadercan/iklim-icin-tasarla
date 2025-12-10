/**
 * Formats a date string to Turkish relative date format
 * Examples: "Dün", "Bu hafta", "3 gün önce", "2 hafta önce", etc.
 */
export function formatTurkishRelativeDate(dateString: string): string {
  if (!dateString || dateString === 'Hiç aktif değil') {
    return 'Hiç aktif değil';
  }

  try {
    const date = new Date(dateString);
    const now = new Date();
    
    // Reset time to midnight for accurate day comparison
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffTime = nowOnly.getTime() - dateOnly.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Today
    if (diffDays === 0) {
      return 'Bugün';
    }
    
    // Yesterday
    if (diffDays === 1) {
      return 'Dün';
    }
    
    // This week (2-6 days ago)
    if (diffDays >= 2 && diffDays <= 6) {
      return `${diffDays} gün önce`;
    }
    
    // Last week (7-13 days ago)
    if (diffDays >= 7 && diffDays <= 13) {
      return 'Geçen hafta';
    }
    
    // Weeks ago (14-29 days)
    if (diffDays >= 14 && diffDays <= 29) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} hafta önce`;
    }
    
    // Last month (30-59 days)
    if (diffDays >= 30 && diffDays <= 59) {
      return 'Geçen ay';
    }
    
    // Months ago (60+ days)
    if (diffDays >= 60) {
      const months = Math.floor(diffDays / 30);
      return `${months} ay önce`;
    }
    
    return dateString;
  } catch (error) {
    console.error('Error formatting Turkish relative date:', error);
    return dateString;
  }
}
