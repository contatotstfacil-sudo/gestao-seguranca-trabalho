// Página de teste ultra-simples - SEM dependências
export default function TestPage() {
  console.log("[TestPage] Componente renderizado!");
  
  return (
    <div style={{ 
      padding: "40px", 
      backgroundColor: "#e8f5e9", 
      minHeight: "100vh",
      fontFamily: "Arial, sans-serif"
    }}>
      <div style={{
        maxWidth: "600px",
        margin: "0 auto",
        backgroundColor: "white",
        padding: "30px",
        borderRadius: "10px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
      }}>
        <h1 style={{ 
          color: "#2e7d32", 
          fontSize: "32px", 
          marginBottom: "20px",
          textAlign: "center"
        }}>
          ✅ Página de Teste Funcionando!
        </h1>
        
        <div style={{
          backgroundColor: "#f1f8e9",
          padding: "20px",
          borderRadius: "5px",
          marginBottom: "20px"
        }}>
          <p style={{ color: "#33691e", fontSize: "18px", margin: "10px 0" }}>
            <strong>Status:</strong> Sistema operacional ✅
          </p>
          <p style={{ color: "#33691e", fontSize: "18px", margin: "10px 0" }}>
            <strong>Data/Hora:</strong> {new Date().toLocaleString("pt-BR")}
          </p>
          <p style={{ color: "#33691e", fontSize: "18px", margin: "10px 0" }}>
            <strong>React:</strong> Funcionando ✅
          </p>
        </div>

        <div style={{
          backgroundColor: "#e3f2fd",
          padding: "20px",
          borderRadius: "5px",
          marginTop: "20px"
        }}>
          <h2 style={{ color: "#1565c0", marginTop: 0 }}>Próximos Passos:</h2>
          <ul style={{ color: "#0d47a1", lineHeight: "1.8" }}>
            <li>Se você vê esta página = Sistema funciona! ✅</li>
            <li>Agora teste: <a href="/login" style={{ color: "#1976d2" }}>/login</a></li>
            <li>Depois teste: <a href="/colaboradores" style={{ color: "#1976d2" }}>/colaboradores</a></li>
          </ul>
        </div>

        <div style={{ marginTop: "30px", textAlign: "center" }}>
          <button
            onClick={() => window.location.href = "/login"}
            style={{
              padding: "12px 24px",
              backgroundColor: "#1976d2",
              color: "white",
              border: "none",
              borderRadius: "5px",
              fontSize: "16px",
              cursor: "pointer",
              marginRight: "10px"
            }}
          >
            Ir para Login
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "12px 24px",
              backgroundColor: "#757575",
              color: "white",
              border: "none",
              borderRadius: "5px",
              fontSize: "16px",
              cursor: "pointer"
            }}
          >
            Recarregar
          </button>
        </div>
      </div>
    </div>
  );
}
