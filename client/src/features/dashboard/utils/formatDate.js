export function formatDate(dateInput, format = 'DD-MM-YYYY') {
  if (!dateInput) return '';
  const s = typeof dateInput === 'string' ? dateInput : null;
  const d = s
    ? (/^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + 'T00:00:00') : new Date(s))
    : dateInput;
  if (Number.isNaN(d.getTime())) return s ?? '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = String(d.getFullYear());
  if (format === 'MM-DD-YYYY') return `${mm}-${dd}-${yyyy}`;
  if (format === 'YYYY-MM-DD') return `${yyyy}-${mm}-${dd}`;
  return `${dd}-${mm}-${yyyy}`;
}
