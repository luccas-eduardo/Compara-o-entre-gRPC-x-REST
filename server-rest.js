const http = require('http');
const fs = require('fs');
const csv = require('csv-parser');

http.createServer((req, res) => {
  console.log('\n--------------------------------------------------');
  console.log('[REST] Requisição recebida! Iniciando leitura...');
  
  // Dispara o cronômetro do REST
  console.time('Tempo Gasto no REST');
  
  let data = [];

  fs.createReadStream('credit_card_transactions-ibm_v2.csv')
    .pipe(csv())
    .on('data', (row) => {
      if (data.length < 10000000) { // Limite de 10 milhões
        data.push({
          id: `tx_${data.length + 1}`,
          merchant: row.merchant || 'Desconhecido',
          amount: parseFloat(row.amount?.replace('$', '')) || 0,
          category: row.use_chip || 'N/A',
          date: row.time || ''
        });
      }
    })
    .on('end', () => {
      console.log('[REST] Fim da leitura. Convertendo array para String JSON gigantesca...');
      
      try {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        
        // Tentativa de envio de todo o bloco de texto
        res.end(JSON.stringify(data)); 
        console.log('[REST] Resposta enviada com sucesso para o navegador!');
      } catch (err) {
        console.log('[REST] Erro ao tentar enviar os dados:', err.message);
      } finally {
        // Encerra o cronômetro e mostra o tempo na tela
        console.timeEnd('Tempo Gasto no REST');
        console.log('--------------------------------------------------');
      }
    })

}).listen(3000, () => console.log('Servidor REST rodando na porta 3000.'));