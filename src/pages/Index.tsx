import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ExpenseRow from "@/components/ExpenseRow";
import ResultsCard from "@/components/ResultsCard";
import { FileDown, Sparkles, Loader2 } from "lucide-react";
import jsPDF from "jspdf";

interface Expense {
  id: string;
  name: string;
  amount: number;
}

interface PropertyData {
  accountHolder: string;
  address: string;
  fileNumber: string;
  neighborhood: string;
}

const INITIAL_EXPENSES: Expense[] = [
  { id: "hipoteca", name: "Compra / Hipoteca", amount: 0 },
  { id: "remodelacion", name: "Remodelación", amount: 0 },
  { id: "reembolso", name: "Reembolso Propietario", amount: 0 },
  { id: "gestion", name: "Gestión de Crédito", amount: 0 },
  { id: "predial", name: "Predial", amount: 0 },
  { id: "agua", name: "Agua", amount: 0 },
  { id: "luz", name: "Electricidad", amount: 0 },
  { id: "avaluo", name: "Avalúo / Planos", amount: 0 },
  { id: "isr", name: "ISR (Opcional)", amount: 0 },
  { id: "contingencia", name: "Contingencia / Otros", amount: 0 },
];

const Index = () => {
  const [salePrice, setSalePrice] = useState<number>(0);
  const [commissionPercentage, setCommissionPercentage] = useState<number>(0);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [propertyData, setPropertyData] = useState<PropertyData>({
    accountHolder: "",
    address: "",
    fileNumber: "",
    neighborhood: "",
  });
  const [aiInsight, setAiInsight] = useState<string>("");
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);

  const updateExpense = (id: string, amount: number) => {
    setExpenses(prev => prev.map(exp => 
      exp.id === id ? { ...exp, amount } : exp
    ));
  };

  const calculations = useMemo(() => {
    const baseCalculo = salePrice * (1 - commissionPercentage / 100);
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const superavitDeficit = baseCalculo - totalExpenses;
    const marginBenefit = salePrice > 0 ? (superavitDeficit / salePrice) * 100 : 0;
    const roi = totalExpenses > 0 ? (superavitDeficit / totalExpenses) * 100 : 0;

    const expensesWithPercentage = expenses.map(exp => ({
      ...exp,
      percentage: salePrice > 0 ? (exp.amount / salePrice) * 100 : 0
    }));

    const totalPercentage = salePrice > 0 ? (totalExpenses / salePrice) * 100 : 0;
    
    // Verificar si hay datos suficientes para mostrar clasificación
    const hasData = salePrice > 0 && totalExpenses > 0;
    
    // Clasificación: 'excellent' (>20%), 'viable' (>10%), 'caution' (0-10%), 'not-viable' (<0)
    let classification: 'pending' | 'excellent' | 'viable' | 'caution' | 'not-viable' = 'pending';
    if (hasData) {
      if (superavitDeficit <= 0) {
        classification = 'not-viable';
      } else if (marginBenefit <= 10) {
        classification = 'caution';
      } else if (marginBenefit <= 20) {
        classification = 'viable';
      } else {
        classification = 'excellent';
      }
    }

    return {
      expensesWithPercentage,
      baseCalculo,
      totalExpenses,
      totalPercentage,
      superavitDeficit,
      marginBenefit,
      roi,
      isViable: superavitDeficit > 0,
      hasData,
      classification
    };
  }, [expenses, salePrice, commissionPercentage]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const generateAIInsight = () => {
    // No generar insight si no hay datos
    if (!calculations.hasData) {
      return;
    }
    
    setIsGeneratingInsight(true);
    
    // Simular delay de IA
    setTimeout(() => {
      const { superavitDeficit, marginBenefit, roi, totalExpenses, isViable } = calculations;
      
      let insight = "";
      
      if (isViable) {
        if (marginBenefit > 20) {
          insight = `🎯 Excelente oportunidad de inversión. Con un margen de beneficio del ${marginBenefit.toFixed(2)}% y un ROI del ${roi.toFixed(2)}%, este proyecto presenta un perfil de riesgo-retorno muy favorable. La inversión total de ${formatCurrency(totalExpenses)} generaría una ganancia neta de ${formatCurrency(superavitDeficit)}. Se recomienda proceder con la adquisición, asegurando que los costos de remodelación no excedan el presupuesto establecido.`;
        } else if (marginBenefit > 10) {
          insight = `✅ Proyecto viable con margen moderado. El margen de beneficio del ${marginBenefit.toFixed(2)}% está dentro de parámetros aceptables para flipping inmobiliario. El ROI proyectado de ${roi.toFixed(2)}% es competitivo. Se sugiere negociar el precio de compra para mejorar la rentabilidad y mantener un fondo de contingencia del 5-10% adicional.`;
        } else {
          insight = `⚠️ Proyecto viable pero con margen ajustado. Con un margen del ${marginBenefit.toFixed(2)}%, cualquier imprevisto podría afectar significativamente la rentabilidad. Se recomienda revisar los costos de remodelación, buscar reducir gastos operativos, o negociar mejor precio de compra antes de proceder.`;
        }
      } else {
        insight = `🚫 Proyecto no viable en condiciones actuales. El análisis muestra un déficit de ${formatCurrency(Math.abs(superavitDeficit))}. Para hacer viable este proyecto se necesita: reducir el precio de compra en al menos ${formatCurrency(Math.abs(superavitDeficit) * 1.1)}, o incrementar el precio de venta estimado. Considere renegociar términos o buscar otra propiedad.`;
      }
      
      setAiInsight(insight);
      setIsGeneratingInsight(false);
    }, 1500);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;
    
    // Función helper para obtener colores según clasificación
    const getClassificationColor = () => {
      switch (calculations.classification) {
        case 'excellent': return { r: 34, g: 139, b: 34, bg: [220, 252, 231] }; // Verde
        case 'viable': return { r: 34, g: 139, b: 34, bg: [220, 252, 231] }; // Verde
        case 'caution': return { r: 180, g: 120, b: 0, bg: [254, 243, 199] }; // Amarillo/Naranja
        case 'not-viable': return { r: 220, g: 38, b: 38, bg: [254, 226, 226] }; // Rojo
        default: return { r: 100, g: 100, b: 100, bg: [240, 240, 240] }; // Gris
      }
    };
    
    const getClassificationText = () => {
      switch (calculations.classification) {
        case 'excellent': return 'Excelente';
        case 'viable': return 'Viable';
        case 'caution': return 'Ajustado';
        case 'not-viable': return 'No Viable';
        default: return 'Pendiente';
      }
    };
    
    const colors = getClassificationColor();

    // Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Análisis de Viabilidad de Flipping Inmobiliario", pageWidth / 2, y, { align: "center" });
    
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    const now = new Date();
    doc.text(`Generado el: ${now.toLocaleDateString('es-MX', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, pageWidth / 2, y, { align: "center" });
    
    doc.setTextColor(0);
    y += 15;

    // Datos Generales Box
    doc.setDrawColor(200);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 35, 3, 3, 'FD');
    
    y += 8;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Datos Generales", margin + 5, y);
    
    y += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Cuentahabiente: ${propertyData.accountHolder || "No especificado"}`, margin + 5, y);
    doc.text(`Expediente: ${propertyData.fileNumber || "No especificado"}`, pageWidth / 2, y);
    
    y += 6;
    doc.text(`Dirección: ${propertyData.address || "No especificada"}`, margin + 5, y);
    doc.text(`Colonia: ${propertyData.neighborhood || "No especificada"}`, pageWidth / 2, y);
    
    y += 20;

    // Ingresos Section
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Ingresos", margin, y);
    y += 7;
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Precio Venta Estimado (PVE)", margin, y);
    doc.text(formatCurrency(salePrice), pageWidth / 2 - 10, y, { align: "right" });
    y += 5;
    doc.text("Comisión por Intermediación (CFI)", margin, y);
    doc.text(`${commissionPercentage}%`, pageWidth / 2 - 10, y, { align: "right" });
    
    y += 12;

    // Gastos Table
    const tableWidth = 95; // Ancho fijo para la tabla de gastos
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Gastos", margin, y);
    y += 7;

    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y - 4, tableWidth, 8, 'F');
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Concepto", margin + 2, y);
    doc.text("Monto", margin + 65, y, { align: "right" });
    doc.text("% del Total", margin + tableWidth - 2, y, { align: "right" });
    y += 6;

    // Table Rows
    doc.setFont("helvetica", "normal");
    const startY = y;
    calculations.expensesWithPercentage.forEach((expense, index) => {
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y - 4, tableWidth, 6, 'F');
      }
      
      const isBold = ["hipoteca", "remodelacion", "reembolso"].includes(expense.id);
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      doc.setFontSize(7);
      doc.text(expense.name, margin + 2, y);
      doc.text(formatCurrency(expense.amount), margin + 65, y, { align: "right" });
      doc.text(`${expense.percentage.toFixed(2)}%`, margin + tableWidth - 2, y, { align: "right" });
      y += 6;
    });

    // Total de Gastos
    y += 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y - 4, tableWidth, 7, 'F');
    doc.text("Total de Gastos (TG)", margin + 2, y);
    doc.text(formatCurrency(calculations.totalExpenses), margin + 65, y, { align: "right" });
    doc.text(`${calculations.totalPercentage.toFixed(2)}%`, margin + tableWidth - 2, y, { align: "right" });

    // Right side - Resultados Financieros (al lado de gastos)
    const rightX = margin + tableWidth + 5;
    const rightWidth = pageWidth - rightX - margin;
    let rightY = startY - 13;
    
    // Resultados Financieros Box
    doc.setDrawColor(200);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(rightX, rightY, rightWidth, 52, 3, 3, 'FD');
    
    rightY += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Resultados Financieros", rightX + 5, rightY);
    
    rightY += 10;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Base de Cálculo (BC)", rightX + 5, rightY);
    doc.text(formatCurrency(calculations.baseCalculo), rightX + rightWidth - 5, rightY, { align: "right" });
    
    rightY += 6;
    doc.text("Total de Gastos (TG)", rightX + 5, rightY);
    doc.text(formatCurrency(calculations.totalExpenses), rightX + rightWidth - 5, rightY, { align: "right" });
    
    // Superávit/Déficit
    rightY += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Superávit / Déficit", rightX + 5, rightY);
    doc.setTextColor(colors.r, colors.g, colors.b);
    doc.text(formatCurrency(calculations.superavitDeficit), rightX + rightWidth - 5, rightY, { align: "right" });
    doc.setTextColor(0);
    
    rightY += 8;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Margen de Beneficio", rightX + 5, rightY);
    doc.text(`${calculations.marginBenefit.toFixed(2)}%`, rightX + rightWidth - 5, rightY, { align: "right" });
    
    rightY += 6;
    doc.text("Retorno de Inversión (ROI)", rightX + 5, rightY);
    doc.text(`${calculations.roi.toFixed(2)}%`, rightX + rightWidth - 5, rightY, { align: "right" });

    // Clasificación de Viabilidad (debajo de resultados)
    rightY += 10;
    doc.setFillColor(colors.bg[0], colors.bg[1], colors.bg[2]);
    doc.roundedRect(rightX, rightY, rightWidth, 20, 3, 3, 'F');
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Clasificación de Viabilidad", rightX + 5, rightY + 8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(colors.r, colors.g, colors.b);
    doc.text(getClassificationText(), rightX + 5, rightY + 16);
    doc.setTextColor(0);

    // AI Insight (al lado derecho, debajo de clasificación)
    if (aiInsight) {
      rightY += 25;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(rightX, rightY, rightWidth, 35, 3, 3, 'FD');
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Insight IA", rightX + 5, rightY + 8);
      
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      const cleanInsight = aiInsight.replace(/[🎯✅⚠️🚫]/g, '').trim();
      const splitInsight = doc.splitTextToSize(cleanInsight, rightWidth - 10);
      doc.text(splitInsight.slice(0, 5), rightX + 5, rightY + 15);
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Documento generado automáticamente para expediente.", pageWidth / 2, 285, { align: "center" });

    // Download
    const fileName = propertyData.fileNumber 
      ? `Viabilidad_${propertyData.fileNumber}.pdf`
      : `Viabilidad_${now.toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Análisis de Viabilidad de Flipping Inmobiliario
          </h1>
          <p className="text-muted-foreground">
            Calculadora profesional para inversión inmobiliaria
          </p>
        </div>

        {/* Status Banner */}
        <div className={`flex items-center justify-between p-4 rounded-lg ${
          calculations.classification === 'pending' ? 'bg-muted border-2 border-border' :
          calculations.classification === 'not-viable' ? 'bg-destructive/20 border-2 border-destructive' :
          calculations.classification === 'caution' ? 'bg-amber-500/20 border-2 border-amber-500' :
          'bg-success/20 border-2 border-success'
        }`}>
          <span className="text-lg font-semibold text-foreground">CLASIFICACIÓN</span>
          <div className="flex items-center gap-4">
            {calculations.classification === 'pending' ? (
              <span className="px-4 py-2 rounded font-bold text-lg bg-muted text-muted-foreground">
                PENDIENTE
              </span>
            ) : (
              <>
                <span className={`px-4 py-2 rounded font-bold text-lg text-white ${
                  calculations.classification === 'not-viable' ? 'bg-destructive' :
                  calculations.classification === 'caution' ? 'bg-amber-500' :
                  'bg-success'
                }`}>
                  {calculations.classification === 'not-viable' ? 'NO VIABLE' :
                   calculations.classification === 'caution' ? 'AJUSTADO' :
                   calculations.classification === 'excellent' ? 'EXCELENTE' : 'VIABLE'}
                </span>
                <span className={`text-2xl font-mono font-bold ${
                  calculations.classification === 'not-viable' ? 'text-destructive' :
                  calculations.classification === 'caution' ? 'text-amber-600' :
                  'text-success'
                }`}>
                  {formatCurrency(calculations.superavitDeficit)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Datos Generales */}
        <Card className="card-glass p-6 animate-slide-up">
          <h2 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">
            Datos Generales
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Cuentahabiente
                </label>
                <Input
                  type="text"
                  value={propertyData.accountHolder}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, accountHolder: e.target.value }))}
                  placeholder="Nombre completo"
                  className="bg-input"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Dirección
                </label>
                <Input
                  type="text"
                  value={propertyData.address}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Calle, número, ciudad"
                  className="bg-input"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Expediente
                </label>
                <Input
                  type="text"
                  value={propertyData.fileNumber}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, fileNumber: e.target.value }))}
                  placeholder="EXP-00123"
                  className="bg-input"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Colonia
                </label>
                <Input
                  type="text"
                  value={propertyData.neighborhood}
                  onChange={(e) => setPropertyData(prev => ({ ...prev, neighborhood: e.target.value }))}
                  placeholder="Nombre de la colonia"
                  className="bg-input"
                />
              </div>
            </div>
          </div>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Ingresos y Gastos */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ingresos */}
            <Card className="card-glass p-6 animate-slide-up">
              <h2 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">
                Ingresos
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Precio Venta Estimado (PVE)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-muted-foreground">$</span>
                    <Input
                      type="number"
                      value={salePrice || ""}
                      onChange={(e) => setSalePrice(Number(e.target.value) || 0)}
                      className="input-financial text-lg"
                      placeholder="2,000,000"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Comisión por Intermediación (CFI)
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={commissionPercentage || ""}
                      onChange={(e) => setCommissionPercentage(Number(e.target.value) || 0)}
                      className="input-financial text-lg"
                      placeholder="5"
                    />
                    <span className="text-lg font-semibold text-muted-foreground">%</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Gastos Table */}
            <Card className="card-glass overflow-hidden animate-slide-up">
              <div className="table-header px-4 py-3">
                <h2 className="text-lg font-semibold">Gastos</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-secondary border-b border-border">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-secondary-foreground">
                        Concepto
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-secondary-foreground">
                        Monto
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-secondary-foreground">
                        % del Total
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
                      <td className="px-4 py-3 font-bold text-foreground">
                        Total de Gastos (TG)
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                        {formatCurrency(calculations.totalExpenses)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-primary">
                        {calculations.totalPercentage.toFixed(2)}%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {/* Resultados Financieros */}
            <Card className="card-glass p-6 animate-slide-up">
              <h3 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-2">
                Resultados Financieros
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-border/30">
                  <span className="text-sm text-muted-foreground">Base de Cálculo (BC)</span>
                  <span className="font-mono font-semibold text-foreground">
                    {formatCurrency(calculations.baseCalculo)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-border/30">
                  <span className="text-sm text-muted-foreground">Total de Gastos (TG)</span>
                  <span className="font-mono font-semibold text-foreground">
                    {formatCurrency(calculations.totalExpenses)}
                  </span>
                </div>

                <div className={`flex justify-between items-center py-3 px-3 rounded-lg ${
                  calculations.classification === 'pending' ? 'bg-muted' :
                  calculations.classification === 'not-viable' ? 'bg-destructive/20' :
                  calculations.classification === 'caution' ? 'bg-amber-500/20' :
                  'bg-success/20'
                }`}>
                  <span className="font-semibold text-foreground">Superávit / Déficit</span>
                  <span className={`font-mono font-bold text-lg ${
                    calculations.classification === 'pending' ? 'text-muted-foreground' :
                    calculations.classification === 'not-viable' ? 'text-destructive' :
                    calculations.classification === 'caution' ? 'text-amber-600' :
                    'text-success'
                  }`}>
                    {calculations.hasData ? formatCurrency(calculations.superavitDeficit) : '-'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-border/30">
                  <span className="text-sm text-muted-foreground">Margen de Beneficio</span>
                  <span className="font-mono font-semibold text-foreground">
                    {calculations.marginBenefit.toFixed(2)}%
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-border/30">
                  <span className="text-sm text-muted-foreground">Retorno de Inversión (ROI)</span>
                  <span className="font-mono font-semibold text-foreground">
                    {calculations.roi.toFixed(2)}%
                  </span>
                </div>
              </div>
            </Card>

            {/* Clasificación de Viabilidad */}
            <Card className={`p-6 animate-slide-up ${
              calculations.classification === 'pending' ? 'bg-muted/50 border-2 border-border' :
              calculations.classification === 'not-viable' ? 'bg-destructive/10 border-2 border-destructive' :
              calculations.classification === 'caution' ? 'bg-amber-500/10 border-2 border-amber-500' :
              'bg-success/10 border-2 border-success'
            }`}>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Clasificación de Viabilidad
              </h3>
              <p className={`text-3xl font-bold ${
                calculations.classification === 'pending' ? 'text-muted-foreground' :
                calculations.classification === 'not-viable' ? 'text-destructive' :
                calculations.classification === 'caution' ? 'text-amber-600' :
                'text-success'
              }`}>
                {calculations.classification === 'pending' ? 'Pendiente' :
                 calculations.classification === 'not-viable' ? 'No Viable' :
                 calculations.classification === 'caution' ? 'Ajustado' :
                 calculations.classification === 'excellent' ? 'Excelente' : 'Viable'}
              </p>
            </Card>

            {/* AI Insight */}
            <Card className="card-glass p-6 animate-slide-up">
              <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Insight IA
                </h3>
                <Button 
                  onClick={generateAIInsight} 
                  disabled={isGeneratingInsight || !calculations.hasData}
                  size="sm"
                  variant="outline"
                >
                  {isGeneratingInsight ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Generar"
                  )}
                </Button>
              </div>
              
              {!calculations.hasData ? (
                <p className="text-sm text-muted-foreground italic">
                  Ingresa el precio de venta y al menos un gasto para generar el análisis.
                </p>
              ) : aiInsight ? (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {aiInsight}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Haz clic en "Generar" para obtener un análisis con IA.
                </p>
              )}
            </Card>

            {/* Download PDF Button */}
            <Button 
              onClick={generatePDF} 
              className="w-full py-6 text-lg font-semibold"
              size="lg"
              disabled={!calculations.hasData}
            >
              <FileDown className="w-5 h-5 mr-2" />
              Descargar PDF
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pt-8 border-t border-border">
          Documento generado automáticamente para expediente.
        </div>
      </div>
    </div>
  );
};

export default Index;
