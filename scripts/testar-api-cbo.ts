import "dotenv/config";
import axios from "axios";

async function testarApiCbo() {
  try {
    console.log("🔄 Testando API CBO...\n");
    
    const urls = [
      "https://raw.githubusercontent.com/datasets-br/cbo/master/data/cbo.json",
      "https://raw.githubusercontent.com/datasets-br/cbo/main/data/cbo.json",
      "https://raw.githubusercontent.com/datasets-br/cbo/master/cbo.json",
      "https://raw.githubusercontent.com/datasets-br/cbo/main/cbo.json",
    ];
    
    let data: any = null;
    let urlFuncionou = "";
    
    for (const url of urls) {
      try {
        console.log(`📡 Tentando: ${url}`);
        const response = await axios.get(url, { timeout: 10000 });
        data = response.data;
        urlFuncionou = url;
        console.log(`✅ Sucesso com: ${url}\n`);
        break;
      } catch (error: any) {
        console.log(`❌ Erro: ${error.message}\n`);
        continue;
      }
    }
    
    if (!data) {
      console.log("❌ Nenhuma URL funcionou!");
      return;
    }
    
    console.log("✅ Dados recebidos com sucesso!\n");
    console.log("📊 Tipo de dados:", Array.isArray(data) ? "Array" : typeof data);
    
    if (Array.isArray(data)) {
      console.log(`📋 Total de itens: ${data.length}`);
      if (data.length > 0) {
        console.log("\n🔍 Primeiro item:");
        console.log(JSON.stringify(data[0], null, 2));
      }
    } else if (typeof data === 'object') {
      const keys = Object.keys(data);
      console.log(`📋 Total de chaves: ${keys.length}`);
      if (keys.length > 0) {
        const firstKey = keys[0];
        console.log(`\n🔍 Primeira chave: ${firstKey}`);
        console.log("📄 Conteúdo:");
        console.log(JSON.stringify(data[firstKey], null, 2));
        
        // Testar busca por "eletricista"
        console.log("\n🔍 Testando busca por 'eletricista'...");
        const termo = "eletricista";
        const resultados = Object.values(data).filter((cargo: any) => {
          const codigo = (cargo.codigo || cargo.cbo || cargo.codigoCbo || "").toString().toLowerCase();
          const nome = (cargo.titulo || cargo.nome || cargo.nomeCargo || cargo.ocupacao || "").toString().toLowerCase();
          const descricao = (cargo.descricao || cargo.sinopse || "").toString().toLowerCase();
          
          return codigo.includes(termo) || nome.includes(termo) || descricao.includes(termo);
        });
        
        console.log(`✅ Encontrados ${resultados.length} resultados`);
        if (resultados.length > 0) {
          console.log("\n📋 Primeiros 5 resultados:");
          resultados.slice(0, 5).forEach((cargo: any, idx: number) => {
            console.log(`\n${idx + 1}. Código: ${cargo.codigo || cargo.cbo || cargo.codigoCbo || "N/A"}`);
            console.log(`   Nome: ${cargo.titulo || cargo.nome || cargo.nomeCargo || cargo.ocupacao || "N/A"}`);
          });
        }
      }
    }
    
  } catch (error: any) {
    console.error("❌ Erro ao testar API:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
  }
}

testarApiCbo();

