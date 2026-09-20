import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const PALETTES = [
  'bg-primary/15 text-primary',
  'bg-highlight/20 text-highlight',
  'bg-info/15 text-info',
  'bg-destructive/15 text-destructive',
  'bg-muted text-muted-foreground',
];

const SIZES = {
  xs: 'size-5 text-[0.6rem]',
  sm: 'size-6 text-[0.65rem]',
  md: 'size-8 text-micro',
  lg: 'size-10 text-small',
};

function initialsOf(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function hashOf(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % 997;
  }
  return hash;
}

export function UserAvatar({ name, size = 'md', className }) {
  const palette = PALETTES[hashOf(name || '') % PALETTES.length];

  return (
    <Avatar className={cn(SIZES[size], className)}>
      <AvatarFallback
        className={cn('font-display font-semibold tracking-tight', palette)}
        title={name || 'Unknown user'}
      >
        {initialsOf(name)}
      </AvatarFallback>
    </Avatar>
  );
}

export function UserAvatarGroup({ users = [], max = 4, size = 'sm', className }) {
  const visible = users.slice(0, max);
  const overflow = users.length - visible.length;

  return (
    <div className={cn('flex items-center', className)}>
      <div className="flex -space-x-1.5">
        {visible.map((user, index) => (
          <UserAvatar
            key={user?._id || user?.email || index}
            name={user?.name || user?.email}
            size={size}
            className="ring-2 ring-surface"
          />
        ))}
      </div>
      {overflow > 0 && (
        <span className="ml-2 text-micro text-muted-foreground">
          +{overflow} more
        </span>
      )}
    </div>
  );
}
