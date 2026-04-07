import type { FC } from 'react';

import { Button, Container, Heading, Row, Text } from '@components/core';
import { LanguageSwitcher } from '@components/language-switcher';
import { ThemeToggle } from '@components/theme-toggle';
import { tokens } from '@locales/index';
import { logout } from '@slices/index';
import { useAppDispatch, useAppSelector } from '@stores/index';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import Logo2 from '@assets/Logo2.png';

interface NavItem {
  path: string;
  label: string;
}

const Navbar: FC = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const cartCount = useAppSelector((state) =>
  state.cart.items.reduce((sum, item) => sum + item.qty, 0)
);
  const { t } = useTranslation();

  const handleLogout = () => {
    dispatch(logout());
  };

  // Define nav items based on auth state
  const publicNavItems: NavItem[] = [{ path: '/', label: t(tokens.nav.home) }];

  const authNavItems: NavItem[] = [
    { path: '/', label: t(tokens.nav.home) },
    // { path: '/about', label: t(tokens.nav.about) },
    // { path: '/dashboard', label: t(tokens.nav.dashboard) },
  ];

  const navItems = isAuthenticated ? authNavItems : publicNavItems;

  const isActiveLink = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-[#1a4d3a] backdrop-blur-md dark:border-neutral-800 dark:bg-bg-dark/95">
      <Container size="xl">
        <Row justify="between" align="center" className="py-4">
          <Link to="/">
            <Heading as="h1" size="lg" color="gradient">
            <img
                  src={Logo2}
                  alt="Fruit basket"
                  className="w-full h-12 object-contain drop-shadow-md"
                />
            </Heading>
          </Link>

          <ul className="flex gap-6">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`transition-colors hover:text-primary-600 dark:hover:text-primary-400  ${
                    isActiveLink(item.path)
                      ? 'font-semibold text-white dark:text-primary-400 underline underline-offset-4'
                      : 'text-white dark:text-neutral-400'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <Row gap="sm" align="center">
            <LanguageSwitcher />
            <ThemeToggle />
              <Link to="/cart" className="relative inline-flex items-center justify-center px-2">
                <span className="text-white text-xl leading-none">🛒

                </span>  {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-xs flex items-center justify-center">
                  {cartCount}
                </span>
  )}
</Link>
            {isAuthenticated ? (
              <>
                {user && (
                  <Text size="sm" color="muted" className="hidden sm:inline">
                    {user.email}
                  </Text>
                )}
                <Button variant="danger" size="sm" onClick={handleLogout}>
                  {t(tokens.auth.logout)}
                </Button>
              </>
            ) : (
              <Link to="/auth/login">
                <Button variant="primary" size="sm">
                  {t(tokens.auth.login)}
                </Button>
              </Link>
            )}
          </Row>
        </Row>
      </Container>
    </header>
  );
};

export default Navbar;
