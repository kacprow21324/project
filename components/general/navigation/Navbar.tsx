'use client';

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import classes from './Navbar.module.css'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [userRole, setUserRole] = useState<string>('User')

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)
          // Fetch user role
          const { data: roleData, error: roleError } = await supabase
            .from('users')
            .select('role_id')
            .eq('UID', session.user.id)
            .single();
          if (!roleError && roleData) {
            setUserRole(roleData.role_id === 2 ? 'Instructor' : 'User');
          } else {
            setUserRole('User');
          }
        } else {
          setUserRole('User');
        }
      } catch (error) {
        console.error('Błąd sprawdzania sesji:', error)
        setUserRole('User');
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user)
        // Fetch role when user logs in
        try {
          const { data: roleData, error: roleError } = await supabase
            .from('users')
            .select('role_id')
            .eq('UID', session.user.id)
            .single();
          if (!roleError && roleData) {
            setUserRole(roleData.role_id === 2 ? 'Instructor' : 'User');
          } else {
            setUserRole('User');
          }
        } catch (err) {
          console.error('Error fetching role:', err);
          setUserRole('User');
        }
      } else {
        setUser(null)
        setUserRole('User');
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  return (
    <header className={`${classes.headerBar} shadow-lg`}>
        <div className={classes.siteName}><Link href="/">Marketplace Kursów Online</Link></div>
        <div className={classes.navLinks}>
            <Link href="/courses" className={classes.navLink}>Przeglądaj</Link>

            {user ? (
              <>
                <Link href="/dashboard" className={classes.navLink}>Moje kursy</Link>
                <div className={classes.userInfo}>
                  <span>Witaj, {user.email?.split('@')[0]}!</span><span>({userRole})</span>
                  <button onClick={handleLogout} className={classes.logoutButton}>
                    Wyloguj się
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link href="/login"><button className={classes.loginButton}>Zaloguj się</button></Link>
                <Link href="/register"><button className={classes.registerButton}>Zarejestruj się</button></Link>
              </>
            )}
        </div>
    </header>
  )
}
