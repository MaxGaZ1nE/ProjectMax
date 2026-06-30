fetch('http://localhost:5000/api/products').then(r=>r.json()).then(data=>{console.log('API running:', !!data)}).catch(e=>{console.error('API Error:', e.message)});
