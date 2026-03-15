import Link from "next/link"
import classes from './Navbar.module.css'

export default async function Navbar() {
  return (
    <header className={`${classes.headerBar} shadow-lg`}>
        <div className={classes.siteName}><Link href="/">Marketplace Kursów Online</Link></div>
        <div className={classes.navLinks}>
            {/* Wszyscy */}
            <Link href="/courses" className={classes.navLink}>Przeglądaj</Link>
            {/* Zalogowani uzytkownicy */}
            <Link href="/" className={classes.navLink}>Moje kursy</Link>
            {/* Admin */}
            {/* Login*/}
            <Link href="/auth"><button className={classes.loginButton}>Zaloguj się</button></Link>
        </div>
    </header>
  )
}