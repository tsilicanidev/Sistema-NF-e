const onSubmit = async (data: NotaFiscalFormData) => {
  try {
    setAttemptedSubmit(true);

    if (produtos.length === 0) {
      adicionarNotificacao('erro', 'Adicione pelo menos um produto');
      return;
    }

    if (!certificado?.arquivo || !certificado?.senha) {
      adicionarNotificacao('erro', 'Certificado digital não configurado corretamente');
      return;
    }

    setLoading(true);

    const valorTotal = produtos.reduce((total, produto) => {
      return total + (produto.quantidade * produto.valorUnitario);
    }, 0);

    const numeroNota = Math.floor(Math.random() * 1000000).toString().padStart(9, '0');
    const cNF = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');

    const chave = gerarChaveNFe(
      emissor.endereco.codigoUF,
      new Date().toISOString().slice(2, 7).replace('-', ''),
      emissor.cnpj,
      '55',
      '1',
      numeroNota,
      '1',
      cNF
    );

    const notaFiscal = {
      ide: {
        cUF: emissor.endereco.codigoUF,
        cNF,
        natOp: data.naturezaOperacao,
        mod: '55',
        serie: '1',
        nNF: numeroNota,
        dhEmi: new Date().toISOString(),
        tpNF: data.tipoOperacao,
        idDest: '1',
        cMunFG: emissor.endereco.codigoMunicipio,
        tpImp: '1',
        tpEmis: '1',
        cDV: chave.slice(-1),
        tpAmb: '2',
        finNFe: data.finalidade,
        indFinal: '1',
        indPres: '1',
        procEmi: '0',
        verProc: '1.0.0'
      },
      emit: emissor,
      dest: data.destinatario,
      det: produtos.map((prod, i) => ({
        "@nItem": (i + 1).toString(),
        prod: {
          cProd: prod.codigo,
          cEAN: '',
          xProd: prod.descricao,
          NCM: prod.ncm,
          CFOP: prod.cfop,
          uCom: prod.unidade,
          qCom: prod.quantidade.toFixed(2),
          vUnCom: prod.valorUnitario.toFixed(2),
          vProd: (prod.quantidade * prod.valorUnitario).toFixed(2),
          cEANTrib: '',
          uTrib: prod.unidade,
          qTrib: prod.quantidade.toFixed(2),
          vUnTrib: prod.valorUnitario.toFixed(2),
          indTot: '1'
        },
        imposto: {
          ICMS: {
            ICMS00: {
              orig: prod.icms.origem,
              CST: prod.icms.cst,
              modBC: '3',
              vBC: (prod.quantidade * prod.valorUnitario).toFixed(2),
              pICMS: prod.icms.aliquota?.toFixed(2) || '0',
              vICMS: (
                ((prod.icms.aliquota || 0) / 100) * prod.quantidade * prod.valorUnitario
              ).toFixed(2)
            }
          },
          PIS: { PISNT: { CST: '07' } },
          COFINS: { COFINSNT: { CST: '07' } }
        }
      })),
      total: {
        ICMSTot: {
          vBC: valorTotal.toFixed(2),
          vICMS: '0.00',
          vICMSDeson: '0.00',
          vBCST: '0.00',
          vST: '0.00',
          vProd: valorTotal.toFixed(2),
          vFrete: '0.00',
          vSeg: '0.00',
          vDesc: '0.00',
          vII: '0.00',
          vIPI: '0.00',
          vPIS: '0.00',
          vCOFINS: '0.00',
          vOutro: '0.00',
          vNF: valorTotal.toFixed(2)
        }
      },
      transp: { modFrete: '9' },
      pag: { detPag: [{ tPag: data.formaPagamento, vPag: valorTotal.toFixed(2) }] },
      infAdic: { infCpl: data.informacoesAdicionais || '' }
    };

    const xml = gerarXmlNFe(notaFiscal, chave);

    const resultado = await emitirNotaFiscal(xml, {
      pfxBase64: certificado.arquivo,
      password: certificado.senha
    });

    if (resultado.status === 'autorizada') {
      adicionarNotificacao('sucesso', 'NF-e autorizada com sucesso');
      navigate(`/notas/visualizar/${chave}`);
    } else {
      throw new Error(resultado.mensagem || 'NF-e rejeitada pela SEFAZ');
    }
  } catch (error: any) {
    console.error('Erro ao emitir NF-e:', error);
    adicionarNotificacao('erro', error.message || 'Erro desconhecido ao emitir NF-e');
  } finally {
    setLoading(false);
  }
};
