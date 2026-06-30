import React from 'react';

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};

/**
 * Error Boundary สำหรับ Seller Pages
 * ป้องกันไม่ให้ error object ถูก render
 */
export class SellerErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('SellerErrorBoundary caught error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
          <div className="max-w-sm w-full space-y-4 p-6 bg-white rounded-lg border border-red-200">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600">⚠️ เกิดข้อผิดพลาด</h1>
              <p className="text-sm text-neutral-600 mt-2">
                ระบบพบข้อผิดพลาด กรุณา refresh page หรือลองใหม่อีกครั้ง
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 font-medium"
            >
              ⟲ Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SellerErrorBoundary;
