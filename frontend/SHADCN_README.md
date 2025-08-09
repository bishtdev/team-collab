# shadcn/ui Integration Guide

This project has been successfully integrated with shadcn/ui, a collection of reusable components built on top of Tailwind CSS and Radix UI.

## 🎨 Available Components

The following shadcn/ui components have been installed and are ready to use:

- **Button** - Various button styles and variants
- **Input** - Form input fields
- **Card** - Content containers with header, content, and description
- **Dialog** - Modal dialogs and popovers
- **Badge** - Small status indicators
- **Select** - Dropdown select components
- **Textarea** - Multi-line text input
- **Label** - Form labels
- **Sonner** - Toast notifications

## 🚀 How to Use

### 1. Import Components

```jsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
```

### 2. Basic Usage Examples

#### Button Component
```jsx
// Different variants
<Button>Default Button</Button>
<Button variant="outline">Outline Button</Button>
<Button variant="secondary">Secondary Button</Button>
<Button variant="destructive">Destructive Button</Button>

// Different sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
```

#### Card Component
```jsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description goes here</CardDescription>
  </CardHeader>
  <CardContent>
    <p>This is the card content.</p>
  </CardContent>
</Card>
```

#### Input Component
```jsx
<Input
  type="text"
  placeholder="Enter your text"
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

#### Badge Component
```jsx
<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>
```

#### Dialog Component
```jsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
    </DialogHeader>
    <p>Dialog content goes here</p>
  </DialogContent>
</Dialog>
```

#### Toast Notifications
```jsx
import { toast } from 'sonner';

// Different types of toasts
toast.success('Success message!');
toast.error('Error message!');
toast.info('Info message!');
toast.warning('Warning message!');
```

## 🎯 Component Variants

### Button Variants
- `default` - Primary button style
- `destructive` - Red button for destructive actions
- `outline` - Outlined button style
- `secondary` - Secondary button style
- `ghost` - Ghost button style
- `link` - Link-style button

### Badge Variants
- `default` - Default badge style
- `secondary` - Secondary badge style
- `outline` - Outlined badge style

### Card Structure
- `Card` - Main container
- `CardHeader` - Header section
- `CardTitle` - Card title
- `CardDescription` - Card description
- `CardContent` - Main content area

## 🔧 Adding New Components

To add new shadcn/ui components to your project:

1. Run the shadcn/ui add command:
```bash
npx shadcn@latest add [component-name]
```

2. Import and use the component:
```jsx
import { ComponentName } from '@/components/ui/component-name';
```

## 🎨 Styling

All components use Tailwind CSS classes and follow the design system defined in your `components.json` file. The components automatically adapt to your theme (light/dark mode) and use the CSS variables defined in your `src/App.css` file.

## 📁 File Structure

```
src/
├── components/
│   ├── ui/           # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   └── ...
├── lib/
│   └── utils.ts      # Utility functions for shadcn/ui
└── ...
```

## 🎯 Best Practices

1. **Use the `@/` alias** for imports to keep them clean and consistent
2. **Leverage variants** to maintain design consistency
3. **Use the `cn()` utility** for combining classes when needed
4. **Follow the component API** as documented in the shadcn/ui documentation

## 🔗 Useful Links

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Component Examples](https://ui.shadcn.com/docs/components)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🎨 Customization

You can customize the components by:
1. Modifying the CSS variables in `src/App.css`
2. Updating the `components.json` configuration
3. Editing individual component files in `src/components/ui/`

## 🚀 Example Component

Check out `src/components/ExampleShadcn.jsx` for a comprehensive example of how to use all the installed components together.
