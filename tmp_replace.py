from pathlib import Path
text = Path('client/src/pages/laudos/LaudoPgro.tsx').read_text(encoding='utf-8')
start = text.find('  const gerarWord = useCallback')
end = text.find('  const handleEditarEmissao', start)
if start == -1 or end == -1:
    raise SystemExit('markers not found')
new_func = '''  const gerarWord = useCallback(
    async (emissao: EmissaoPgro) => {
      if (gerandoWord) {
        toast.info("Já existe uma geração em andamento. Aguarde...");
        return;
      }

      setGerandoWord(true);
      try {
        const empresa = empresas.find((e) => e.id === emissao.empresaId);
        const empresaIdNumber = empresa?.id ? parseInt(empresa.id) : null;

        let totais = {
          totalEmpregados: 0,
          empregadosHomens: 0,
          empregadosMulheres: 0,
        };

        if (empresaIdNumber) {
          try {
            const colaboradoresData = await utils.colaboradores.list.fetch({ empresaId: empresaIdNumber });
            const colaboradoresAtivos = (colaboradoresData || []).filter((c: any) => c.status === "ativo");
            totais = {
              totalEmpregados: colaboradoresAtivos.length,
              empregadosHomens: colaboradoresAtivos.filter((c: any) => c.sexo === "masculino").length,
              empregadosMulheres: colaboradoresAtivos.filter((c: any) => c.sexo === "feminino").length,
            };
          } catch (error) {
            print("Erro ao buscar colaboradores:", error)
          }
        }

        payload = { 'emissao': emissao, 'empresa': empresa, 'totais': totais }

        response = await fetch("/api/laudos/pgro/docx", {
          'method': "POST",
          'headers': {
            "Content-Type": "application/json",
          },
          'credentials': "include",
          'body': JSON.stringify(payload),
        });

        if not response.ok:
          text_resp = await response.text()
          raise Exception(text_resp or "Falha na geração do documento")

        blob = await response.blob()
        url = window.URL.createObjectURL(blob)
        link = document.createElement("a")
        safeName = emissao.empresaNome.lower().replace("[^a-z0-9-]+", "-") if emissao.empresaNome else "pgro"
        link.href = url
        link.download = f"pgro-{safeName}-{emissao.id or 'documento'}.docx"
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
        toast.success("Documento Word gerado pelo servidor.")
      } except Exception as error:
        print("Erro ao gerar Word:", error)
        toast.error(f"Erro ao gerar documento Word: {getattr(error, 'message', 'Erro desconhecido')}")
      finally:
        setGerandoWord(False)
    },
    [empresas, utils, gerandoWord, toast]
  );

'''
Path('client/src/pages/laudos/LaudoPgro.tsx').write_text(text[:start] + new_func + text[end:], encoding='utf-8')
