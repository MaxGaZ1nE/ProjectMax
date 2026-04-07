import type { FC } from 'react';

import { Page } from '@components/page';
import { LoginContent } from '@features/auth';
import { Link } from 'react-router-dom';

<Link to="/auth/register">Register</Link>

const LoginPage: FC = () => {
  return (
    <Page title="Login">
      <LoginContent />
    </Page>
  );
};

export default LoginPage;
