'use client';

import LoginForm from '@/components/auth/LoginForm';
import classes from '@/components/auth/AuthForm.module.css';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="pageContainer">
      <h1 className={classes.h1Title}>Zaloguj się</h1>
      <LoginForm />
      <p>
        Nie masz konta? <Link href="/register">Zarejestruj się</Link>
      </p>
    </div>
  );
}