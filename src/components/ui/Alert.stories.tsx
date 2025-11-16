import type { Meta, StoryObj } from '@storybook/react';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { AlertCircle, CheckCircle, Info as InfoIcon, AlertTriangle, Terminal } from 'lucide-react';

const meta: Meta<typeof Alert> = {
  title: 'UI/Alert',
  component: Alert,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Default: Story = {
  render: () => (
    <Alert className="w-[500px]">
      <Terminal className="h-4 w-4" />
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        You can add components to your app using the cli.
      </AlertDescription>
    </Alert>
  ),
};

export const Destructive: Story = {
  render: () => (
    <Alert variant="destructive" className="w-[500px]">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        Your session has expired. Please log in again.
      </AlertDescription>
    </Alert>
  ),
};

export const Warning: Story = {
  render: () => (
    <Alert className="w-[500px] border-yellow-500 text-yellow-900 dark:text-yellow-100">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Warning</AlertTitle>
      <AlertDescription>
        You are approaching your monthly budget limit (85% used).
      </AlertDescription>
    </Alert>
  ),
};

export const InfoAlert: Story = {
  render: () => (
    <Alert className="w-[500px] border-blue-500 text-blue-900 dark:text-blue-100">
      <InfoIcon className="h-4 w-4" />
      <AlertTitle>Information</AlertTitle>
      <AlertDescription>
        New features have been added to your dashboard. Check them out!
      </AlertDescription>
    </Alert>
  ),
};

export const Success: Story = {
  render: () => (
    <Alert className="w-[500px] border-green-500 text-green-900 dark:text-green-100">
      <CheckCircle className="h-4 w-4" />
      <AlertTitle>Success</AlertTitle>
      <AlertDescription>
        Your settings have been saved successfully.
      </AlertDescription>
    </Alert>
  ),
};

export const WithoutTitle: Story = {
  render: () => (
    <Alert className="w-[500px]">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        A simple alert without a title. Just the essential message.
      </AlertDescription>
    </Alert>
  ),
};

export const WithoutIcon: Story = {
  render: () => (
    <Alert className="w-[500px]">
      <AlertTitle>No Icon Alert</AlertTitle>
      <AlertDescription>
        This alert doesn't have an icon, showing flexibility in design.
      </AlertDescription>
    </Alert>
  ),
};

export const LongContent: Story = {
  render: () => (
    <Alert className="w-[500px]">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>API Rate Limit Exceeded</AlertTitle>
      <AlertDescription>
        You have exceeded your API rate limit of 100 requests per hour. Your access will be restored in 45 minutes. 
        To avoid future interruptions, consider upgrading to a higher tier plan with increased limits.
        <div className="mt-2">
          <strong>Current usage:</strong> 105/100 requests
        </div>
      </AlertDescription>
    </Alert>
  ),
};

export const Stack: Story = {
  render: () => (
    <div className="w-[500px] space-y-4">
      <Alert className="border-green-500 text-green-900 dark:text-green-100">
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Profile Updated</AlertTitle>
        <AlertDescription>
          Your profile information has been saved.
        </AlertDescription>
      </Alert>
      
      <Alert className="border-blue-500 text-blue-900 dark:text-blue-100">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>New Feature</AlertTitle>
        <AlertDescription>
          Check out our new analytics dashboard.
        </AlertDescription>
      </Alert>
      
      <Alert className="border-yellow-500 text-yellow-900 dark:text-yellow-100">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Budget Alert</AlertTitle>
        <AlertDescription>
          You've used 80% of your monthly budget.
        </AlertDescription>
      </Alert>
      
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Action Required</AlertTitle>
        <AlertDescription>
          Please update your payment method.
        </AlertDescription>
      </Alert>
    </div>
  ),
  parameters: {
    layout: 'centered',
  },
};
