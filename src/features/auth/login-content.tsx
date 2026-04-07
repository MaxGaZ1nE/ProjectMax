import {
  Button,
  Card,
  Column,
  Container,
  Form,
  FormErrorMessage,
  FormItem,
  FormLabel,
  Heading,
  PasswordField,
  Row,
  Text,
  TextButton,
  TextField,
} from '@components/core';
import { tokens } from '@locales';
import { login } from '@slices/auth-slice';
import { useAppDispatch } from '@stores/hooks';
import { useFormik } from 'formik';
import type { FC } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  initialLoginValues,
  loginSchema,
  type LoginFormValues,
} from './login-schema';
import Logo from '@assets/Logo.png';



const LoginContent: FC = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      // Mock API call - simulate authentication
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock validation: accept any phone/username with password length >= 6
      if (values.password.length < 6) {
        throw new Error('Invalid credentials');
      }

      // Create mock user from phone/username
      const mockUser = {
        id: crypto.randomUUID(),
        email: `${values.phoneOrUsername}@example.com`,
        name: values.phoneOrUsername,
      };

      // Create mock token
      const mockToken = `mock-token-${crypto.randomUUID()}`;

      // Dispatch login action to update Redux state
      dispatch(login({ user: mockUser, token: mockToken }));

      // Navigate to dashboard after successful login
      navigate('/', { replace: true });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: initialLoginValues,
    validationSchema: loginSchema,
    onSubmit: handleSubmit,
  });

  return (
    <>

      {/* Main Content - Dark Green Background */}
      <main className="bg-[#1a4d3a] flex items-center justify-center py-12 px-4 min-h-[calc(100vh-200px)]">
        <Container size="xl" className="w-full">
          <Row gap="lg" align="center" className="min-h-[600px]">
            {/* Left Side - Fruit Basket Illustration */}
            <Column
              className="hidden lg:flex flex-1">

              <div className="w-[550px]">
                <img
                  src={Logo}
                  alt="Fruit basket"
                  className="w-full h-auto object-contain drop-shadow-md"
                />
              </div>

            </Column>

            {/* Right Side - Login Form Card */}
            <div className="flex-1 max-w-md w-full mx-auto lg:mx-0">
              <Card
                variant="elevated"
                padding="lg"
                className="bg-white dark:bg-neutral-800 shadow-xl"
              >
                <Column gap="lg">
                  {/* Form Title */}
                  <Heading as="h2" size="2xl" className="text-center text-neutral-900 dark:text-white font-bold">
                    {t(tokens.auth.loginTitle)}
                  </Heading>

                  {/* Form */}
                  <Form onSubmit={formik.handleSubmit} disabled={isLoading}>
                    {/* Error Message */}
                    {error && (
                      <div className="p-3 rounded-lg bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 text-error-600 dark:text-error-400 text-sm">
                        {error}
                      </div>
                    )}

                    {/* Phone/Username Field */}
                    <FormItem
                      error={!!(formik.touched.phoneOrUsername && formik.errors.phoneOrUsername)}
                      required
                    >
                      <FormLabel>{t(tokens.auth.phoneOrUsername)}</FormLabel>
                      <TextField
                        id="phoneOrUsername"
                        name="phoneOrUsername"
                        type="text"
                        placeholder={t(tokens.auth.phoneOrUsernamePlaceholder)}
                        value={formik.values.phoneOrUsername}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.phoneOrUsername ? formik.errors.phoneOrUsername : undefined}
                        fullWidth
                      />
                    </FormItem>

                    {/* Password Field */}
                    <FormItem error={!!(formik.touched.password && formik.errors.password)} required>
                      <FormLabel>{t(tokens.auth.password)}</FormLabel>
                      <TextField
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Enter your password"
                        value={formik.values.password}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.password ? formik.errors.password : undefined}
                        fullWidth
                      />
                      {/* <FormErrorMessage>{formik.errors.password}</FormErrorMessage> */}
                    </FormItem>

                    {/* Login Button */}
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      fullWidth
                      isLoading={isLoading}
                      disabled={isLoading || !formik.isValid}
                      className="bg-[#1a4d3a] hover:bg-[#2d6b52] text-white font-medium"
                    >
                      {t(tokens.auth.loginButton)}
                    </Button>
                  </Form>

                  {/* Forgot Password Link */}
                  <TextButton
                    size="sm"
                    onClick={() => navigate('/forgot-password')}
                    className="text-left text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                  >
                    {t(tokens.auth.forgotPassword)}
                  </TextButton>

                  {/* Register Link */}
                  <Row justify="between" align="center" className="pt-2">
                    <Text size="sm" color="muted">
                      {t(tokens.auth.notRegisteredYet)}
                    </Text>
                    <TextButton
                      size="sm"
                      onClick={() => navigate('/auth/register')}
                      className="text-[#1a4d3a] dark:text-[#4ade80] hover:underline font-medium"
                    >
                      {t(tokens.auth.register)}
                    </TextButton>
                  </Row>
                </Column>
              </Card>
            </div>
          </Row>
        </Container>
      </main>
    </>
  );
};

export default LoginContent;
