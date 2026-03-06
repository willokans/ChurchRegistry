/** Month labels for date filter dropdowns (01 -> Jan, etc.) */
export const MONTH_LABELS: Record<string, string> = {
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun',
  '07': 'Jul', '08': 'Aug', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
};

/** Month values for filter dropdowns (01–12) */
export const monthOptions = ['01','02','03','04','05','06','07','08','09','10','11','12'];

/** Day values for filter dropdowns (01–31) */
export const dayOptions = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
