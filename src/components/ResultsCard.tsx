interface ResultsCardProps {
  totalPercentage: number;
  percentageInFavor: number;
  totalExpenses: number;
  amountInFavor: number;
  superavitDeficit: number;
}

const ResultsCard = ({
  totalPercentage,
  percentageInFavor,
  totalExpenses,
  amountInFavor,
  superavitDeficit,
}: ResultsCardProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const isSuperavit = superavitDeficit >= 0;

  return (
    <div className="card-glass p-6 animate-slide-up">
      <h3 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-2">
        Resumen de Resultados
      </h3>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-border/30">
          <span className="text-muted-foreground">Porcentaje Total de Gastos</span>
          <span className="font-mono font-semibold text-accent">
            {totalPercentage.toFixed(2)}%
          </span>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-border/30">
          <span className="text-muted-foreground">Porcentaje Total a Favor</span>
          <span className="font-mono font-semibold text-primary">
            {percentageInFavor.toFixed(2)}%
          </span>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-border/30">
          <span className="text-muted-foreground">Total de Gastos</span>
          <span className="font-mono font-semibold text-foreground">
            {formatCurrency(totalExpenses)}
          </span>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-border/30">
          <span className="text-muted-foreground">Monto a Favor</span>
          <span className="font-mono font-semibold text-primary">
            {formatCurrency(amountInFavor)}
          </span>
        </div>

        <div className={`flex justify-between items-center py-3 px-4 rounded-lg mt-4 ${
          isSuperavit ? 'bg-success/20 border border-success/50' : 'bg-destructive/20 border border-destructive/50'
        }`}>
          <span className="font-semibold text-foreground">
            {isSuperavit ? 'SUPERÁVIT' : 'DÉFICIT'}
          </span>
          <span className={`font-mono font-bold text-xl ${
            isSuperavit ? 'text-success' : 'text-destructive'
          }`}>
            {formatCurrency(Math.abs(superavitDeficit))}
          </span>
        </div>

        <div className={`text-center py-2 px-4 rounded-md font-bold text-lg ${
          isSuperavit ? 'status-superavit' : 'status-deficit'
        }`}>
          SITUACIÓN: {isSuperavit ? 'SUPERÁVIT' : 'DÉFICIT'}
        </div>
      </div>
    </div>
  );
};

export default ResultsCard;
