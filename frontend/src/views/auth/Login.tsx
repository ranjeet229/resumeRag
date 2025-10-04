import React from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '../../components/common';
import { RoutePath } from '../../router/types';
import { useLoginMutation } from '../../store/services/auth';
import { setError } from '../../store/slices/authSlice';

// Login form validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onSubmit = async (data: LoginFormInputs) => {
    try {
      await login(data).unwrap();
      navigate(RoutePath.DASHBOARD);
    } catch (error) {
      dispatch(setError(error instanceof Error ? error.message : 'Login failed'));
    }
  };

  return (
    <div>
      <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
        Sign in to your account
      </h2>
      <p className="mt-2 text-center text-sm text-gray-600">
        Or{' '}
        <Link
          to={RoutePath.REGISTER}
          className="font-medium text-primary-600 hover:text-primary-500"
        >
          create a new account
        </Link>
      </p>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <Input
            type="email"
            label="Email address"
            id="email"
            autoComplete="email"
            error={errors.email?.message}
            fullWidth
            {...register('email')}
          />

          <Input
            type="password"
            label="Password"
            id="password"
            autoComplete="current-password"
            error={errors.password?.message}
            fullWidth
            {...register('password')}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label
              htmlFor="remember-me"
              className="ml-2 block text-sm text-gray-900"
            >
              Remember me
            </label>
          </div>

          <Link
            to={RoutePath.FORGOT_PASSWORD}
            className="text-sm font-medium text-primary-600 hover:text-primary-500"
          >
            Forgot your password?
          </Link>
        </div>

        <Button type="submit" fullWidth loading={isSubmitting || isLoading}>
          Sign in
        </Button>
      </form>
    </div>
  );
};

export default Login;