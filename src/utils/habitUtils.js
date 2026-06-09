export function calculateStreak(completedDates) {
  if (!completedDates || completedDates.length === 0) return 0;

  const uniqueDates = new Set(completedDates);
  
  // Helper to get date string for N days ago in local timezone (YYYY-MM-DD)
  const getLocalDateString = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateString(0);
  const yesterdayStr = getLocalDateString(1);

  // If neither today nor yesterday is completed, the streak is 0
  if (!uniqueDates.has(todayStr) && !uniqueDates.has(yesterdayStr)) {
    return 0;
  }

  let streak = 0;
  let daysAgo = uniqueDates.has(todayStr) ? 0 : 1;

  while (true) {
    const dateStr = getLocalDateString(daysAgo);
    if (uniqueDates.has(dateStr)) {
      streak++;
      daysAgo++;
    } else {
      break;
    }
  }

  return streak;
}
