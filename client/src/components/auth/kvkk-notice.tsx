import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KvkkNoticeProps {
  onAccept: () => void;
}

export function KvkkNotice({ onAccept }: KvkkNoticeProps) {
  return (
    <div className="bg-card rounded-lg p-6 shadow-xl mb-6 border border-border" data-testid="kvkk-notice">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
          <ShieldCheck className="w-4 h-4 text-primary-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-card-foreground">KVKK Bildirimi</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Kişisel verileriniz, 3D baskı pazaryeri hizmetlerini sunabilmek için KVKK kapsamında işlenmektedir. 
        Devam ederek{" "}
        <a 
          href="/kvkk/aydinlatma" 
          target="_blank" 
          className="text-primary hover:underline"
          data-testid="link-kvkk-info"
        >
          veri işleme politikamızı
        </a>{" "}
        kabul etmiş olursunuz.
      </p>
      <div className="text-xs text-muted-foreground mb-4 space-y-1">
        <p><strong>İşlenen veriler:</strong> Ad-soyad, iletişim bilgileri, adres, STL dosyaları, sipariş verileri</p>
        <p><strong>Amaçlar:</strong> Sipariş/üretim/kargo/faturalandırma/müşteri desteği</p>
        <p><strong>Haklar:</strong> Bilgi alma, düzeltme, silme, itiraz, veri taşınabilirliği</p>
      </div>
      <Button 
        onClick={onAccept} 
        className="w-full"
        data-testid="button-accept-kvkk"
      >
        Kabul Ediyorum
      </Button>
    </div>
  );
}
