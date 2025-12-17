import { Input } from "@/components/ui/input";

interface ExpenseRowProps {
  name: string;
  amount: number;
  percentage: number;
  onChange: (amount: number) => void;
  isEven: boolean;
}

const ExpenseRow = ({ name, amount, percentage, onChange, isEven }: ExpenseRowProps) => {
  const formatCurrency = (value: number) => {
    if (value === 0) return "-";
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return value.toFixed(2) + "%";
  };

  return (
    <tr className={`border-b border-border/30 transition-colors hover:bg-muted/40 ${isEven ? 'bg-muted/20' : ''}`}>
      <td className="px-4 py-3 text-foreground">{name}</td>
      <td className="px-4 py-3 text-right font-mono text-muted-foreground">
        {formatPercentage(percentage)}
      </td>
      <td className="px-4 py-3">
        <Input
          type="number"
          value={amount || ""}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="input-financial w-full max-w-[150px] ml-auto"
          placeholder="0"
        />
      </td>
    </tr>
  );
};

export default ExpenseRow;
