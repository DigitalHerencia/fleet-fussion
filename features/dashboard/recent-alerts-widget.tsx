// features/dashboard/recent-alerts-widget.tsx
import { getDashboardAlertsAction } from "@/lib/actions/dashboardActions";
import type { DashboardAlert } from "@/lib/actions/dashboardActions";
import { AlertTriangle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Alert extends DashboardAlert {}

interface RecentAlertsWidgetProps {
  orgId: string;
}

export default async function RecentAlertsWidget({ orgId }: RecentAlertsWidgetProps) {
  if (!orgId) {
    return <p className="text-red-400">Organization not found.</p>;
  }
  let alerts: Alert[] = [];
  try {
    const result = await getDashboardAlertsAction(orgId);
    if (result.success && Array.isArray(result.data)) {
      alerts = result.data;
    }
  } catch (e) {
    alerts = [];
  }

  const getSeverityColor = (severity: Alert["severity"]) => {
    switch (severity) {
      case "high":
        return "bg-destructive";
      case "medium":
        return "bg-warning";
      case "low":
        return "bg-primary";
      default:
        return "bg-muted";
    }
  };

  return (
    <div className="bg-black border border-border p-6 rounded-lg shadow-lg">
      <div className="flex items-center gap-2 mb-6">
        <div className="bg-yellow-300 p-1.5 rounded">
          <AlertTriangle className="h-4 w-4 text-white" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Recent Alerts</h2>
      </div>
      {alerts.length === 0 ? (
        <p className="text-muted-foreground">No recent alerts.</p>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-3 flex-1">
                <div
                  className={`w-2 h-2 rounded-full mt-2 ${getSeverityColor(alert.severity)}`}
                />
                <div className="flex-1">
                  <p className="text-sm text-foreground leading-relaxed">
                    {alert.message}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                <Clock className="h-3 w-3" />
                <span>
                  {alert.timestamp
                    ? new Date(alert.timestamp).toLocaleTimeString()
                    : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}{" "}
    </div>
  );
}
