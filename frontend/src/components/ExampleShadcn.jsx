import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

const ExampleShadcn = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success(`Hello ${name}! Your email is ${email}`);
    setIsDialogOpen(false);
    setName('');
    setEmail('');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">shadcn/ui Components Example</h1>
        <p className="text-gray-600 dark:text-gray-400">
          This is an example of how to use shadcn/ui components in your project.
        </p>
      </div>

      {/* Cards Example */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Card Component</CardTitle>
            <CardDescription>
              This is a card component with header, content, and description.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is the card content area. You can put any content here.</p>
            <div className="mt-4 flex gap-2">
              <Badge variant="default">Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interactive Card</CardTitle>
            <CardDescription>
              This card shows interactive elements.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button size="sm">Small</Button>
              <Button>Default</Button>
              <Button size="lg">Large</Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Outline</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form Example */}
      <Card>
        <CardHeader>
          <CardTitle>Form Example</CardTitle>
          <CardDescription>
            Example form using shadcn/ui components.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">Submit</Button>
              <Button type="button" variant="outline" onClick={() => {
                setName('');
                setEmail('');
              }}>
                Clear
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Dialog Example */}
      <Card>
        <CardHeader>
          <CardTitle>Dialog Example</CardTitle>
          <CardDescription>
            Click the button below to open a dialog.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Open Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Example Dialog</DialogTitle>
                <DialogDescription>
                  This is an example dialog using shadcn/ui components.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <p>This dialog can contain any content you want.</p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => {
                    toast.success('Dialog action completed!');
                    setIsDialogOpen(false);
                  }}>
                    Confirm
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Toast Example */}
      <Card>
        <CardHeader>
          <CardTitle>Toast Notifications</CardTitle>
          <CardDescription>
            Click the buttons below to see different types of toast notifications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => toast.success('Success notification!')}
              variant="outline"
            >
              Success Toast
            </Button>
            <Button
              onClick={() => toast.error('Error notification!')}
              variant="outline"
            >
              Error Toast
            </Button>
            <Button
              onClick={() => toast.info('Info notification!')}
              variant="outline"
            >
              Info Toast
            </Button>
            <Button
              onClick={() => toast.warning('Warning notification!')}
              variant="outline"
            >
              Warning Toast
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExampleShadcn;
