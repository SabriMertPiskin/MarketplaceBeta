import { useState } from "react";
import { Navigate } from "wouter";
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
        return <Navigate to="/admin" replace />;
      case "producer":
        return <Navigate to="/producer" replace />;
      default:
        return <Navigate to="/dashboard" replace />;
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
