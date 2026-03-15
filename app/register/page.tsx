'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = async () => {
    setError('');
    setSuccess('');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) { // przy tworzeniu konta
      setError(error.message);
      console.log(error);
      return;
    }
    
    // dodanie roli do tabeli 'users' (1=user, 2=instructor, 3=admin)
    const {error: roleError} = await supabase.from('users').insert({UID:data.user?.id, role_id: 1})
    if(roleError){
      setError(roleError.message)
      console.log(roleError);
      return;
    }
    
    else if (data.user) {
      setSuccess('Konto utworzone. Możesz się teraz zalogować.');
      router.push('/login');
    }
  };

  return (
    <div>
      <h2>Rejestracja</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Hasło"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <button onClick={handleRegister}>Zarejestruj się</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
    </div>
  );
}