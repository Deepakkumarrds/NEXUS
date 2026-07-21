fetch('https://nexus-p3l0.onrender.com/api/auth/forgot-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'gowthamrdsdigital@gmail.com' })
})
.then(res => res.json())
.then(data => console.log('Live Response:', data))
.catch(err => console.error('Error:', err));
