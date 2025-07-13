// ==========================================
// CÓDIGO PARA GOOGLE APPS SCRIPT (Code.gs)
// ==========================================

// Define o nome da planilha onde os dados do formulário são salvos.
// IMPORTANTE: Altere este nome para corresponder exatamente ao nome da sua aba
const SHEET_NAME = 'Respostas ao formulário 1';

/**
 * Função principal que é executada quando o script recebe uma requisição GET.
 * Esta será nossa API REST para o painel React.
 */
function doGet(e) {
  try {
    // Abre a planilha ativa e seleciona a aba correta
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      throw new Error(`A planilha "${SHEET_NAME}" não foi encontrada. Verifique o nome da aba.`);
    }

    // Pega todos os dados da planilha
    const data = sheet.getDataRange().getValues();
    
    // Verifica se há dados na planilha
    if (data.length === 0) {
      return ContentService
        .createTextOutput(JSON.stringify({ 
          error: 'Nenhum dado encontrado na planilha',
          ultimaVerificacao: {},
          historicoVerificacoes: []
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Remove o cabeçalho (primeira linha) para processar apenas as respostas
    const headers = data.shift();

    // Mapeia os dados brutos para um formato JSON estruturado
    const checklistData = data.map(row => {
      let entry = {};
      headers.forEach((header, index) => {
        // Converte o nome da coluna em uma chave de objeto
        // Ex: "Nome do Operador" -> "nome_do_operador"
        const key = header.toLowerCase()
          .replace(/[áàâãä]/g, 'a')
          .replace(/[éèêë]/g, 'e')
          .replace(/[íìîï]/g, 'i')
          .replace(/[óòôõö]/g, 'o')
          .replace(/[úùûü]/g, 'u')
          .replace(/[ç]/g, 'c')
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '');
        
        entry[key] = row[index];
      });
      return entry;
    }).reverse(); // Inverte para que a resposta mais recente venha primeiro

    // Estrutura o JSON final que será enviado para o painel
    const responseData = {
      ultimaVerificacao: formatLastCheck(checklistData[0]),
      historicoVerificacoes: formatHistory(checklistData.slice(0, 10)),
      totalVerificacoes: checklistData.length,
      ultimaAtualizacao: new Date().toISOString()
    };

    // Cria a resposta da API em formato JSON
    return ContentService
      .createTextOutput(JSON.stringify(responseData))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Em caso de erro, retorna uma mensagem clara
    console.error('Erro na API:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Formata os dados da última verificação para o dashboard
 */
function formatLastCheck(latestEntry) {
  if (!latestEntry) {
    return {
      data: new Date().toLocaleDateString('pt-BR'),
      hora: new Date().toLocaleTimeString('pt-BR'),
      operador: 'N/A',
      status: 'pendente'
    };
  }

  // Tenta encontrar o campo de timestamp (pode ter nomes diferentes)
  const timestampField = latestEntry.carimbo_de_data_e_hora || 
                         latestEntry.timestamp || 
                         latestEntry.data_hora ||
                         new Date();

  // Tenta encontrar o campo do operador
  const operadorField = latestEntry.operador || 
                       latestEntry.nome_do_operador ||
                       latestEntry.nome_operador ||
                       'N/A';

  // Tenta encontrar o status geral
  const statusField = latestEntry.status_geral_da_empilhadeira ||
                     latestEntry.status_geral ||
                     latestEntry.status ||
                     'pendente';

  return {
    data: new Date(timestampField).toLocaleDateString('pt-BR'),
    hora: new Date(timestampField).toLocaleTimeString('pt-BR'),
    operador: operadorField,
    status: statusField,
    conformidade: calculateCompliance(latestEntry),
    problemas: countProblems(latestEntry)
  };
}

/**
 * Formata o histórico de verificações
 */
function formatHistory(entries) {
  if (!entries || entries.length === 0) return [];
  
  return entries.map(entry => {
    const timestampField = entry.carimbo_de_data_e_hora || 
                          entry.timestamp || 
                          entry.data_hora ||
                          new Date();

    const operadorField = entry.operador || 
                         entry.nome_do_operador ||
                         entry.nome_operador ||
                         'N/A';

    const statusField = entry.status_geral_da_empilhadeira ||
                       entry.status_geral ||
                       entry.status ||
                       'pendente';

    return {
      data: new Date(timestampField).toLocaleDateString('pt-BR'),
      hora: new Date(timestampField).toLocaleTimeString('pt-BR'),
      operador: operadorField,
      status: statusField,
      conformidade: calculateCompliance(entry),
      problemas: countProblems(entry)
    };
  });
}

/**
 * Calcula a porcentagem de conformidade baseada nas respostas
 * ADAPTE ESTA FUNÇÃO para suas colunas específicas
 */
function calculateCompliance(entry) {
  if (!entry) return 0;
  
  // Lista de campos que representam verificações (adapte conforme sua planilha)
  const checkFields = [
    'sistema_eletrico',
    'sistema_hidraulico', 
    'freios',
    'luzes',
    'garfos',
    'bateria',
    'pneus',
    'estrutura'
  ];
  
  let totalChecks = 0;
  let conformeChecks = 0;
  
  // Conta quantos campos existem e quantos estão "conforme"
  Object.keys(entry).forEach(key => {
    if (checkFields.some(field => key.includes(field))) {
      totalChecks++;
      const value = String(entry[key]).toLowerCase();
      if (value.includes('conforme') || value.includes('ok') || value.includes('sim')) {
        conformeChecks++;
      }
    }
  });
  
  // Se não encontrou campos específicos, usa uma lógica genérica
  if (totalChecks === 0) {
    // Conta todas as respostas que parecem positivas
    Object.values(entry).forEach(value => {
      if (value && typeof value === 'string') {
        totalChecks++;
        const val = value.toLowerCase();
        if (val.includes('conforme') || val.includes('ok') || val.includes('sim') || val.includes('bom')) {
          conformeChecks++;
        }
      }
    });
  }
  
  return totalChecks > 0 ? Math.round((conformeChecks / totalChecks) * 100) : 85;
}

/**
 * Conta o número de problemas detectados
 * ADAPTE ESTA FUNÇÃO para suas colunas específicas
 */
function countProblems(entry) {
  if (!entry) return 0;
  
  let problems = 0;
  
  // Procura por respostas que indicam problemas
  Object.values(entry).forEach(value => {
    if (value && typeof value === 'string') {
      const val = value.toLowerCase();
      if (val.includes('não conforme') || 
          val.includes('problema') || 
          val.includes('defeito') ||
          val.includes('não') ||
          val.includes('ruim')) {
        problems++;
      }
    }
  });
  
  return problems;
}

/**
 * Função de teste para verificar se o script está funcionando
 * Execute esta função no editor do Apps Script para testar
 */
function testarScript() {
  try {
    const resultado = doGet();
    const dados = JSON.parse(resultado.getContent());
    console.log('Teste bem-sucedido!');
    console.log('Dados retornados:', dados);
    return dados;
  } catch (error) {
    console.error('Erro no teste:', error);
    return { erro: error.message };
  }
}

// ==========================================
// INSTRUÇÕES DE IMPLANTAÇÃO:
// ==========================================
// 
// 1. Cole este código no editor do Google Apps Script
// 2. Salve o projeto (Ctrl+S)
// 3. Execute a função 'testarScript' para verificar se está funcionando
// 4. Clique em "Implantar" > "Nova implantação"
// 5. Selecione "App da Web" como tipo
// 6. Configure:
//    - Executar como: Eu
//    - Quem pode acessar: Qualquer pessoa
// 7. Clique em "Implantar"
// 8. Copie a URL gerada e use no seu dashboard React
//
// ==========================================

