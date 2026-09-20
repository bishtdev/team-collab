import {
  Bell,
  CalendarClock,
  FolderKanban,
  Plus,
  Settings,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/product/PageHeader';
import { EmptyState } from '@/components/product/EmptyState';
import { StatusBadge } from '@/components/product/StatusBadge';
import { UserAvatar, UserAvatarGroup } from '@/components/product/UserAvatar';
import { Kbd } from '@/components/product/Kbd';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

const COLOR_GROUPS = [
  {
    label: 'Surfaces and text',
    tokens: [
      { name: 'background', note: 'app canvas' },
      { name: 'surface', note: 'cards, panels' },
      { name: 'surface-raised', note: 'menus, dialogs' },
      { name: 'border', note: 'lines' },
      { name: 'input', note: 'field wells' },
      { name: 'foreground', note: 'primary text' },
      { name: 'muted-foreground', note: 'secondary text' },
      { name: 'faint', note: 'placeholders' },
    ],
  },
  {
    label: 'Brand and feedback',
    tokens: [
      { name: 'primary', note: 'moss — actions' },
      { name: 'highlight', note: 'gilt — accents' },
      { name: 'success', note: 'positive' },
      { name: 'warning', note: 'caution' },
      { name: 'danger', note: 'destructive' },
      { name: 'info', note: 'informational' },
      { name: 'status-todo', note: 'kanban' },
      { name: 'status-progress', note: 'kanban' },
    ],
  },
  {
    label: 'Data',
    tokens: [
      { name: 'chart-1', note: 'moss' },
      { name: 'chart-2', note: 'gilt' },
      { name: 'chart-3', note: 'teal' },
      { name: 'chart-4', note: 'rust' },
      { name: 'chart-5', note: 'umber' },
    ],
  },
];

const TYPE_SAMPLES = [
  { className: 'text-display font-semibold', label: 'display / 40 / Bricolage', text: 'Work that holds' },
  { className: 'text-h1 font-semibold', label: 'h1 / 30 / Bricolage', text: 'Projects this week' },
  { className: 'text-h2 font-semibold', label: 'h2 / 22 / Bricolage', text: 'Board settings' },
  { className: 'text-h3 font-semibold', label: 'h3 / 17 / Instrument Sans', text: 'Ship the onboarding flow' },
  { className: 'text-body', label: 'body / 15 / Instrument Sans', text: 'The canvas is warm, not white, and text is bone, not pure white.' },
  { className: 'text-small text-muted-foreground', label: 'small / 13 / muted', text: 'Updated 4 minutes ago by Avery' },
  { className: 'text-micro text-faint', label: 'micro / 11.5 / faint', text: 'KILN-142' },
];

function Section({ title, description, children }) {
  return (
    <section className="space-y-5 border-t border-border pt-10">
      <div className="space-y-1">
        <h2 className="text-h2 font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="max-w-prose text-small text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function Swatch({ name, note }) {
  return (
    <div className="space-y-2">
      <div
        className="h-14 rounded-md border border-border"
        style={{ backgroundColor: `var(--${name})` }}
      />
      <div>
        <p className="font-mono text-micro text-foreground">{name}</p>
        <p className="text-[0.65rem] text-faint">{note}</p>
      </div>
    </div>
  );
}

export default function Styleguide() {
  return (
    <div className="space-y-10">
      <PageHeader
        title="Kiln design system"
        description="Every token and primitive in one place. Dark is default; switch themes from the header menu. This page is the visual contract — new components get added here first."
      >
        <ThemeToggle />
      </PageHeader>

      <Section
        title="Color"
        description="Primitives live in styles/primitives.css; these semantic tokens are what components consume. Swatches render the live values."
      >
        <div className="space-y-8">
          {COLOR_GROUPS.map((group) => (
            <div key={group.label} className="space-y-3">
              <p className="text-small font-medium text-foreground">{group.label}</p>
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
                {group.tokens.map((token) => (
                  <Swatch key={token.name} {...token} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Typography"
        description="Bricolage Grotesque for display, Instrument Sans for UI, Spline Sans Mono for machine data only."
      >
        <div className="space-y-5 rounded-lg border border-border bg-surface p-6">
          {TYPE_SAMPLES.map((sample) => (
            <div key={sample.label} className="space-y-1">
              <p className={`${sample.className} text-foreground`}>{sample.text}</p>
              <p className="text-micro text-faint">{sample.label}</p>
            </div>
          ))}
          <p className="font-mono text-small text-foreground">KILN-142 · 4.2h logged</p>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Delete</Button>
            <Button variant="link">Learn more</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button>Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon" aria-label="Settings">
              <Settings className="size-4" strokeWidth={1.75} />
            </Button>
            <Button loading>Creating…</Button>
            <Button disabled>Disabled</Button>
          </div>
        </div>
      </Section>

      <Section title="Badges and status">
        <div className="flex flex-wrap items-center gap-3">
          <Badge>Default</Badge>
          <Badge variant="moss">Moss</Badge>
          <Badge variant="gilt">Gilt</Badge>
          <Badge variant="teal">Teal</Badge>
          <Badge variant="rust">Rust</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status="todo" />
          <StatusBadge status="in-progress" />
          <StatusBadge status="done" />
        </div>
      </Section>

      <Section title="Forms">
        <div className="grid gap-6 rounded-lg border border-border bg-surface p-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="demo-name">Name</Label>
            <Input id="demo-name" placeholder="Avery Stone" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="demo-email">Email (error)</Label>
            <Input id="demo-email" aria-invalid placeholder="not-an-email" aria-describedby="demo-email-error" />
            <p id="demo-email-error" className="text-micro text-destructive">
              That email address doesn't look right.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="demo-role">Role</Label>
            <Select defaultValue="member">
              <SelectTrigger id="demo-role">
                <SelectValue placeholder="Choose a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="demo-notes">Description</Label>
            <Textarea id="demo-notes" placeholder="What is this project about?" />
          </div>
          <div className="flex items-center gap-3">
            <Checkbox id="demo-check" defaultChecked />
            <Label htmlFor="demo-check">Notify members on changes</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch id="demo-switch" defaultChecked />
            <Label htmlFor="demo-switch">Public board</Label>
          </div>
        </div>
      </Section>

      <Section title="Cards and progress">
        <div className="grid gap-5 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Onboarding flow</CardTitle>
              <CardDescription>
                6 tasks · updated 4 minutes ago by Avery
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress value={62} />
              <p className="text-small text-muted-foreground">62% complete</p>
            </CardContent>
            <CardFooter className="justify-between border-t border-border pt-4">
              <UserAvatarGroup
                users={[{ name: 'Avery Stone' }, { name: 'Noah Reid' }, { name: 'Mira Chen' }]}
              />
              <Button variant="ghost" size="sm">
                Open board
              </Button>
            </CardFooter>
          </Card>

          <Card className="gap-3 p-4">
            <p className="text-small font-medium text-foreground">
              Draft the pricing page copy
            </p>
            <p className="line-clamp-2 text-small text-muted-foreground">
              Cover the three plans, keep the tone plain, and link the comparison table.
            </p>
            <div className="flex items-center justify-between pt-1">
              <UserAvatar name="Avery Stone" size="sm" />
              <StatusBadge status="in-progress" />
            </div>
          </Card>
        </div>
      </Section>

      <Section title="Avatars">
        <div className="flex flex-wrap items-center gap-5">
          <UserAvatar name="Avery Stone" size="xs" />
          <UserAvatar name="Avery Stone" size="sm" />
          <UserAvatar name="Avery Stone" size="md" />
          <UserAvatar name="Avery Stone" size="lg" />
          <UserAvatarGroup
            users={[
              { name: 'Avery Stone' },
              { name: 'Noah Reid' },
              { name: 'Mira Chen' },
              { name: 'Jonas Lind' },
              { name: 'Priya Rao' },
            ]}
          />
        </div>
      </Section>

      <Section title="Overlays" description="Radix-based: focus trapped, escape closes, ARIA wired.">
        <div className="flex flex-wrap items-center gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New project</DialogTitle>
                <DialogDescription>
                  Give the project a name and description. You can add members after.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="demo-project">Name</Label>
                <Input id="demo-project" placeholder="Website relaunch" />
              </div>
              <DialogFooter>
                <Button>Create project</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">Delete confirm</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this task?</AlertDialogTitle>
                <AlertDialogDescription>
                  This can't be undone. The task and its history are removed for everyone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep task</AlertDialogCancel>
                <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete task
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Open menu</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Task</DropdownMenuLabel>
              <DropdownMenuItem>
                <FolderKanban className="size-4" strokeWidth={1.75} />
                Move to project
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CalendarClock className="size-4" strokeWidth={1.75} />
                Set due date
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
                <Trash2 className="size-4" strokeWidth={1.75} />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Notifications">
                <Bell className="size-4" strokeWidth={1.75} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Notifications arrive in Plan 2</TooltipContent>
          </Tooltip>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Open sheet</Button>
            </SheetTrigger>
            <SheetContent aria-describedby={undefined}>
              <SheetHeader>
                <SheetTitle>Sheet</SheetTitle>
                <SheetDescription>Mobile navigation uses this pattern.</SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        </div>
      </Section>

      <Section title="Feedback and states">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={() => toast.success('Project created', { description: 'Website relaunch is ready.' })}
          >
            Success toast
          </Button>
          <Button
            variant="outline"
            onClick={() => toast.error('Could not save the task', { description: 'Check your connection and try again.' })}
          >
            Error toast
          </Button>
          <span className="text-small text-muted-foreground">
            Press <Kbd>Enter</Kbd> to send
          </span>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-3 rounded-lg border border-border bg-surface p-6">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-24 w-full" />
          </div>
          <EmptyState
            icon={Plus}
            title="No projects yet"
            description="Create the first project and give your team a place to move work."
          >
            <Button size="sm">Create project</Button>
          </EmptyState>
        </div>
      </Section>

      <Section title="In the product">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-3 rounded-lg border border-border bg-background p-5">
            <p className="text-small font-medium text-muted-foreground">Chat</p>
            <div className="flex items-start gap-3">
              <UserAvatar name="Mira Chen" size="md" />
              <div className="max-w-[80%] rounded-lg rounded-tl-sm border border-border bg-surface px-3 py-2 shadow-card">
                <p className="text-small text-foreground">
                  Pushed the board redesign — drag states feel much better.
                </p>
              </div>
            </div>
            <div className="flex flex-row-reverse items-start gap-3">
              <UserAvatar name="Avery Stone" size="md" />
              <div className="max-w-[80%] rounded-lg rounded-tr-sm bg-primary px-3 py-2 text-primary-foreground">
                <p className="text-small">Nice. Reviewing after standup.</p>
              </div>
            </div>
            <Separator />
            <p className="text-center text-micro text-faint">Today</p>
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-surface p-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-status-todo" />
                <span className="text-small font-medium text-foreground">To do</span>
                <span className="text-micro text-faint">3</span>
              </div>
              <div className="rounded-lg border border-border bg-background p-3 shadow-card">
                <p className="text-small font-medium text-foreground">Audit empty states</p>
                <div className="mt-2 flex items-center justify-between">
                  <UserAvatar name="Noah Reid" size="xs" />
                  <span className="text-micro text-faint">KILN-88</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-status-progress" />
                <span className="text-small font-medium text-foreground">In progress</span>
                <span className="text-micro text-faint">1</span>
              </div>
              <div className="rounded-lg border border-border bg-background p-3 shadow-card">
                <p className="text-small font-medium text-foreground">Draft pricing copy</p>
                <div className="mt-2 flex items-center justify-between">
                  <UserAvatar name="Avery Stone" size="xs" />
                  <span className="text-micro text-faint">KILN-92</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
