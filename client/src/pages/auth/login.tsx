import { useState } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { KvkkNotice } from "@/components/auth/kvkk-notice";
import { LoginForm } from "@/components/auth/login-form";
import { PageLoader } from "@/components/shared/loading-spinner";

export default function LoginPage() {
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (user) {
    // Redirect based on user role
    switch (user.role) {
      case "admin":
        return <Redirect to="/admin" />;
      case "producer":
        return <Redirect to="/producer" />;
      default:
        return <Redirect to="/dashboard" />;
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg p-4" data-testid="login-page">
      <div className="w-full max-w-md">
        {!kvkkAccepted ? (
          <KvkkNotice onAccept={() => setKvkkAccepted(true)} />
        ) : (
          <LoginForm kvkkAccepted={kvkkAccepted} />
        )}
      </div>
    </div>
  );
}
