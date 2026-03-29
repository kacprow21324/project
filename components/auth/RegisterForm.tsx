'use client';

import { useForm } from 'react-hook-form';
import { RegisterFormData } from '@/types/auth';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { roleNameToId } from '@/lib/appData';
import classes from './AuthForm.module.css';

export default function RegisterForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>();
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (data: RegisterFormData) => {
    setServerError('');
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
            role: data.role,
          },
        },
      });

      if (authError) {
        setServerError(authError.message);
        setLoading(false);
        return;
      }

      const { error: userError } = await supabase
        .from('users')
        .insert({
          UID: authData.user?.id,
          role_id: roleNameToId(data.role),
        });

      if (userError) {
        setServerError(userError.message);
        setLoading(false);
        return;
      }

      router.push('/login?registered=true');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Coś poszło nie tak';
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${classes.card} shadow-lg`}>
    <form onSubmit={handleSubmit(onSubmit)} className={classes.authForm}>
      <div className={classes.inputSection}>
        <label htmlFor="username">Nazwa użytkownika:</label>
        <input
          className={classes.inputBox}
          id="username"
          type="text"
          {...register('username', { required: 'Nazwa użytkownika jest wymagana' })}
        />
        {errors.username && <span style={{ color: 'red' }}>{errors.username.message}</span>}
      </div>

      <div className={classes.inputSection}>
        <label htmlFor="email">Email:</label>
        <input className={classes.inputBox}
          id="email"
          type="email"
          {...register('email', { required: 'Email jest wymagany' })}
        />
        {errors.email && <span style={{ color: 'red' }}>{errors.email.message}</span>}
      </div>

      <div className={classes.inputSection}>
        <label htmlFor="password">Hasło:</label>
        <input className={classes.inputBox}
          id="password"
          type="password"
          {...register('password', { required: 'Hasło jest wymagane' })}
        />
        {errors.password && <span style={{ color: 'red' }}>{errors.password.message}</span>}
      </div>

      <div className={classes.inputSection}>
        <label htmlFor="role">Rola:</label>
        <select id="role" {...register('role', { required: 'Rola jest wymagana' })}>
          <option value="">Wybierz rolę</option>
          <option value="User">Użytkownik</option>
          <option value="Instructor">Instruktor</option>
          <option value="Admin">Administrator</option>
        </select>
        {errors.role && <span style={{ color: 'red' }}>{errors.role.message}</span>}
      </div>

      {serverError && <p style={{ color: 'red' }}>{serverError}</p>}

      <button type="submit" disabled={loading} className={classes.authButton}>
        {loading ? 'Poczekaj...' : 'Zarejestruj się'}
      </button>
    </form>
    </div>
  );
}
