import React from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '../../components/common';
import { RoutePath } from '../../router/types';

// Registration form validation schema
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormInputs = z.infer<typeof registerSchema>;

const Register: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormInputs) => {
    try {
      // TODO: Implement registration logic
      console.log('Registration data:', data);
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  return (
    <div>
      <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
        Create your account
      </h2>
      <p className="mt-2 text-center text-sm text-gray-600">
        Or{' '}
        <Link
          to={RoutePath.LOGIN}
          className="font-medium text-primary-600 hover:text-primary-500"
        >
          sign in to your account
        </Link>
      </p>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <Input
            type="text"
            label="Full name"
            id="name"
            autoComplete="name"
            error={errors.name?.message}
            fullWidth
            {...register('name')}
          />

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
            autoComplete="new-password"
            error={errors.password?.message}
            fullWidth
            {...register('password')}
          />

          <Input
            type="password"
            label="Confirm password"
            id="confirmPassword"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            fullWidth
            {...register('confirmPassword')}
          />
        </div>

        <Button type="submit" fullWidth loading={isSubmitting}>
          Create account
        </Button>
      </form>
    </div>
  );
};

export default Register;