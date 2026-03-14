'use client';

import { useForm } from 'react-hook-form';
import { LoginFormData } from '@/types/auth';

export default function LoginForm() {
  const { register, handleSubmit } = useForm<LoginFormData>();

  const onSubmit = (data: LoginFormData) => {
    console.log('Login Form Data:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="email">Email:</label>
        <input
          id="email"
          type="email"
          {...register('email')}
          required
        />
      </div>

      <div>
        <label htmlFor="password">Hasło:</label>
        <input
          id="password"
          type="password"
          {...register('password')}
          required
        />
      </div>

      <button type="submit">Zaloguj się</button>
    </form>
  );
}
