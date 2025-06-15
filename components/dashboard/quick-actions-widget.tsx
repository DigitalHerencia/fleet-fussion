import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  PlusCircle, 
  CalendarClock, 
  AlertTriangle, 
  Truck, 
  Users, 
  FileText,
  BarChart3,
  Zap 
} from 'lucide-react';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string;
  color: string;
  enabled: boolean;
}

interface QuickActionsWidgetProps {
  orgId: string;
  actions?: QuickAction[];
}

const iconMap = {
  PlusCircle,
  CalendarClock,
  AlertTriangle,
  Truck,
  Users,
  FileText,
  BarChart3,
  Zap,
} as const;

const colorMap = {
  'bg-green-500': 'bg-green-500 hover:bg-green-600 text-white',
  'bg-blue-500': 'bg-blue-500 hover:bg-blue-600 text-white',
  'bg-orange-500': 'bg-orange-500 hover:bg-orange-600 text-white',
  'bg-purple-500': 'bg-purple-500 hover:bg-purple-600 text-white',
  'bg-red-500': 'bg-red-500 hover:bg-red-600 text-white',
  'bg-indigo-500': 'bg-indigo-500 hover:bg-indigo-600 text-white',
} as const;

// Default actions for MVP
const defaultActions: QuickAction[] = [
  {
    id: 'create-load',
    title: 'Create New Load',
    description: 'Add a new load to dispatch',
    href: '/[orgId]/dispatch/loads/new',
    icon: 'PlusCircle',
    color: 'bg-green-500',
    enabled: true,
  },
  {
    id: 'schedule-maintenance',
    title: 'Schedule Maintenance',
    description: 'Plan vehicle maintenance',
    href: '/[orgId]/maintenance/schedule/new',
    icon: 'CalendarClock',
    color: 'bg-blue-500',
    enabled: true,
  },
  {
    id: 'view-alerts',
    title: 'View Alerts',
    description: 'Check compliance alerts',
    href: '/[orgId]/compliance/alerts',
    icon: 'AlertTriangle',
    color: 'bg-orange-500',
    enabled: true,
  },
  {
    id: 'add-vehicle',
    title: 'Add Vehicle',
    description: 'Register new vehicle',
    href: '/[orgId]/vehicles/new',
    icon: 'Truck',
    color: 'bg-purple-500',
    enabled: true,
  },
  {
    id: 'add-driver',
    title: 'Add Driver',
    description: 'Onboard new driver',
    href: '/[orgId]/drivers/new',
    icon: 'Users',
    color: 'bg-indigo-500',
    enabled: true,
  },
  {
    id: 'view-reports',
    title: 'View Reports',
    description: 'Access analytics',
    href: '/[orgId]/analytics/reports',
    icon: 'BarChart3',
    color: 'bg-red-500',
    enabled: true,
  },
];

export default function QuickActionsWidget({ 
  orgId, 
  actions = defaultActions 
}: QuickActionsWidgetProps) {
  const enabledActions = actions.filter(action => action.enabled);

  return (
    <Card className="h-fit">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-500" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {enabledActions.length === 0 ? (
          <div className="text-center py-8">
            <Zap className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No actions available for your role
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {enabledActions.slice(0, 6).map((action) => {
              const IconComponent = iconMap[action.icon as keyof typeof iconMap] || Zap;
              const colorClass = colorMap[action.color as keyof typeof colorMap] || colorMap['bg-blue-500'];
              
              return (
                <Link key={action.id} href={action.href.replace('[orgId]', orgId)}>
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto p-3 hover:shadow-sm transition-all"
                  >
                    <div className={`rounded-lg p-2 mr-3 ${colorClass}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-medium text-sm">{action.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {action.description}
                      </div>
                    </div>
                  </Button>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
