'use client';

import { useState } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <section>
      <h1>{isLogin ? 'Logowanie' : 'Rejestracja'}</h1>

      {isLogin ? <LoginForm /> : <RegisterForm />}

      <div>
        <button className="text-gray-600 mt-1" onClick={() => setIsLogin(!isLogin)}>
          {isLogin
            ? 'Nie masz konta? Zarejestruj się'
            : 'Masz konto? Zaloguj się'}
        </button>
      </div>
    </section>
  );
}
