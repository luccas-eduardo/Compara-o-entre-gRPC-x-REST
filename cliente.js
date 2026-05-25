const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

// 1. Carrega o contrato .proto
const packageDefinition = protoLoader.loadSync('transaction.proto', { keepCase: true });
const transactionProto = grpc.loadPackageDefinition(packageDefinition).transaction;

// 2. Conecta ao servidor usando o IP IPv4 direto para evitar conflitos de rede
const client = new transactionProto.TransactionService('127.0.0.1:50051', grpc.credentials.createInsecure());

console.log('[Cliente]: Solicitando 10 milhões de registros bancarios via gRPC Stream');
console.time('Tempo Gasto');

// 3. Dispara a requisição solicitando os 10 milhões
// O cliente agora processa os dados em blocos, exibindo o progresso a cada 1 milhão de registros para melhor controle visual
const stream = client.getTransactions({ limit: 10000000 });
let count = 0;
let lastMilestone = 0;

stream.on('data', (response) => {
  // Soma a quantidade de registros que vieram dentro desse bloco
  count += response.transactions.length;
  
  // Exibe o progresso a cada 1 milhão para controle visual fluido
  if (count - lastMilestone >= 1000000) {
    console.log(`[Cliente]: Recebidos: ${count} registros...`);
    lastMilestone = count;
  }
});

stream.on('end', () => {
  console.log('\n=== Transmissão Concluída -_- ===');
  console.log(`Total final de registros recebidos: ${count}`);
  console.timeEnd('Tempo Gasto');
});