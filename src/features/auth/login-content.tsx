  import type { FC } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';

import {
  Button,
  Card,
  Column,
  Container,
  Form,
  FormItem,
  FormLabel,
  Heading,
  Row,
  Text,
  TextButton,
  TextField,
} from '@components/core';

import { tokens } from '@locales';
import { useAuth } from '@contexts/AuthContext';
import { authAPI } from '@services/backend-api';

import {
  initialLoginValues,
  loginSchema,
  type LoginFormValues,
} from './login-schema';

import Logo from '@assets/Logo.png';

type LocationState = { from?: string };

const LoginContent: FC = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      // Call the API using authAPI
      // Support both email and phone/username
      await login(values.phoneOrUsername, values.password);

      // Navigate to return location or home
      const state = (location.state ?? {}) as LocationState;
      const from = state.from;
      navigate(from && typeof from === 'string' ? from : '/', { replace: true });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : (err as any)?.response?.data?.message || (err as any)?.message || 'เข้าสู่ระบบล้มเหลว';
      setError(errorMessage);
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
    <main className="bg-[#1a4d3a] flex items-center justify-center py-12 px-4 min-h-[calc(100vh-200px)]">
      <Container size="xl" className="w-full">
        <Row gap="lg" align="center" className="min-h-[600px]">
          {/* Left: Brand (เหมือน Figma) */}
          <Column className="hidden lg:flex flex-1 items-center justify-center">
            <div className="w-[520px]">
              <img
                src={Logo}
                alt="Fruit basket"
                className="w-full h-auto object-contain drop-shadow-md"
              />
            </div>
          </Column>

          {/* Right: Card */}
          <div className="flex-1 max-w-md w-full mx-auto lg:mx-0">
            <Card variant="elevated" padding="lg" className="bg-white shadow-xl rounded-lg">
              <Column gap="lg">
                <Heading as="h2" size="2xl" className="text-center text-neutral-900 font-bold">
                  เข้าสู่ระบบ
                </Heading>

                <Form onSubmit={formik.handleSubmit} disabled={isLoading}>
                  {error && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                      {error}
                    </div>
                  )}

                  <FormItem
                    error={!!(formik.touched.phoneOrUsername && formik.errors.phoneOrUsername)}
                    required
                  >
                    <FormLabel>เบอร์โทรศัพท์/อีเมล</FormLabel>
                    <TextField
                      id="phoneOrUsername"
                      name="phoneOrUsername"
                      type="text"
                      placeholder="เบอร์โทรศัพท์หรืออีเมล"
                      value={formik.values.phoneOrUsername}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.phoneOrUsername ? formik.errors.phoneOrUsername : undefined}
                      fullWidth
                    />
                  </FormItem>

                  <FormItem error={!!(formik.touched.password && formik.errors.password)} required>
                    <FormLabel>รหัสผ่าน</FormLabel>
                    <TextField
                      id="password"
                      name="password"
                      type="password"
                      placeholder="รหัสผ่าน"
                      value={formik.values.password}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.password ? formik.errors.password : undefined}
                      fullWidth
                    />
                  </FormItem>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    isLoading={isLoading}
                    disabled={isLoading || !formik.isValid}
                    className="bg-[#1a4d3a] hover:bg-[#2d6b52] text-white font-medium"
                  >
                    เข้าสู่ระบบ
                  </Button>

                  {/* ✅ เหมือน Figma: ลืมรหัสผ่าน ซ้าย | สมัครสมาชิก ขวา */}
                  <div className="mt-4 flex flex-col text-sm">
                    <div className="flex items-center justify-between">
                      <Link
                        to="/forgot-password"
                        className="text-neutral-500 hover:text-neutral-700 hover:underline underline-offset-4"
                      >
                        ลืมรหัสผ่าน?
                      </Link>

                      <div className="text-neutral-500">
                        ยังไม่มีบัญชี?{' '}
                        <Link
                          to="/auth/register"
                          className="text-[#1a4d3a] font-semibold hover:underline underline-offset-4"
                        >
                          สมัครสมาชิก
                        </Link>
                      </div>
                    </div>


                  </div>

                  {/* ถ้าคุณอยากเก็บข้อความ i18n เดิมไว้ ใช้บรรทัดนี้แทนได้ */}
                  {/* <Text size="xs" color="muted" className="mt-4 text-center">{t(tokens.auth.notRegisteredYet)}</Text> */}
                </Form>
              </Column>
            </Card>
          </div>
        </Row>
      </Container>
    </main>
  );
};

export default LoginContent;