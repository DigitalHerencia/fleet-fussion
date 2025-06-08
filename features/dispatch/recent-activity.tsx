import { Activity, Clock } from "lucide-react";

import { getRecentDispatchActivity } from "@/lib/fetchers/dispatchFetchers";

interface ActivityItem {
  id: string;
  entityType: string;
  action: string;
  entityId: string;
  timestamp: Date;
  userName: string;
}

interface RecentDispatchActivityProps {
  orgId: string;
}

export default async function RecentDispatchActivity({ orgId }: RecentDispatchActivityProps) {
  if (!orgId) {
    return <p className="text-red-400">Organization not found.</p>;
  }

  let activityItems: ActivityItem[] = [];
  try {
    const result = await getRecentDispatchActivity(orgId, 5);
    if (result.success && Array.isArray(result.data)) {
      activityItems = result.data as ActivityItem[];
    }
  } catch (e) {
    activityItems = [];
  }

  const formatLabel = (item: ActivityItem) => {
    const entity = item.entityType;
    return `${item.userName} ${item.action.toLowerCase()} ${entity} ${item.entityId}`;
  };

  return (
    <div className="bg-black border border-gray-200 p-6 rounded-lg shadow-lg">
      <div className="flex items-center gap-2 mb-6">
        <div className="bg-purple-500 p-1.5 rounded">
          <Activity className="h-4 w-4 text-white" />
        </div>
        <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
      </div>
      {activityItems.length === 0 ? (
        <p className="text-gray-400">No recent activity.</p>
      ) : (
        <div className="space-y-4">
          {activityItems.map(item => (
            <div key={item.id} className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm text-gray-200 leading-relaxed">
                  {formatLabel(item)}
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                <Clock className="h-3 w-3" />
                <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
