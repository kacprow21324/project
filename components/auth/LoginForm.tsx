'use client';

import { useForm } from 'react-hook-form';
import { LoginFormData } from '@/types/auth';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (data: LoginFormData) => {
    setServerError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        setServerError(error.message);
        setLoading(false);
        return;
      }

      // Sukces - przekieruj na dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setServerError(err.message || 'Coś poszło nie tak');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="email">Email:</label>
        <input
          id="email"
          type="email"
          {...register('email', { required: 'Email jest wymagany' })}
        />
        {errors.email && <span style={{ color: 'red' }}>{errors.email.message}</span>}
      </div>

      <div>
        <label htmlFor="password">Hasło:</label>
        <input
          id="password"
          type="password"
          {...register('password', { required: 'Hasło jest wymagane' })}
        />
        {errors.password && <span style={{ color: 'red' }}>{errors.password.message}</span>}
      </div>

      {serverError && <p style={{ color: 'red' }}>{serverError}</p>}

      <button type="submit" disabled={loading}>
        {loading ? 'Poczekaj...' : 'Zaloguj się'}
      </button>
    </form>
  );
}
