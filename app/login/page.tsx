'use client';

import LoginForm from '@/components/auth/LoginForm';
import classes from '@/components/auth/AuthForm.module.css';

export default function LoginPage() {
  return (
    <div className="pageContainer">
      <h1 className={classes.h1Title}>Zaloguj się</h1>
      <LoginForm />
    </div>
  );
}