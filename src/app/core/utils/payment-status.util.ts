export const JOB_STATUS_OPTIONS = [
  'All',
  'Pending',
  'Accepted',
  'In Progress',
  'Submitted',
  'Approved',
  'Completed',
  'Revision Requested',
  'Disputed',
  'Cancelled',
  'Rejected'
] as const;

export const PAYMENT_STATUS_OPTIONS = [
  'All',
  'Pending Payment',
  'Escrowed',
  'Released',
  'Cancelled',
  'Partially Settled'
] as const;

export type PaymentStatusFilter = (typeof PAYMENT_STATUS_OPTIONS)[number];

export function getPaymentStatusLabel(status: string): string {
  const s = (status || '').toLowerCase().trim();
  if (['approved', 'completed', 'force completed'].includes(s)) return 'Released';
  if (s === 'accepted') return 'Accepted — Awaiting Payment';
  if (['cancelled', 'refunded', 'rejected'].includes(s)) return 'Cancelled';
  if (s === 'partially settled') return 'Partially Settled';
  if (['in progress', 'submitted', 'disputed', 'revision requested'].includes(s)) return 'Escrowed';
  return 'Pending Payment';
}

export function matchesPaymentStatusFilter(status: string, filter: PaymentStatusFilter): boolean {
  if (filter === 'All') return true;
  return getPaymentStatusLabel(status) === filter;
}
