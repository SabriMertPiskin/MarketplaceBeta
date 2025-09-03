import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  kvkkAccepted: boolean;
}

export function LoginForm({ kvkkAccepted }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    if (!kvkkAccepted) {
      toast({
        title: "KVKK Onayı Gerekli",
        description: "Devam etmek için KVKK metnini kabul etmelisiniz.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await login(data.email, data.password, kvkkAccepted);
      toast({
        title: "Giriş Başarılı",
        description: "Hoş geldiniz!",
      });
    } catch (error: any) {
      toast({
        title: "Giriş Hatası",
        description: error.message || "Giriş yapılırken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-lg p-8 shadow-xl border border-border" data-testid="login-form">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="w-8 h-8 bg-primary-foreground rounded text-primary font-bold flex items-center justify-center">
            3D
          </div>
        </div>
        <h1 className="text-2xl font-bold text-card-foreground">3D Baskı Pazaryeri</h1>
        <p className="text-muted-foreground mt-2">Hesabınıza giriş yapın</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-card-foreground">
            E-posta
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              {...register("email")}
              id="email"
              type="email"
              placeholder="ornek@email.com"
              className="pl-10"
              data-testid="input-email"
            />
          </div>
          {errors.email && (
            <p className="text-xs text-destructive" data-testid="error-email">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-card-foreground">
            Şifre
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              {...register("password")}
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="pl-10 pr-10"
              data-testid="input-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              data-testid="button-toggle-password"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive" data-testid="error-password">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={loading}
          data-testid="button-login"
        >
          {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <button className="text-primary hover:underline text-sm" data-testid="link-forgot-password">
          Şifremi Unuttum
        </button>
        <p className="mt-4 text-sm text-muted-foreground">
          Hesabınız yok mu?{" "}
          <button className="text-primary hover:underline" data-testid="link-register">
            Kayıt Ol
          </button>
        </p>
      </div>

      {/* Development hint */}
      {import.meta.env.DEV && (
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground mb-2">Test kullanıcıları (geliştirme):</p>
          <div className="text-xs space-y-1">
            <p><strong>Admin:</strong> admin@example.com / admin123</p>
            <p><strong>Üretici:</strong> producer@example.com / producer123</p>
            <p><strong>Müşteri:</strong> demo@example.com / demo1234</p>
          </div>
        </div>
      )}
    </div>
  );
}
