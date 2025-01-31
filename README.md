# Ponto Digital

## Descrição

O projeto Ponto Digital é um sistema de registro de ponto eletrônico para empresas. Ele permite que os funcionários registrem suas entradas e saídas utilizando métodos de autenticação como PIN e biometria. O sistema também oferece funcionalidades para visualizar registros diários e mensais, além de calcular estatísticas de horas trabalhadas.

## Funcionalidades

- Registro de ponto com autenticação por PIN ou biometria.
- Visualização de registros de ponto do dia atual.
- Visualização de registros de ponto do mês atual.
- Cálculo de estatísticas de horas trabalhadas, dias trabalhados e dias de atraso.

## Tecnologias Utilizadas

- Backend: Go, Gin, MongoDB
- Frontend: JavaScript, Axios

## Estrutura do Projeto

### Backend

O backend é responsável por gerenciar os registros de ponto e autenticação dos usuários. Ele utiliza o framework Gin para criar APIs RESTful e MongoDB como banco de dados.

### Frontend

O frontend é responsável por interagir com o usuário e enviar requisições para o backend. Ele utiliza Axios para fazer requisições HTTP e autenticar os usuários.

## Como Executar

### Pré-requisitos

- Go 1.16+
- MongoDB
- Node.js 14+

### Passos

1. Clone o repositório:
   ```sh
   git clone https://github.com/seu-usuario/ponto-digital.git
   cd ponto-digital
   ```

2. Configure as variáveis de ambiente no arquivo `.env`.

3. Inicie o backend:
   ```sh
   cd backend/ponto-digital-api
   go run main.go
   ```

4. Inicie o frontend:
   ```sh
   cd frontend
   npm install
   npm start
   ```

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

## Licença

Este projeto está licenciado sob a Licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
