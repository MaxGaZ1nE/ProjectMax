import React, { useState } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { authAPI, cartAPI } from '@services/backend-api';

export default function DebugAuth() {
  const { isAuthenticated, user } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);

  const log = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleTestAuth = async () => {
    setLogs([]);
    setResult(null);

    try {
      log('🔍 Starting auth debug...');

      // Check 1: Auth context
      log(`✅ isAuthenticated: ${isAuthenticated()}`);
      log(`✅ user: ${JSON.stringify(user)}`);

      // Check 2: LocalStorage
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      log(`✅ Token in localStorage: ${token ? `Yes (${token.substring(0, 20)}...)` : 'No'}`);
      log(`✅ User in localStorage: ${storedUser ? 'Yes' : 'No'}`);

      // Check 3: API Configuration
      const apiUrl = import.meta.env?.VITE_API_URL;
      log(`✅ API URL: ${apiUrl}`);

      // Check 4: Test cart API
      log('\n📡 Testing GET /cart...');
      try {
        const response = await cartAPI.getCart();
        log(`✅ Cart API Success: ${response.status}`);
        log(`   Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
        setResult(response.data);
      } catch (err: any) {
        log(`❌ Cart API Failed: ${err?.response?.status || err.message}`);
        log(`   Error: ${err?.response?.data?.message || err.message}`);
        if (err?.response?.headers?.authorization === undefined) {
          log('   ⚠️ No Authorization header was sent!');
        }
        setResult(err?.response?.data || { error: err.message });
      }

      // Check 5: Test GET Profile
      log('\n📡 Testing GET /auth/me...');
      try {
        const response = await authAPI.getProfile();
        log(`✅ Profile API Success: ${response.status}`);
        log(`   User: ${response.data?.data?.email || response.data?.email}`);
      } catch (err: any) {
        log(`❌ Profile API Failed: ${err?.response?.status || err.message}`);
        log(`   Error: ${err?.response?.data?.message || err.message}`);
      }

      log('\n✅ Debug complete!');
    } catch (err: any) {
      log(`❌ Unexpected error: ${err.message}`);
    }
  };

  const handleClearToken = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setLogs(['✅ Token and user cleared from localStorage']);
  };

  const handleTestLogin = async () => {
    setLogs([]);
    try {
      log('🔐 Testing login...');

      // Try test credentials
      const response = await authAPI.login('test@qino.com', 'password123');
      log(`✅ Login successful!`);
      log(`   Token: ${response.normalizedData?.token?.substring(0, 20)}...`);
      log(`   Email: ${response.normalizedData?.email}`);

      // Now test cart
      log('\n📡 Testing cart after login...');
      const cartResponse = await cartAPI.getCart();
      log(`✅ Cart loaded: ${cartResponse.data?.data?.items?.length || 0} items`);
    } catch (err: any) {
      log(`❌ Login failed: ${err.message}`);
      log(`   Status: ${err?.response?.status}`);
      log(`   Message: ${err?.response?.data?.message}`);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🔧 Auth Debug Page</h1>

      {/* Buttons */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <button
          onClick={handleTestAuth}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Auth
        </button>
        <button
          onClick={handleTestLogin}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Test Login (test@qino.com)
        </button>
        <button
          onClick={handleClearToken}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear Token
        </button>
      </div>

      {/* Logs */}
      <div className="bg-gray-100 rounded p-4 mb-6 font-mono text-sm h-96 overflow-y-auto border">
        {logs.length === 0 ? (
          <div className="text-gray-500">Click a button to see logs...</div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="text-gray-800 py-1">
              {log}
            </div>
          ))
        )}
      </div>

      {/* Result */}
      {result && (
        <div className="bg-gray-100 rounded p-4 font-mono text-sm">
          <h3 className="font-bold mb-2">Response:</h3>
          <pre className="overflow-x-auto text-xs">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
