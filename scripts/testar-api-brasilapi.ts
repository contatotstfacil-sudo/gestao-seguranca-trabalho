import "dotenv/config";
import axios from "axios";

async function testarApiBrasilApi() {
  try {
    console.log("🔄 Testando Brasil API CBO...\n");
    
    // Testar diferentes formatos de URL
    const urlsParaTestar = [
      "https://brasilapi.com.br/api/cbo/v1/515105",
      "https://brasilapi.com.br/api/cbo/v1/5151-05",
      "https://brasilapi.com.br/api/cbo/v1",
      "https://brasilapi.com.br/api/cbo/v1?codigo=515105",
      "https://brasilapi.com.br/api/cbo/v1?search=eletricista",
      "https://brasilapi.com.br/api/cbo/v1/eletricista",
    ];
    
    for (const url of urlsParaTestar) {
      try {
        console.log(`\n📡 Tentando: ${url}`);
        const response = await axios.get(url, { timeout: 10000 });
        console.log(`✅ Sucesso! Status: ${response.status}`);
        console.log("📊 Estrutura dos dados:");
        if (Array.isArray(response.data)) {
          console.log(`Array com ${response.data.length} itens`);
          if (response.data.length > 0) {
            console.log("Primeiro item:", JSON.stringify(response.data[0], null, 2));
          }
        } else {
          console.log(JSON.stringify(response.data, null, 2));
        }
        break; // Se funcionou, para de testar
      } catch (error: any) {
        console.log(`❌ Erro: ${error.response?.status || error.message}`);
      }
    }
    
  } catch (error: any) {
    console.error("❌ Erro geral:", error.message);
  }
}

testarApiBrasilApi();
