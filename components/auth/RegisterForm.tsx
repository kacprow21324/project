'use client';

import { useForm } from 'react-hook-form';
import { RegisterFormData } from '@/types/auth';

export default function RegisterForm() {
  const { register, handleSubmit } = useForm<RegisterFormData>();

  const onSubmit = (data: RegisterFormData) => {
    console.log('Register Form Data:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="username">Użytkownik:</label>
        <input
          id="username"
          type="text"
          {...register('username')}
          required
        />
      </div>

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

      <div>
        <label htmlFor="role">Rola:</label>
        <select id="role" {...register('role')} required>
          <option value="">Wybierz rolę</option>
          <option value="User">Użytkownik</option>
          <option value="Instructor">Instruktor</option>
        </select>
      </div>

      <button type="submit">Zarejestruj się</button>
    </form>
  );
}
