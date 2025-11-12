const fetch = require("node-fetch");

async function testLogin() {
  try {
    console.log("Testando login...");
    const response = await fetch("http://localhost:3000/api/trpc/auth.login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        json: {
          identifier: "38099529820",
          password: "G476589496i@"
        }
      })
    });
    
    const text = await response.text();
    console.log("Status:", response.status);
    console.log("Response:", text.substring(0, 500));
  } catch (error) {
    console.error("Erro:", error.message);
  }
}

testLogin();
