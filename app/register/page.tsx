'use client';

import RegisterForm from '@/components/auth/RegisterForm';
import classes from '@/components/auth/AuthForm.module.css';

export default function RegisterPage() {
  return (
    <div className="pageContainer">
      <h1 className={classes.h1Title}>Zarejestruj się</h1>
      <RegisterForm />
    </div>
  );
}