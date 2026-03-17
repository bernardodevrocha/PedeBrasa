# Gateway de Pagamento

## 1. Visão Geral

O objetivo deste backend é processar transações financeiras de forma segura, garantindo a integridade dos dados e minimizando a exposição a fraudes de manipulação de parâmetros (Parameter Tampering).

## 2. Requisitos Funcionais(RF)

| ID    | Requisito                      | Descrição                                                                                                                     |
| :---- | :----------------------------- | :---------------------------------------------------------------------------------------------------------------------------- |
| RF-01 | Criação de intent de pagamento | O sistema deve gerar um "Intento de Pagamento" no Gateway baseado no product_id consultado internamente.                      |
| RF-02 | Cálculo de Preço no Servidor   | O backend deve ignorar qualquer valor monetário vindo do cliente e buscar o preço oficial no Banco de Dados                   |
| RF-03 | Processamento via Token        | O sistema deve aceitar apenas tokens de pagamento (representações seguras do cartão) gerados pelo SDK do Gateway no frontend. |
| RF-04 | Confirmação via Webhook        | O sistema deve atualizar o status do pedido apenas após receber e validar uma notificação assíncrona (Webhook) do Gateway.    |

## 3. Requisitos Não Funcionais (RNF) - Foco em Segurança

### RNF-01: Integridade e Autenticidade (O "Lacre")

- **Assinatura de Webhooks:** O backend deve validar a assinatura HMAC de todas as requisições recebidas do Gateway para garantir que a origem é legítima.
- **Validação de Schema:** Toda requisição de entrada deve ser validada contra um schema para evitar Payload Injection.

### RNF-02: Idempotência

- **Chave de Idempotência:** O sistema deve exigir uma Idempotency-Key para cada transação. Se o cliente enviar o mesmo ID de pedido duas vezes, o backend não deve processar uma nova cobrança, mas sim retornar o status da anterior.

### RNF-03: Proteção de Segredos

- **Variáveis de Ambiente:** Chaves privadas (API Keys) nunca devem estar no código-fonte. Devem ser injetadas via ambiente seguro (ex: Secret Manager).

### RNF-04: Conformidade PCI DSS (Escopo Reduzido)

- **Zero-Storage Policy:** O backend não deve, sob nenhuma circunstância, logar ou armazenar números brutos de cartão (PAN) ou códigos de segurança (CVV).

4. Fluxo de Dados Seguro (Data Flow)
   O diagrama abaixo ilustra como evitamos o ataque que você viu no vídeo (o hacker mudando o preço no fetch):

1. **Request:** O cliente envia { "product_id": "ABC", "qty": 1 }.

1. **Lookup:** O sistema faz Price = DB.query("SELECT price FROM products WHERE id='ABC'").

1. **Communication:** O sistema envia para o Gateway: { "amount": Price \* qty, "token": ... }.

1. Dicionário de Termos (Novas Palavras para seu Registro)

- **Idempotency Key (Chave de Idempotência):** Um identificador único enviado na requisição que permite que você repita a chamada sem causar efeitos colaterais duplicados.

- **Webhook Signing (Assinatura de Webhook):** Técnica de segurança onde o Gateway "assina" a mensagem com uma chave secreta para provar que a notificação é real.

- **Secret Manager:** Ferramenta para armazenar chaves de API e senhas de banco de dados de forma criptografada (ex: AWS Secrets Manager, HashiCorp Vault).

- **Reconciliation (Conciliação):** O processo de conferir se os pedidos no seu banco de dados batem exatamente com as transações aprovadas no Gateway.
