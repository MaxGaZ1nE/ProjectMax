import { ScrollbarStyles } from '@components/core';
import { AppInitializer } from '@components/app-initializer';
import { AuthProvider, ConfigProvider, ModalProvider, ToastProvider } from '@contexts/index';
import { router } from '@routes';
import { persistor, store } from '@stores/index';
import { ThemeProvider } from '@theme/index';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { PersistGate } from 'redux-persist/integration/react';
import './index.css';
import 'leaflet/dist/leaflet.css';

// Initialize i18n
import '@locales/i18n';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AuthProvider>
          <AppInitializer>
            <ConfigProvider>
              <ThemeProvider>
                <ScrollbarStyles />
                <ToastProvider>
                  <ModalProvider>
                    <RouterProvider router={router} />
                  </ModalProvider>
                </ToastProvider>
              </ThemeProvider>
            </ConfigProvider>
          </AppInitializer>
        </AuthProvider>
      </PersistGate>
    </Provider>
  </StrictMode>,
);
