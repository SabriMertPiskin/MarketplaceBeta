import { Check, Clock, Settings, Package, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineStep {
  id: string;
  label: string;
  status: "completed" | "current" | "pending";
  timestamp?: string;
  icon?: React.ReactNode;
}

interface OrderTimelineProps {
  orderStatus: string;
  timestamps?: Record<string, string>;
  className?: string;
}

export function OrderTimeline({ orderStatus, timestamps = {}, className }: OrderTimelineProps) {
  const getSteps = (): TimelineStep[] => {
    const baseSteps = [
      {
        id: "pending",
        label: "Onaylandı",
        icon: <Check className="w-3 h-3" />,
      },
      {
        id: "paid",
        label: "Ödendi",
        icon: <Check className="w-3 h-3" />,
      },
      {
        id: "in_production",
        label: "Üretimde",
        icon: <Settings className="w-3 h-3" />,
      },
      {
        id: "completed",
        label: "Tamamlandı",
        icon: <CheckCircle className="w-3 h-3" />,
      },
    ];

    const statusOrder = ["pending", "accepted", "paid", "in_production", "completed_by_producer", "confirmed"];
    const currentIndex = statusOrder.indexOf(orderStatus);

    return baseSteps.map((step, index) => {
      let status: "completed" | "current" | "pending";
      
      if (index < currentIndex || (currentIndex >= 2 && index <= 2)) {
        status = "completed";
      } else if (index === currentIndex || (orderStatus === "in_production" && index === 2)) {
        status = "current";
      } else {
        status = "pending";
      }

      return {
        ...step,
        status,
        timestamp: timestamps[step.id],
      };
    });
  };

  const steps = getSteps();

  return (
    <div className={cn("space-y-4", className)} data-testid="order-timeline">
      <h4 className="font-medium text-card-foreground mb-3">Sipariş Durumu</h4>
      <div className="flex items-center space-x-4">
        {steps.map((step, index) => (
          <div key={step.id} className="timeline-step flex flex-col items-center">
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center relative z-10",
                {
                  "bg-secondary text-secondary-foreground": step.status === "completed",
                  "bg-primary text-primary-foreground": step.status === "current",
                  "bg-muted border-2 border-border": step.status === "pending",
                }
              )}
              data-testid={`timeline-step-${step.id}`}
            >
              {step.status === "current" && step.id === "in_production" ? (
                <Settings className="w-3 h-3 animate-spin" />
              ) : (
                step.icon
              )}
            </div>
            <p
              className={cn(
                "text-xs mt-1 text-center",
                {
                  "text-foreground font-medium": step.status === "current",
                  "text-muted-foreground": step.status !== "current",
                }
              )}
              data-testid={`timeline-label-${step.id}`}
            >
              {step.label}
            </p>
            {step.timestamp && (
              <p className="text-xs text-muted-foreground mt-1" data-testid={`timeline-time-${step.id}`}>
                {new Date(step.timestamp).toLocaleDateString("tr-TR")}
              </p>
            )}
            
            {/* Connection line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "absolute left-8 top-3 h-0.5 w-8 -z-10",
                  step.status === "completed" ? "bg-secondary" : "bg-border"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface OrderStatusBadgeProps {
  status: string;
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    const configs = {
      draft: { label: "Taslak", className: "status-draft bg-gray-100 text-gray-600" },
      pending: { label: "Onay Bekliyor", className: "status-pending bg-yellow-100 text-yellow-600" },
      accepted: { label: "Onaylandı", className: "status-accepted bg-green-100 text-green-600" },
      paid: { label: "Ödendi", className: "status-paid bg-blue-100 text-blue-600" },
      in_production: { label: "Üretimde", className: "status-in_production bg-purple-100 text-purple-600" },
      completed_by_producer: { label: "Üretim Tamamlandı", className: "status-completed bg-green-100 text-green-600" },
      confirmed: { label: "Teslim Edildi", className: "status-completed bg-green-100 text-green-600" },
      cancelled: { label: "İptal Edildi", className: "status-cancelled bg-red-100 text-red-600" },
      rejected: { label: "Reddedildi", className: "status-cancelled bg-red-100 text-red-600" },
    };

    return configs[status as keyof typeof configs] || { label: status, className: "bg-gray-100 text-gray-600" };
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={cn(
        "status-badge inline-flex items-center px-2 py-1 rounded text-xs font-medium",
        config.className,
        className
      )}
      data-testid={`status-badge-${status}`}
    >
      {config.label}
    </span>
  );
}
