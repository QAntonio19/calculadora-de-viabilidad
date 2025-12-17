import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import ExpenseRow from "@/components/ExpenseRow";
import ResultsCard from "@/components/ResultsCard";

interface Expense {
  id: string;
  name: string;
  amount: number;
}

const INITIAL_EXPENSES: Expense[] = [
  { id: "hipoteca", name: "Hipoteca", amount: 406740 },
  { id: "remodelacion", name: "Remodelación", amount: 34398 },
  { id: "agua", name: "Agua", amount: 6613 },
  { id: "luz", name: "Luz", amount: 0 },
  { id: "predial", name: "Predial", amount: 4000 },
  { id: "avaluo", name: "Avalúo + Planos", amount: 0 },
  { id: "gestion", name: "Gestión del crédito", amount: 7500 },
  { id: "isr", name: "ISR", amount: 0 },
  { id: "reembolso", name: "Reembolso propietario", amount: 120000 },
  { id: "imprevistos", name: "Imprevistos", amount: 0 },
  { id: "comision", name: "Comisión bancaria", amount: 0 },
  { id: "eventos", name: "Eventos sociales", amount: 0 },
  { id: "impuestos", name: "Impuestos", amount: 0 },
  { id: "comisionistas", name: "Pago comisionistas", amount: 0 },
  { id: "pago_arturo", name: "Pago Arturo", amount: 0 },
  { id: "secretaria", name: "Secretaria", amount: 0 },
  { id: "otros", name: "Imprevistos y Otros", amount: 0 },
  { id: "remis", name: "Remis", amount: 0 },
];

const Index = () => {
  const [propertyAmount, setPropertyAmount] = useState<number>(700000);
  const [commercialPrice, setCommercialPrice] = useState<number>(680000);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);

  const updateExpense = (id: string, amount: number) => {
    setExpenses(prev => prev.map(exp => 
      exp.id === id ? { ...exp, amount } : exp
    ));
  };

  const calculations = useMemo(() => {
    const expensesWithPercentage = expenses.map(exp => ({
      ...exp,
      percentage: commercialPrice > 0 ? (exp.amount / commercialPrice) * 100 : 0
    }));

    const totalPercentage = expensesWithPercentage.reduce((sum, exp) => sum + exp.percentage, 0);
    const percentageInFavor = 100 - totalPercentage;
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const amountInFavor = commercialPrice * (percentageInFavor / 100);
    const superavitDeficit = propertyAmount - commercialPrice + amountInFavor;

    return {
      expensesWithPercentage,
      totalPercentage,
      percentageInFavor,
      totalExpenses,
      amountInFavor,
      superavitDeficit
    };
  }, [expenses, commercialPrice, propertyAmount]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Calculadora de Rentabilidad
          </h1>
          <p className="text-muted-foreground">
            Análisis para flipping inmobiliario
          </p>
        </div>

        {/* Status Banner */}
        <div className={`flex items-center justify-between p-4 rounded-lg animate-pulse-glow ${
          calculations.superavitDeficit >= 0 
            ? 'bg-success/20 border-2 border-success' 
            : 'bg-destructive/20 border-2 border-destructive'
        }`}>
          <span className="text-lg font-semibold text-foreground">RENTABILIDAD</span>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded font-bold ${
              calculations.superavitDeficit >= 0 ? 'status-superavit' : 'status-deficit'
            }`}>
              {calculations.superavitDeficit >= 0 ? 'SUPERÁVIT' : 'DÉFICIT'}
            </span>
            <span className={`text-2xl font-mono font-bold ${
              calculations.superavitDeficit >= 0 ? 'text-success' : 'text-destructive'
            }`}>
              {formatCurrency(Math.abs(calculations.superavitDeficit))}
            </span>
          </div>
        </div>

        {/* Input Section */}
        <Card className="card-glass p-6 animate-slide-up">
          <h2 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">
            Datos de la Propiedad
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Monto de la Propiedad
              </label>
              <Input
                type="number"
                value={propertyAmount || ""}
                onChange={(e) => setPropertyAmount(Number(e.target.value) || 0)}
                className="input-financial text-lg"
                placeholder="700,000"
              />
              <p className="text-xs text-muted-foreground">
                {formatCurrency(propertyAmount)}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Precio Comercial Total
              </label>
              <Input
                type="number"
                value={commercialPrice || ""}
                onChange={(e) => setCommercialPrice(Number(e.target.value) || 0)}
                className="input-financial text-lg"
                placeholder="680,000"
              />
              <p className="text-xs text-muted-foreground">
                {formatCurrency(commercialPrice)}
              </p>
            </div>
          </div>
        </Card>

        {/* Expenses Table */}
        <Card className="card-glass overflow-hidden animate-slide-up">
          <div className="table-header px-4 py-3">
            <h2 className="text-lg font-semibold">GASTOS</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-secondary border-b border-border">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-secondary-foreground">
                    Concepto
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-secondary-foreground">
                    Porcentaje
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-secondary-foreground">
                    Monto
                  </th>
                </tr>
              </thead>
              <tbody>
                {calculations.expensesWithPercentage.map((expense, index) => (
                  <ExpenseRow
                    key={expense.id}
                    name={expense.name}
                    amount={expense.amount}
                    percentage={expense.percentage}
                    onChange={(amount) => updateExpense(expense.id, amount)}
                    isEven={index % 2 === 0}
                  />
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-accent/20 border-t-2 border-accent">
                  <td className="px-4 py-3 font-bold text-accent">
                    PORCENTAJE TOTAL
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-accent">
                    {calculations.totalPercentage.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                    {formatCurrency(calculations.totalExpenses)}
                  </td>
                </tr>
                <tr className="bg-primary/20 border-t border-primary/50">
                  <td className="px-4 py-3 font-bold text-primary">
                    PORCENTAJE TOTAL A FAVOR
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-primary">
                    {calculations.percentageInFavor.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-primary">
                    {formatCurrency(calculations.amountInFavor)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        {/* Results */}
        <ResultsCard
          totalPercentage={calculations.totalPercentage}
          percentageInFavor={calculations.percentageInFavor}
          totalExpenses={calculations.totalExpenses}
          amountInFavor={calculations.amountInFavor}
          superavitDeficit={calculations.superavitDeficit}
        />
      </div>
    </div>
  );
};

export default Index;
