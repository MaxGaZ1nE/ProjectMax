import type { FC } from 'react';

import { Column, Container, CustomScrollbar, Text } from '@components/core';
import { Navbar } from '@components/navbar';
import { Outlet } from 'react-router-dom';
import { Footer } from '@/components/footer';

const MainLayout: FC = () => {
  return (
   <CustomScrollbar autoHide={false} forceVisible="y" style={{ height: '100vh' }}>
      <Column className="min-h-screen bg-neutral-50 dark:bg-bg-dark">
        <Navbar />
        <main>
          <Container size="2xl" className="py-8">
            <Outlet />
          </Container>
        </main>
        <Footer />
      </Column>
    </CustomScrollbar>
  );
};

export default MainLayout;
