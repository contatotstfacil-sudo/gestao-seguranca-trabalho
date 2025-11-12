/**
 * Teste HTTP direto do login - Simula acesso real
 */

// Usar fetch nativo do Node.js 18+

async function testLoginHTTP() {
  console.log("🧪 TESTE HTTP DIRETO DE LOGIN");
  console.log("=============================");
  console.log("");

  const url = "http://localhost:3000/api/trpc/auth.login";
  
  const payload = {
    json: {
      identifier: "38099529820",
      password: "G476589496i@",
    },
  };

  try {
    console.log("📡 Enviando requisição para:", url);
    console.log("📦 Payload:", JSON.stringify(payload.json));
    console.log("");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload.json),
    });

    console.log(`📥 Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Headers:`, Object.fromEntries(response.headers.entries()));
    console.log("");

    const text = await response.text();
    console.log("📄 Resposta (texto):");
    console.log(text.substring(0, 500));
    console.log("");

    try {
      const json = JSON.parse(text);
      console.log("✅ Resposta JSON válida:");
      console.log(JSON.stringify(json, null, 2).substring(0, 500));
    } catch (e) {
      console.log("❌ Resposta não é JSON válido");
    }

  } catch (error: any) {
    console.error("❌ ERRO:", error.message);
    console.error(error);
  }
}

testLoginHTTP();

