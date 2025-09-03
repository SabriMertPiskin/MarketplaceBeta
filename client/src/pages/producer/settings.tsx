import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Save, Settings as SettingsIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatTRY } from "@/utils/format";

interface ProducerSettings {
  company_name: string;
  description: string;
  hourly_rate: number;
  fixed_cost: number;
  margin_percent: number;
  min_order_amount: number;
  auto_accept_orders: boolean;
  materials: {
    pla: { enabled: boolean; price_per_gram: number };
    abs: { enabled: boolean; price_per_gram: number };
    petg: { enabled: boolean; price_per_gram: number };
    tpu: { enabled: boolean; price_per_gram: number };
  };
}

export default function ProducerSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Mock settings - replace with actual data
  const [settings, setSettings] = useState<ProducerSettings>({
    company_name: "Özkan 3D Baskı",
    description: "Profesyonel 3D baskı hizmetleri sunuyoruz. Kaliteli malzemeler ve hızlı teslimat garantisi.",
    hourly_rate: 5.0,
    fixed_cost: 2.0,
    margin_percent: 20,
    min_order_amount: 10.0,
    auto_accept_orders: false,
    materials: {
      pla: { enabled: true, price_per_gram: 0.02 },
      abs: { enabled: true, price_per_gram: 0.03 },
      petg: { enabled: false, price_per_gram: 0.04 },
      tpu: { enabled: false, price_per_gram: 0.06 },
    },
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      // TODO: Implement settings save API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: "Ayarlar kaydedildi",
        description: "Üretici ayarlarınız başarıyla güncellendi.",
      });
    } catch (error) {
      toast({
        title: "Kaydetme hatası",
        description: "Ayarlar kaydedilirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const materialNames = {
    pla: "PLA",
    abs: "ABS", 
    petg: "PETG",
    tpu: "TPU",
  };

  return (
    <div className="space-y-8" data-testid="producer-settings">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-card-foreground mb-2">Üretici Ayarları</h2>
        <p className="text-muted-foreground">İş profilinizi ve fiyatlandırma ayarlarınızı yönetin.</p>
      </div>

      {/* Company Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <SettingsIcon className="w-5 h-5" />
            <span>Şirket Bilgileri</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="company_name">Şirket/İşletme Adı</Label>
              <Input
                id="company_name"
                value={settings.company_name}
                onChange={(e) => setSettings(prev => ({ ...prev, company_name: e.target.value }))}
                data-testid="input-company-name"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              value={settings.description}
              onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              data-testid="textarea-description"
            />
          </div>
        </CardContent>
      </Card>

      {/* Pricing Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Fiyatlandırma Ayarları</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="hourly_rate">Saatlik Ücret</Label>
              <div className="relative">
                <Input
                  id="hourly_rate"
                  type="number"
                  step="0.1"
                  value={settings.hourly_rate}
                  onChange={(e) => setSettings(prev => ({ ...prev, hourly_rate: parseFloat(e.target.value) || 0 }))}
                  data-testid="input-hourly-rate"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                  ₺/saat
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fixed_cost">Sabit Maliyet</Label>
              <div className="relative">
                <Input
                  id="fixed_cost"
                  type="number"
                  step="0.1"
                  value={settings.fixed_cost}
                  onChange={(e) => setSettings(prev => ({ ...prev, fixed_cost: parseFloat(e.target.value) || 0 }))}
                  data-testid="input-fixed-cost"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                  ₺
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Kar Marjı</Label>
              <span className="text-sm font-medium text-primary" data-testid="text-margin-value">
                %{settings.margin_percent}
              </span>
            </div>
            <Slider
              value={[settings.margin_percent]}
              onValueChange={([value]) => setSettings(prev => ({ ...prev, margin_percent: value }))}
              max={50}
              min={5}
              step={1}
              className="w-full"
              data-testid="slider-margin"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="min_order_amount">Minimum Sipariş Tutarı</Label>
            <div className="relative">
              <Input
                id="min_order_amount"
                type="number"
                step="0.1"
                value={settings.min_order_amount}
                onChange={(e) => setSettings(prev => ({ ...prev, min_order_amount: parseFloat(e.target.value) || 0 }))}
                data-testid="input-min-order"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                ₺
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Materials */}
      <Card>
        <CardHeader>
          <CardTitle>Malzeme Fiyatları</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(settings.materials).map(([key, material]) => (
            <div key={key} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={material.enabled}
                    onCheckedChange={(enabled) => 
                      setSettings(prev => ({
                        ...prev,
                        materials: {
                          ...prev.materials,
                          [key]: { ...prev.materials[key as keyof typeof prev.materials], enabled }
                        }
                      }))
                    }
                    data-testid={`switch-${key}`}
                  />
                  <Label className="text-base font-medium">
                    {materialNames[key as keyof typeof materialNames]}
                  </Label>
                </div>
                
                {material.enabled && (
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      step="0.001"
                      value={material.price_per_gram}
                      onChange={(e) => 
                        setSettings(prev => ({
                          ...prev,
                          materials: {
                            ...prev.materials,
                            [key]: { 
                              ...prev.materials[key as keyof typeof prev.materials], 
                              price_per_gram: parseFloat(e.target.value) || 0 
                            }
                          }
                        }))
                      }
                      className="w-24"
                      data-testid={`input-price-${key}`}
                    />
                    <span className="text-sm text-muted-foreground">₺/gram</span>
                  </div>
                )}
              </div>
              
              {key !== "tpu" && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Order Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Sipariş Ayarları</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Otomatik Sipariş Kabulü</Label>
              <p className="text-sm text-muted-foreground">
                Gelen siparişleri otomatik olarak kabul et
              </p>
            </div>
            <Switch
              checked={settings.auto_accept_orders}
              onCheckedChange={(auto_accept_orders) => 
                setSettings(prev => ({ ...prev, auto_accept_orders }))
              }
              data-testid="switch-auto-accept"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={loading}
          className="min-w-32"
          data-testid="button-save-settings"
        >
          {loading ? (
            "Kaydediliyor..."
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Ayarları Kaydet
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
