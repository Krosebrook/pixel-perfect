import type { Meta, StoryObj } from '@storybook/react';
import { ErrorMessage } from './ErrorMessage';

const meta = {
  title: 'Components/ErrorMessage',
  component: ErrorMessage,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ErrorMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleError: Story = {
  args: {
    errors: {
      error: 'Invalid email address',
      field: 'email',
      code: 'VALIDATION_ERROR',
    },
  },
};

export const WithSuggestions: Story = {
  args: {
    errors: {
      error: 'Authentication failed',
      code: 'AUTH_ERROR',
      suggestions: [
        'Check your email and password',
        'Ensure your account is verified',
        'Try resetting your password',
      ],
    },
  },
};

export const MultipleErrors: Story = {
  args: {
    errors: [
      {
        error: 'Password too short',
        field: 'password',
        code: 'VALIDATION_ERROR',
      },
      {
        error: 'Email already exists',
        field: 'email',
        code: 'CONFLICT',
      },
    ],
  },
};

export const NetworkError: Story = {
  args: {
    errors: {
      error: 'Failed to connect to server',
      code: 'NETWORK_ERROR',
      suggestions: [
        'Check your internet connection',
        'Try again in a few moments',
      ],
    },
  },
};
