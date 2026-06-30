const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
// Try to login as a user and place an order
async function test() {
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user@example.com', password: 'password123' })
  });
  const loginData = await loginRes.json();
  if (!loginData.token) {
    console.log('Login failed', loginData);
    return;
  }
  console.log('Logged in', loginData.user.id);
}
test();
