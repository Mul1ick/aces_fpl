import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'approved' | 'banned' | 'admin' | 'user';
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusConfig = (status: StatusBadgeProps['status']) => {
    switch (status) {
      case 'active':
      case 'approved':
        return {
          label: status === 'active' ? 'Active' : 'Approved',
          className: 'bg-success/10 text-success border-success/20 hover:bg-success/20',
        };
      case 'inactive':
      case 'banned':
        return {
          label: status === 'inactive' ? 'Inactive' : 'Banned',
          className: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20',
        };
      case 'pending':
        return {
          label: 'Pending',
          className: 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20',
        };
      case 'admin':
        return {
          label: 'Admin',
          className: 'bg-secondary/10 text-secondary border-secondary/20 hover:bg-secondary/20',
        };
      case 'user':
        return {
          label: 'User',
          className: 'bg-muted text-muted-foreground border-border hover:bg-muted/80',
        };
      default:
        return {
          label: status,
          className: 'bg-muted text-muted-foreground border-border hover:bg-muted/80',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge 
      variant="outline" 
      className={cn(
        'font-medium transition-colors admin-transition',
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}