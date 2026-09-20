import { useRef, useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronsUpDown,
  FolderKanban,
  LogOut,
  Menu,
  MessagesSquare,
  Monitor,
  Moon,
  Sun,
  UsersRound,
} from 'lucide-react';
import { useSelector } from 'react-redux';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '@/components/theme/ThemeProvider';
import { BrandMark } from '@/components/product/BrandMark';
import { UserAvatar } from '@/components/product/UserAvatar';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import NotificationPanel from '../components/NotificationPanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/chat', label: 'Chat', icon: MessagesSquare },
  { to: '/setup-team', label: 'Team', icon: UsersRound },
];

const ROLE_VARIANT = { ADMIN: 'gilt', MANAGER: 'teal', MEMBER: 'outline' };

function NavItem({ item, collapsed = false, onNavigate }) {
  const Icon = item.icon;

  const link = (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-small font-medium transition-colors duration-150 ease-kiln',
          collapsed && 'justify-center px-2',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
        )
      }
    >
      <Icon className="size-[18px] shrink-0" strokeWidth={1.75} />
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

function SidebarNav({ collapsed = false, onNavigate }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => (
        <NavItem
          key={item.to}
          item={item}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}

function UserMenu({ collapsed = false }) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className={cn(
            'flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors duration-150 ease-kiln hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
            collapsed && 'justify-center p-1.5'
          )}
        >
          <UserAvatar name={user?.name || user?.email} size="md" />
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-small font-medium text-foreground">
                  {user?.name || 'Account'}
                </span>
                <span className="mt-0.5 block">
                  <Badge variant={ROLE_VARIANT[user?.role] || 'outline'}>
                    {user?.role ? user.role.toLowerCase() : 'member'}
                  </Badge>
                </span>
              </span>
              <ChevronsUpDown className="size-4 text-faint" strokeWidth={1.75} />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side={collapsed ? 'right' : 'top'} align="start" className="w-56">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
          <DropdownMenuRadioItem value="dark">
            <Moon className="size-4" strokeWidth={1.75} />
            Dark
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="light">
            <Sun className="size-4" strokeWidth={1.75} />
            Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <Monitor className="size-4" strokeWidth={1.75} />
            System
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={handleSignOut}>
          <LogOut className="size-4" strokeWidth={1.75} />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationBell({ position = 'down-right' }) {
  const unreadCount = useSelector((state) => state.notifications.unreadCount);
  const [showNotifications, setShowNotifications] = useState(false);
  const anchorRef = useRef(null);

  return (
    <div className="relative" ref={anchorRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowNotifications((open) => !open)}
        aria-label={
          unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'
        }
        title="Notifications"
      >
        <Bell className="size-5" strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>
      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        position={position}
        ignoreRef={anchorRef}
      />
    </div>
  );
}

const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <aside className="hidden h-full w-[248px] shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <div className="flex h-16 items-center px-5">
          <BrandMark />
        </div>
        <div className="flex-1 px-3 py-2">
          <SidebarNav />
        </div>
        <div className="flex items-center gap-1 px-4 pb-2">
          <NotificationBell position="up-right" />
          <ThemeToggle />
        </div>
        <div className="border-t border-border p-3">
          <UserMenu />
        </div>
      </aside>

      <aside className="hidden h-full w-[72px] shrink-0 flex-col items-center border-r border-border bg-surface md:flex lg:hidden">
        <div className="flex h-16 items-center">
          <Link
            to="/projects"
            className="rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <BrandMark wordmark={false} />
          </Link>
        </div>
        <div className="w-full flex-1 px-2 py-2">
          <SidebarNav collapsed />
        </div>
        <div className="flex flex-col items-center gap-1 px-2 pb-2">
          <NotificationBell position="up-right" />
          <ThemeToggle />
        </div>
        <div className="w-full border-t border-border p-2">
          <UserMenu collapsed />
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-surface/95 px-4 backdrop-blur md:hidden">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open navigation">
                <Menu className="size-5" strokeWidth={1.75} />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              aria-describedby={undefined}
              className="w-[272px] gap-0 p-0"
            >
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex h-16 items-center px-5">
                <BrandMark />
              </div>
              <div className="flex-1 px-3 py-2">
                <SidebarNav onNavigate={() => setSidebarOpen(false)} />
              </div>
              <div className="border-t border-border p-3">
                <UserMenu />
              </div>
            </SheetContent>
          </Sheet>
          <BrandMark />
          <div className="ml-auto flex items-center gap-1">
            <NotificationBell />
            <ThemeToggle />
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto ">
          <div className="kiln-settle mx-auto h-full w-full max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
