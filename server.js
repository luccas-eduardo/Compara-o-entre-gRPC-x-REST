const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const fs = require('fs');
const csv = require('csv-parser');

// 1. Carrega o contrato .proto
const packageDefinition = protoLoader.loadSync('transaction.proto', { keepCase: true });
const transactionProto = grpc.loadPackageDefinition(packageDefinition).transaction;

// 2. Função de Streaming das Transações
//corrigida a função para enviar os dados em blocos, otimizando o uso de RAM e a velocidade de transmissão
function getTransactions(call) {
  const limit = call.request.limit || 10000000;
  let count = 0;
  let batch = [];
  const BATCH_SIZE = 2000; // Tamanho ideal de bloco para balancear RAM e velocidade

  console.log(`[Servidor]: Iniciando envio de 10 milhões de registros bancarios em Lotes`);

  const reader = fs.createReadStream('credit_card_transactions-ibm_v2.csv');
  const csvParser = reader.pipe(csv());

  csvParser.on('data', (row) => {
    count++;

    // Adiciona o item ao lote atual
    batch.push({
      id: `tx_${count}`,
      merchant: row.merchant || 'Desconhecido',
      amount: parseFloat(row.amount?.replace('$', '')) || 0,
      category: row.use_chip || 'N/A',
      date: row.time || ''
    });

    // Quando o lote enche, envia o bloco completo de uma vez
    if (batch.length >= BATCH_SIZE) {
      call.write({ transactions: batch });
      batch = []; // Limpa o lote para o próximo bloco
    }

    // Se bater o limite de 10 milhões
    if (count >= limit) {
      reader.destroy(); 
      csvParser.removeAllListeners('data');
      
      // Envia o que sobrou no último lote antes de fechar
      if (batch.length > 0) {
        call.write({ transactions: batch });
      }
      
      console.log(`[Servidor] Envio concluído. Total: ${count}`);
      call.end();
    }
  });

  csvParser.on('end', () => {
    if (count < limit) {
      if (batch.length > 0) call.write({ transactions: batch });
      call.end();
    }
  });
}

// 3. Inicializa o servidor gRPC na porta 50051
const server = new grpc.Server();
server.addService(transactionProto.TransactionService.service, { getTransactions });
server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
  console.log('Servidor implementando gRPC rodando com sucesso na porta 50051');
});