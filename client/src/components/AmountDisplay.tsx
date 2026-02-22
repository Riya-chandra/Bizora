interface AmountDisplayProps {
  amountInCents: number;
  currency?: string;
  className?: string;
}

export function AmountDisplay({ amountInCents, currency = "₹", className }: AmountDisplayProps) {
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountInCents / 100);

  return <span className={className}>{currency}{formatted}</span>;
}
