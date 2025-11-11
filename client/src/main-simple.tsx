// Versão simplificada para teste
console.log("🚀 main.tsx carregado!");

const root = document.getElementById("root");
if (!root) {
  console.error("❌ Elemento #root não encontrado!");
} else {
  console.log("✅ Elemento #root encontrado!");
  root.innerHTML = `
    <div style="padding: 20px; font-family: Arial;">
      <h1>✅ Sistema Funcionando!</h1>
      <p>Se você está vendo isso, o JavaScript está carregando.</p>
      <p>Agora vamos carregar o React...</p>
    </div>
  `;
  
  // Tentar carregar React
  import("./App").then(() => {
    console.log("✅ App carregado!");
  }).catch((err) => {
    console.error("❌ Erro ao carregar App:", err);
    root.innerHTML += `<div style="color: red; margin-top: 20px;"><strong>Erro:</strong> ${err.message}</div>`;
  });
}

