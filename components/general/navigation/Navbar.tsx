'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import { roleIdToName, type UserRole } from '@/lib/appData';
import classes from './Navbar.module.css';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('User');
  const router = useRouter();

  useEffect(() => {
    let isActive = true;

    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isActive) return;

        if (session?.user) {
          setUser(session.user);
          const { data: roleData, error: roleError } = await supabase
            .from('users')
            .select('role_id')
            .eq('UID', session.user.id)
            .single();

          if (!isActive) return;

          if (!roleError && roleData) {
            setUserRole(roleIdToName(roleData.role_id));
          } else {
            setUserRole('User');
          }
        } else {
          setUser(null);
          setUserRole('User');
        }
      } catch (error) {
        console.error('Blad sprawdzania sesji:', error);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isActive) return;

      if (session?.user) {
        setUser(session.user);

        const roleResult = await supabase
          .from('users')
          .select('role_id')
          .eq('UID', session.user.id)
          .single();

        if (!isActive) return;

        setUserRole(roleResult.data ? roleIdToName(roleResult.data.role_id) : 'User');
      } else {
        setUser(null);
        setUserRole('User');
      }
    });

    return () => {
      isActive = false;
      subscription?.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
  };

  return (
    <header className={classes.headerWrap}>
      <div className={classes.infoBar}>
        <div className={classes.infoInner}>
          <p className={classes.infoText}>Nowe kursy co tydzien • Nauka online • Certyfikaty ukonczenia</p>
          <div className={classes.infoLinks}>
            <Link href="/courses" className={classes.infoLink}>Dla firm</Link>
            <Link href="/dashboard" className={classes.infoLink}>Panel kursanta</Link>
            <Link href="/courses" className={classes.infoLink}>Pomoc</Link>
          </div>
        </div>
      </div>

      <div className={classes.mainBar}>
        <div className={classes.mainInner}>
          <div className={classes.brandBlock}>
            <Link href="/" className={classes.siteName}>Marketplace Kursow Online</Link>
            <p className={classes.siteSub}>Twoja platforma rozwoju kompetencji</p>
          </div>

          <nav className={classes.navCenter}>
            <Link href="/courses" className={classes.navLink}>Katalog kursow</Link>
            <Link href="/courses" className={classes.navLink}>Sciezki kariery</Link>
            <Link href="/dashboard" className={classes.navLink}>Moja nauka</Link>
            <Link href="/courses" className={classes.navLink}>Dla instruktorow</Link>
          </nav>

          <div className={classes.authArea}>
            {user ? (
              <>
                <div className={classes.userInfo}>
                  <span>Witaj, {user.email?.split('@')[0]}</span>
                  <span className={classes.rolePill}>{userRole}</span>
                </div>
                <Link href="/dashboard" className={classes.dashboardBtn}>Dashboard</Link>
                <button onClick={handleLogout} className={classes.logoutButton}>Wyloguj</button>
              </>
            ) : (
              <>
                <Link href="/login" className={classes.loginButton}>Zaloguj</Link>
                <Link href="/register" className={classes.registerButton}>Zaloz konto</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
