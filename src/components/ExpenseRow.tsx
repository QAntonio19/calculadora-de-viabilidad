import { Input } from "@/components/ui/input";

interface ExpenseRowProps {
  name: string;
  amount: number;
  percentage: number;
  onChange: (amount: number) => void;
  isEven: boolean;
}

const ExpenseRow = ({ name, amount, percentage, onChange, isEven }: ExpenseRowProps) => {
  const formatPercentage = (value: number) => {
    return value.toFixed(2) + "%";
  };

  return (
    <tr className={`border-b border-border/30 transition-colors hover:bg-muted/40 ${isEven ? 'bg-muted/20' : ''}`}>
      <td className="px-4 py-3 text-foreground">{name}</td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <span className="text-muted-foreground font-medium">$</span>
          <Input
            type="number"
            value={amount || ""}
            onChange={(e) => onChange(Number(e.target.value) || 0)}
            className="input-financial w-full max-w-[140px]"
            placeholder="0"
          />
        </div>
      </td>
      <td className="px-4 py-3 text-right font-mono text-muted-foreground">
        {formatPercentage(percentage)}
      </td>
    </tr>
  );
};

export default ExpenseRow;
