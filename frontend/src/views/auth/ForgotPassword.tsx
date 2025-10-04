import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Button, Input } from '../../components/common';
import { RoutePath } from '../../router/types';

// Forgot password form validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormInputs = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword: React.FC = () => {
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormInputs>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormInputs) => {
    try {
      // TODO: Implement password reset logic
      console.log('Password reset request:', data);
      setShowSuccess(true);
    } catch (error) {
      console.error('Password reset error:', error);
    }
  };

  return (
    <div>
      <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
        Reset your password
      </h2>
      <p className="mt-2 text-center text-sm text-gray-600">
        Remember your password?{' '}
        <Link
          to={RoutePath.LOGIN}
          className="font-medium text-primary-600 hover:text-primary-500"
        >
          Sign in
        </Link>
      </p>

      {showSuccess && (
        <Alert
          type="success"
          title="Check your email"
          message="We have sent you instructions to reset your password."
          show={showSuccess}
          onDismiss={() => setShowSuccess(false)}
        />
      )}

      <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <Input
            type="email"
            label="Email address"
            id="email"
            autoComplete="email"
            error={errors.email?.message}
            fullWidth
            {...register('email')}
          />
          <p className="mt-2 text-sm text-gray-500">
            We'll send you a link to reset your password.
          </p>
        </div>

        <Button type="submit" fullWidth loading={isSubmitting}>
          Send reset link
        </Button>
      </form>
    </div>
  );
};

export default ForgotPassword;