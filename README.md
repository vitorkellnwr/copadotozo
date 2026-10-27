# Futsal Manager Pro

Crie uma aplicação web completa de gerenciamento de torneios de futsal, com design moderno, responsivo e totalmente funcional. A aplicação deve permitir organizar ligas, times, jogadores, partidas, classificação, artilharia e mata-mata.



OBJETIVO DO SISTEMA

O sistema deve ser um gerenciador de campeonatos de futsal para uso em celulares e computadores, com interface profissional, intuitiva e agradável.



FUNCIONALIDADES OBRIGATÓRIAS



1. GERENCIAMENTO DE TORNEIOS



- Criar quantos torneios ou ligas o usuário desejar.

- Editar e excluir torneios.

- Cada torneio deve ter nome, descrição opcional e data de criação.

- Salvar os dados localmente no navegador usando localStorage.



2. CADASTRO DE TIMES



- Adicionar quantos times forem necessários em cada torneio.

- Cada time deve ter:

  - Nome do time

  - Cor ou escudo opcional

  - Limite de jogadores configurável: 5, 6 ou 7 jogadores.

- Permitir editar e excluir times.



3. FICHÁRIO DE JOGADORES



- Cadastrar jogadores individualmente dentro de cada time.

- Cada jogador deve ter:

  - Nome

  - Número da camisa

  - Posição opcional

- Impedir que o número de jogadores ultrapasse o limite definido para o time.

- Exibir a lista de jogadores cadastrados no fichário do time.



4. REGISTRO DE PARTIDAS



- Selecionar dois times da mesma liga para registrar uma partida.

- Inserir gols do time da casa e do time visitante.

- Atualizar automaticamente a tabela de classificação com pontuação padrão FIFA:

  - Vitória = 3 pontos

  - Empate = 1 ponto

  - Derrota = 0 pontos

- Atualizar estatísticas dos times:

  - Jogos

  - Vitórias

  - Empates

  - Derrotas

  - Gols pró

  - Gols contra

  - Saldo de gols

  - Pontos



5. ARTILHARIA



- Permitir registrar gols individualmente para cada jogador.

- Exibir ranking de artilheiros do torneio.

- Mostrar:

  - Nome do jogador

  - Time

  - Quantidade de gols



6. TABELA DE CLASSIFICAÇÃO



- Exibir tabela ordenada por:

  1. Pontos

  2. Saldo de gols

  3. Gols pró

- Mostrar colunas:

  - Posição

  - Time

  - Pontos

  - Jogos

  - Vitórias

  - Empates

  - Derrotas

  - Gols pró

  - Gols contra

  - Saldo de gols



7. MATA-MATA



- Permitir selecionar uma liga e escolher quantos times serão classificados para a fase eliminatória.

- Gerar automaticamente os confrontos:

  - Exemplo para 4 classificados:

    - 1º colocado x 4º colocado

    - 2º colocado x 3º colocado

- Exibir a chave de mata-mata de forma visual e organizada.



8. INTERFACE E EXPERIÊNCIA DO USUÁRIO



- Design moderno inspirado em aplicativos esportivos.

- Layout limpo, com cores vibrantes e boa legibilidade.

- Responsivo para celulares, tablets e desktops.

- Navegação por seções ou abas:

  - Torneios

  - Times

  - Jogadores

  - Partidas

  - Classificação

  - Artilharia

  - Mata-mata

- Botões e formulários intuitivos.



9. TECNOLOGIAS



- Utilizar HTML5, CSS3 e JavaScript puro.

- Não utilizar frameworks externos obrigatoriamente.

- Todo o projeto deve funcionar em um único arquivo HTML, contendo:

  - Estrutura HTML

  - Estilos CSS

  - Lógica JavaScript

- O código deve ser bem organizado, comentado e fácil de editar.



RESULTADO ESPERADO

O resultado deve ser uma aplicação web completa para organizar torneios de futsal, permitindo criar ligas, cadastrar times com limite de 5, 6 ou 7 jogadores, registrar partidas, atualizar classificação automaticamente, controlar artilharia e gerar mata-mata dos melhores classificados.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://copadotozo.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/683438a2-6dee-4c7a-ab45-3b1dcafe5b52).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
