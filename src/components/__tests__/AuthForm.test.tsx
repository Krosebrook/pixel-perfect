import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import { AuthForm } from '../AuthForm';
import { useAuth } from '@/contexts/AuthContext';

vi.mock('@/contexts/AuthContext');

describe('AuthForm', () => {
  const mockSignIn = vi.fn();
  const mockSignUp = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      signIn: mockSignIn,
      signUp: mockSignUp,
    });
  });

  it('should render sign in form by default', () => {
    renderWithProviders(<AuthForm />);

    expect(screen.getByText('Welcome to UPGE')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /sign up/i })).toBeInTheDocument();
    
    // Should show sign in form
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should switch to sign up tab', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthForm />);

    const signUpTab = screen.getByRole('tab', { name: /sign up/i });
    await user.click(signUpTab);

    // Should show display name field
    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('should submit sign in form with valid data', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('should submit sign up form with valid data', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthForm />);

    // Switch to sign up tab
    const signUpTab = screen.getByRole('tab', { name: /sign up/i });
    await user.click(signUpTab);

    const nameInput = screen.getByLabelText(/display name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password123', 'Test User');
  });

  it('should disable button during submission', async () => {
    const user = userEvent.setup();
    mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    renderWithProviders(<AuthForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // Button should be disabled and show loading text
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent(/signing in/i);
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthForm />);

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Try to submit without filling fields
    await user.click(submitButton);

    // Form should use HTML5 validation (required attribute)
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
    
    // Should not call signIn if validation fails
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('should allow sign up without display name (optional)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthForm />);

    // Switch to sign up tab
    const signUpTab = screen.getByRole('tab', { name: /sign up/i });
    await user.click(signUpTab);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    // Don't fill display name
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password123', '');
  });

  it('should have proper form accessibility', () => {
    renderWithProviders(<AuthForm />);

    // All inputs should have labels
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    expect(emailInput).toHaveAttribute('type', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Inputs should have proper IDs linking to labels
    expect(emailInput).toHaveAttribute('id');
    expect(passwordInput).toHaveAttribute('id');
  });

  it('should clear form state when switching tabs', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthForm />);

    // Fill sign in form
    const signInEmail = screen.getByLabelText(/email/i);
    await user.type(signInEmail, 'test@example.com');

    // Switch to sign up tab
    const signUpTab = screen.getByRole('tab', { name: /sign up/i });
    await user.click(signUpTab);

    // Email field should be empty in sign up form (different state)
    const signUpEmail = screen.getByLabelText(/email/i);
    expect(signUpEmail).toHaveValue('');
  });
});
