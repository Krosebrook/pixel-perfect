import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Skeleton } from './skeleton';
import { Badge } from './badge';
import { AlertCircle, Check, Star } from 'lucide-react';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="w-[380px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>This is a basic card component</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content goes here. This is the main area for displaying information.</p>
      </CardContent>
    </Card>
  ),
};

export const WithHeader: Story = {
  render: () => (
    <Card className="w-[380px]">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>You have 3 unread messages.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 mt-1 text-green-600" />
            <div>
              <p className="font-medium">Your account was updated</p>
              <p className="text-sm text-muted-foreground">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-1 text-yellow-600" />
            <div>
              <p className="font-medium">API limit approaching</p>
              <p className="text-sm text-muted-foreground">5 hours ago</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <Card className="w-[380px]">
      <CardHeader>
        <CardTitle>Upgrade Plan</CardTitle>
        <CardDescription>Get access to premium features</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4">Unlock unlimited API calls, advanced analytics, and priority support.</p>
        <ul className="space-y-2">
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            <span>Unlimited API calls</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            <span>Advanced analytics</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            <span>Priority support</span>
          </li>
        </ul>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Upgrade Now</Button>
      </CardFooter>
    </Card>
  ),
};

export const WithImage: Story = {
  render: () => (
    <Card className="w-[380px] overflow-hidden">
      <div className="h-48 bg-gradient-to-br from-primary to-primary/60" />
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Featured Prompt
          <Badge variant="secondary">
            <Star className="h-3 w-3 mr-1" />
            Popular
          </Badge>
        </CardTitle>
        <CardDescription>Most used this week</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This prompt generates creative marketing copy for social media campaigns with high engagement rates.</p>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Use Template</Button>
      </CardFooter>
    </Card>
  ),
};

export const Loading: Story = {
  render: () => (
    <Card className="w-[380px]">
      <CardHeader>
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </CardContent>
    </Card>
  ),
};

export const Error: Story = {
  render: () => (
    <Card className="w-[380px] border-destructive">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          Error Loading Data
        </CardTitle>
        <CardDescription>Something went wrong</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          We couldn't load your data. This might be a temporary issue.
        </p>
        <Button variant="outline" className="w-full">Try Again</Button>
      </CardContent>
    </Card>
  ),
};

export const Interactive: Story = {
  render: () => (
    <Card className="w-[380px] cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]">
      <CardHeader>
        <CardTitle>Interactive Card</CardTitle>
        <CardDescription>Hover to see the effect</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This card responds to user interactions with smooth animations.</p>
      </CardContent>
    </Card>
  ),
};

export const GridLayout: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i}>
          <CardHeader>
            <CardTitle>Card {i}</CardTitle>
            <CardDescription>Card description {i}</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is card number {i} in a responsive grid layout.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full">
              View Details
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  },
};
