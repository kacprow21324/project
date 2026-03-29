'use client';

import RegisterForm from '@/components/auth/RegisterForm';
import classes from '@/components/auth/AuthForm.module.css';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="pageContainer">
      <h1 className={classes.h1Title}>Zarejestruj się</h1>
      <RegisterForm />
      <p>
        Masz już konto? <Link href="/login">Zaloguj się</Link>
      </p>
    </div>
  );
}