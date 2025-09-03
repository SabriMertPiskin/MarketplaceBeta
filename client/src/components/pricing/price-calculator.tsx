import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatTRY } from "@/utils/format";

interface Material {
  id: string;
  name: string;
  type: string;
  price_per_gram: number;
}

interface PricingData {
  breakdown: {
    material_cost: number;
    time_cost: number;
    support_cost: number;
    fixed_cost: number;
    producer_margin: number;
    producer_subtotal: number;
    platform_commission: number;
    payment_fee: number;
    customer_total: number;
  };
  producer_earnings: number;
  platform_commission: number;
  payment_fee: number;
  customer_price: number;
}

interface PriceCalculatorProps {
  materials?: Material[];
  onPriceChange?: (pricing: PricingData) => void;
  productId?: string;
  className?: string;
}

export function PriceCalculator({
  materials = [],
  onPriceChange,
  productId,
  className,
}: PriceCalculatorProps) {
  const [selectedMaterial, setSelectedMaterial] = useState<string>("");
  const [infillDensity, setInfillDensity] = useState([20]);
  const [supportRequired, setSupportRequired] = useState(false);
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(false);

  // Default materials if none provided
  const defaultMaterials: Material[] = [
    { id: "pla", name: "PLA", type: "PLA", price_per_gram: 0.02 },
    { id: "abs", name: "ABS", type: "ABS", price_per_gram: 0.03 },
    { id: "petg", name: "PETG", type: "PETG", price_per_gram: 0.04 },
    { id: "tpu", name: "TPU", type: "TPU", price_per_gram: 0.06 },
  ];

  const availableMaterials = materials.length > 0 ? materials : defaultMaterials;

  useEffect(() => {
    if (selectedMaterial && productId) {
      calculatePrice();
    }
  }, [selectedMaterial, infillDensity[0], supportRequired, productId]);

  const calculatePrice = async () => {
    if (!selectedMaterial || !productId) return;

    setLoading(true);
    try {
      // Mock calculation for now - replace with actual API call
      const mockPricing: PricingData = {
        breakdown: {
          material_cost: 12.5,
          time_cost: 18.0,
          support_cost: supportRequired ? 5.0 : 0,
          fixed_cost: 2.0,
          producer_margin: 7.5,
          producer_subtotal: 45.0,
          platform_commission: 6.75,
          payment_fee: 1.25,
          customer_total: 53.0,
        },
        producer_earnings: 38.25,
        platform_commission: 6.75,
        payment_fee: 1.25,
        customer_price: 53.0,
      };

      setPricing(mockPricing);
      onPriceChange?.(mockPricing);
    } catch (error) {
      console.error("Price calculation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={className} data-testid="price-calculator">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-card-foreground">
          Fiyat Hesaplayıcı
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Material Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-card-foreground">
            Malzeme
          </label>
          <Select value={selectedMaterial} onValueChange={setSelectedMaterial} data-testid="select-material">
            <SelectTrigger>
              <SelectValue placeholder="Malzeme seçin" />
            </SelectTrigger>
            <SelectContent>
              {availableMaterials.map((material) => (
                <SelectItem key={material.id} value={material.id}>
                  {material.name} - {formatTRY(material.price_per_gram)}/gram
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Infill Density */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-card-foreground">
              Dolgu Yoğunluğu
            </label>
            <span className="text-sm font-medium text-primary" data-testid="text-infill-value">
              %{infillDensity[0]}
            </span>
          </div>
          <Slider
            value={infillDensity}
            onValueChange={setInfillDensity}
            max={100}
            min={10}
            step={5}
            className="w-full"
            data-testid="slider-infill"
          />
        </div>

        {/* Support Required */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="support"
            checked={supportRequired}
            onCheckedChange={setSupportRequired}
            data-testid="checkbox-support"
          />
          <label
            htmlFor="support"
            className="text-sm text-card-foreground cursor-pointer"
          >
            Destek Malzemesi Gerekli
          </label>
        </div>

        {/* Pricing Breakdown */}
        {pricing && (
          <div className="mt-6 p-4 bg-muted rounded-lg" data-testid="pricing-breakdown">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Malzeme:</span>
                <span className="text-card-foreground" data-testid="text-material-cost">
                  {formatTRY(pricing.breakdown.material_cost)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">İşçilik:</span>
                <span className="text-card-foreground" data-testid="text-labor-cost">
                  {formatTRY(pricing.breakdown.time_cost)}
                </span>
              </div>
              {pricing.breakdown.support_cost > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Destek:</span>
                  <span className="text-card-foreground" data-testid="text-support-cost">
                    {formatTRY(pricing.breakdown.support_cost)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Platform Komisyonu:</span>
                <span className="text-card-foreground" data-testid="text-commission">
                  {formatTRY(pricing.breakdown.platform_commission)}
                </span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between items-center font-medium">
                <span className="text-card-foreground">Toplam:</span>
                <span className="text-lg text-primary" data-testid="text-total-price">
                  {formatTRY(pricing.customer_price)}
                </span>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Fiyat hesaplanıyor...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
