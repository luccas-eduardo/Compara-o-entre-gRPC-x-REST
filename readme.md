O projeto avalia a eficácia do gRPC utilizando *Server-side Streaming* em comparação direta ao modelo arquitetural tradicional REST, focando no processamento massivo de grandes volumes de dados. A aplicação foi estruturada para ler e transmitir de maneira contínua até 10 milhões de registros financeiros a partir de um arquivo de transações bancárias.

Ao lidar com arquivos que chegam a 2,18 GB, a arquitetura REST convencional demonstra limitações críticas devido ao esgotamento de memória (gargalo de RAM). Isso ocorre porque ela tenta agrupar todos os 10 milhões de dados em um array único em memória para, em seguida, convertê-los em uma única string JSON massiva antes do envio. O gRPC mitiga essa limitação ao consumir o arquivo via streams reativos. No entanto, para evitar o gargalo no processador e no tráfego de rede gerado pelo envio individualizado (registro a registro), o sistema implementa uma estratégia de agrupamento em lotes (*batching*). O servidor consolida blocos de 2.000 transações por vez antes de realizar a serialização binária altamente compacta através do *Protocol Buffers* e despachar os dados via HTTP/2. Em testes comparativos, essa otimização reduziu o tempo total de processamento de 3 minutos e 34 segundos para apenas 33 segundos na mesma infraestrutura.

A topologia do projeto é composta pelo arquivo `transaction.proto`, que atua como o contrato de interface definindo as mensagens binárias e a assinatura do procedimento de chamada remota, pelo `server.js`, que processa o arquivo CSV de forma assíncrona na porta padrão 50051, e pelo `cliente.js`, encarregado de ler o stream de pacotes repetidos e exibir o progresso acumulado a cada 1 milhão de linhas. O arquivo `server-rest.js` serve como base comparativa de estresse. Devido às especificidades da biblioteca de parsing de dados do Node.js, os cabeçalhos literais do CSV original são preservados de maneira estrita, tratando as letras maiúsculas e capturando campos com espaçamento (como as propriedades de identificação do estabelecimento) por meio de notação de colchetes no código. Além disso, os valores monetários que trazem o símbolo de cifrão em texto plano sofrem uma higienização via substituição de string antes de serem convertidos e transmitidos como ponto flutuante de dupla precisão.


COMO EXECUTAR!!!
1. Preparação
Instale as dependências:
npm install @grpc/grpc-js @grpc/proto-loader csv-parser

!Baixe o Dataset no Kaggle e cole o arquivo CSV na mesma pasta dos scripts.!

3. Execução (Dois Terminais)
Terminal 1 (Servidor):
node server.js

Terminal 2 (Cliente):
node cliente.js

Para executar o experimento em ambiente Linux isolado utilizando o Google Colab, o fluxo de comandos deve seguir uma ordem sequencial rígida para garantir a consistência das portas de rede. Inicialmente, instala-se os pacotes necessários rodando o comando `!npm install @grpc/grpc-js @grpc/proto-loader csv-parser`. Caso o arquivo completo esteja no armazenamento de nuvem, utiliza-se a instrução nativa do terminal `!head -n 50000 "/content/drive/MyDrive/credit_card_transactions-ibm_v2.csv" > dataset_reduzido.csv` para gerar uma amostra de teste rápida. Por fim, executa-se o ambiente de forma unificada para que o cliente não sofra recusa de conexão antes da inicialização completa da porta lógica, inserindo em uma única célula as instruções combinadas `!node server.js &`, seguido de `!sleep 3` para estabilização do processo em segundo plano, e concluindo com o disparo `!node cliente.js`.
DATASET para download: https://www.kaggle.com/datasets/ealtman2019/credit-card-transactions
