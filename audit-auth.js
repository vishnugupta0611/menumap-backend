async function runAuthAudit() {
  const BASE_URL = 'http://localhost:4000/api/auth';
  
  console.log("Starting Auth Audit...");
  
  // 1. Test Customer Registration
  try {
    const custRes = await fetch(`${BASE_URL}/register/customer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: "Test Customer",
        email: `testcust_${Date.now()}@test.com`,
        password: "Password123!"
      })
    });
    
    const custData = await custRes.json();
    console.log("Customer Registration Status:", custRes.status);
    if (custRes.status === 201) {
      console.log("✓ Customer Registration Successful");
    } else {
      console.log("x Customer Registration Failed:", custData);
    }
  } catch (err) {
    console.error("Network Error during customer registration:", err.message);
  }

  // 2. Test Owner Registration
  try {
    const ownerEmail = `testowner_${Date.now()}@test.com`;
    const ownerRes = await fetch(`${BASE_URL}/register/owner`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: "Test Owner",
        email: ownerEmail,
        password: "Password123!",
        restaurantName: `Test Rest ${Date.now()}`,
        city: "kanpur"
      })
    });
    
    const ownerData = await ownerRes.json();
    console.log("Owner Registration Status:", ownerRes.status);
    if (ownerRes.status === 201) {
      console.log("✓ Owner Registration Successful");
      
      // 3. Test Owner Login
      const loginRes = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: ownerEmail,
          password: "Password123!"
        })
      });
      const loginData = await loginRes.json();
      if (loginRes.status === 200 && loginData.token) {
        console.log("✓ Owner Login Successful");
      } else {
        console.log("x Owner Login Failed:", loginData);
      }
      
    } else {
      console.log("x Owner Registration Failed:", ownerData);
    }
  } catch (err) {
    console.error("Network Error during owner registration/login:", err.message);
  }
}

runAuthAudit();
