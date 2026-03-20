import { OutreachResult } from '../types/outreach';

export const downloadCSV = (results: OutreachResult[]) => {
  const headers = ['Company', 'Domain', 'Industry', 'Contact Name', 'Email', 'Icebreaker', 'Full Email'];

  const csvContent = [
    headers.join(','),
    ...results.map(row => [
      escapeCSV(row.company),
      escapeCSV(row.domain),
      escapeCSV(row.industry),
      escapeCSV(row.contactName),
      escapeCSV(row.email),
      escapeCSV(row.icebreaker),
      escapeCSV(row.fullEmail),
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `kelpie-outreach-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const escapeCSV = (value: string): string => {
  if (!value) return '""';

  const stringValue = String(value);

  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
};
