
//variaveis globais
const DIMENSAO = 12;
let letterPosition = [];
let cores = ['#91DEE7'];
let indiceCorAtual = 0;
let selecionando = false;
let touchStarted = false;
let ultimaCelula = null;
let score = 0;
let inicioDoJogo;
let contadorDePalavrasEncontradas = 0;
const totalDePalavrasPorFase = [5, 6, 7];
const fases = ["palavras", "IPTU", "ISS", "ITBI"];
let indiceFaseAtual = 0;

//Funções de Inicialização e Carregamento
async function carregarPalavras(fase) {
  try {
    const response = await fetch('palavras.json');
    if (!response.ok) {
      throw new Error('Falha ao carregar o arquivo palavras.json');
    }
    const data = await response.json();
    if (!data || !data[fase] || !Array.isArray(data[fase])) {
      throw new Error(`Formato inválido ou fase '${fase}' não encontrada no arquivo palavras.json`);
    }
    return data[fase].map(palavra => palavra.toUpperCase());
  } catch (error) {
    console.error(`Erro ao carregar o arquivo palavras.json para a fase '${fase}':`, error);
    return [];
  }
}

async function iniciarJogo() {
  try {
    const faseAtual = fases[indiceFaseAtual];
    const palavras = await carregarPalavras(faseAtual);
    if (palavras.length === 0) {
      console.error('Nenhuma palavra carregada.');
      return;
    }
    iniciarCronometro();

    atualizarViewFaseEListaPalavras(faseAtual, palavras);

    const grade = criarGradeVazia();
    posicionarPalavras(grade, palavras);
    preencherEspacosVazios(grade);
    desenharGrade(grade);

    const tableCells = document.querySelectorAll('table tbody tr td');
    let palavrasEncontradas = new Set();

    tableCells.forEach(cell => {
      cell.addEventListener('click', () => {
        const id = cell.id;
        if (onlyLetterOfTargetWords(id, letterPosition)) {
          const stringValue = addOrRemoveValue(id, cell);
          const foundMatch = checkWordInWordSearch(stringValue, letterPosition);

          if (foundMatch[0]) {
            const elementFound = document.getElementById(foundMatch[1]);
            elementFound.innerHTML = `<strike>${elementFound.innerText}</strike>`;
            letterPosition[foundMatch[1]] = '';
            palavrasEncontradas.add(foundMatch[1]);

            if (palavrasEncontradas.size === palavras.length) {
              console.log("Fase concluída!");
              indiceFaseAtual += 1;
              if (indiceFaseAtual < fases.length) {
                iniciarJogo();
              } else {
                console.log("Parabéns! Você completou todas as fases!");
              }
            }
          }
        }
      });
    });
  } catch (error) {
    console.error('Erro ao iniciar o jogo:', error);
  }
}

async function carregarNovaListaDePalavrasParaFaseAtual() {
  const faseAtual = fases[indiceFaseAtual];
  const palavras = await carregarPalavras(faseAtual);
  if (palavras.length === 0) {
    console.error('Nenhuma palavra carregada para a nova fase.');
    return;
  }
  atualizarViewFaseEListaPalavras(faseAtual, palavras);

  const grade = criarGradeVazia();
  posicionarPalavras(grade, palavras);
  preencherEspacosVazios(grade);
  desenharGrade(grade);
}

function iniciarCronometro() {
  inicioDoJogo = new Date();
}


//Funções de Manipulação da Grade

function criarGradeVazia() {
  return Array.from({ length: DIMENSAO }, () => Array(DIMENSAO).fill('-'));
}

function cabeNaGrade(grade, palavra, linha, coluna, deltaLinha, deltaColuna) {
  for (let i = 0; i < palavra.length; i++) {
    const novaLinha = linha + i * deltaLinha;
    const novaColuna = coluna + i * deltaColuna;
    if (novaLinha < 0 || novaLinha >= DIMENSAO || novaColuna < 0 || novaColuna >= DIMENSAO || grade[novaLinha][novaColuna] !== '-') {
      return false;
    }
  }
  return true;
}

function inserirPalavra(grade, palavra, linha, coluna, deltaLinha, deltaColuna) {
  for (let i = 0; i < palavra.length; i++) {
    grade[linha + i * deltaLinha][coluna + i * deltaColuna] = palavra[i];
    letterPosition.push(`r${linha + i * deltaLinha + 1}c${coluna + i * deltaColuna + 1}`);
  }
}

function posicionarPalavras(grade, palavras) {
  const direcoes = [
    { deltaLinha: 0, deltaColuna: 1 }, 
    { deltaLinha: 1, deltaColuna: 0 }, 
    { deltaLinha: 1, deltaColuna: 1 }, 
  ];

  palavras.forEach(palavra => {
    let posicionado = false;
    while (!posicionado) {
      const direcao = direcoes[Math.floor(Math.random() * direcoes.length)];
      const linha = Math.floor(Math.random() * DIMENSAO);
      const coluna = Math.floor(Math.random() * DIMENSAO);

      if (cabeNaGrade(grade, palavra, linha, coluna, direcao.deltaLinha, direcao.deltaColuna)) {
        inserirPalavra(grade, palavra, linha, coluna, direcao.deltaLinha, direcao.deltaColuna);
        posicionado = true;
      }
    }
  });
}

function preencherEspacosVazios(grade) {
  for (let i = 0; i < DIMENSAO; i++) {
    for (let j = 0; j < DIMENSAO; j++) {
      if (grade[i][j] === '-') {
        grade[i][j] = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // Letras A-Z
      }
    }
  }
}

function desenharGrade(grade) {
  const container = document.getElementById('grade');
  container.innerHTML = ''; 
  const tabela = document.createElement('table');
  grade.forEach((linha, rowIndex) => {
    const tr = document.createElement('tr');
    linha.forEach((celula, colIndex) => {
      const td = document.createElement('td');
      td.textContent = celula;
      td.classList.add('celula');
      td.id = `r${rowIndex}c${colIndex}`;

      td.addEventListener('mousedown', iniciarSelecao);
      td.addEventListener('touchstart', iniciarSelecao);

      td.addEventListener('mouseenter', continuarSelecao);
      td.addEventListener('touchmove', continuarSelecao);

      tr.appendChild(td);
    });
    tabela.appendChild(tr);
  });
  container.appendChild(tabela);

  document.addEventListener('mouseup', finalizarSelecao);
  document.addEventListener('touchend', finalizarSelecao);
}

//Funções de Manipulação de Seleção

function iniciarSelecao(event) {
  event.preventDefault(); 
  selecionando = true;
  toggleSelecao(this); 
}

function toggleSelecao(celula) {
  if (celula.classList.contains('celula-selecionada')) {
    celula.classList.remove('celula-selecionada'); 
    celula.style.backgroundColor = ''; 
  } else {
    celula.classList.add('celula-selecionada');
    // Convertendo a cor hexadecimal para RGBA com opacidade de 0.5 para meio transparente
    celula.style.backgroundColor = 'rgba(145, 222, 231, 0.5)'; // 50% de opacidade
    indiceCorAtual = (indiceCorAtual + 1) % cores.length; 
  }
}

function continuarSelecao(event) {
  if (!selecionando) return;
  event.preventDefault();

  let element = null;
  let x, y;

  if (event.touches) {
    const touch = event.touches[0];
    x = touch.clientX;
    y = touch.clientY;
    element = document.elementFromPoint(x, y);
  } else {
    x = event.clientX;
    y = event.clientY;
    element = event.target;
  }

  if (element && element !== ultimaCelula && element.classList.contains('celula')) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));

    const maxDistance = 12; 

    if (distance <= maxDistance) {
      requestAnimationFrame(() => {
        toggleSelecao(element);
      });
      ultimaCelula = element;
    }
  }
}

function handleSelecaoInicial(event) {
  event.preventDefault(); 
  selecionando = true; 
  let element = event.target;

  if (event.type === 'touchstart') {
    touchStarted = true; 
    setTimeout(() => {
      touchStarted = false; 
    }, 200);
  }
  toggleSelecao(element); 
}

function handleSelecaoContinua(event) {
  if (!selecionando) return;
  let element = null;
  let x, y;

  if (event.touches) {
    const touch = event.touches[0];
    x = touch.clientX;
    y = touch.clientY;
    element = document.elementFromPoint(x, y);
  } else {
    x = event.clientX;
    y = event.clientY;
    element = event.target;
  }

  if (element && element !== ultimaCelula && element.classList.contains('celula')) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));

    const maxDistance = 12; 

    if (distance <= maxDistance) {
      requestAnimationFrame(() => {
        toggleSelecao(element);
      });
      ultimaCelula = element;
    }
  }
}

function finalizarSelecao() {
  selecionando = false;
}


//Funções de Atualização da Interface do Usuário

function atualizarViewFaseEListaPalavras(faseAtual, palavras) {
  const faseContainer = document.getElementById('fase-atual');
  const listaPalavrasContainer = document.getElementById('lista-palavras');

  if (faseContainer) {
    faseContainer.innerHTML = `<p>Fase Atual: ${faseAtual}</p>`;
  }

  if (listaPalavrasContainer) {
    listaPalavrasContainer.innerHTML = '';
    palavras.forEach(palavra => {
      const item = document.createElement('p');
      item.id = palavra;
      item.textContent = palavra;
      listaPalavrasContainer.appendChild(item);
    });
  }
}

function atualizarListaPalavras(palavras) {
  const listaPalavrasContainer = document.getElementById('lista-palavras');
  if (listaPalavrasContainer) {
    listaPalavrasContainer.innerHTML = '';
    palavras.forEach(palavra => {
      const item = document.createElement('p');
      item.id = palavra;
      item.textContent = palavra;
      listaPalavrasContainer.appendChild(item);
    });
  }
}

function atualizarPontuacao(pontos) {
  const pontuacaoContainer = document.getElementById('pontuacao');
  if (pontuacaoContainer) {
    pontuacaoContainer.textContent = `Pontuação: ${pontos}`;
  }
}


//Funções de Lógica do Jogo
function palavraEncontrada() {
  contadorDePalavrasEncontradas += 1;
  if (contadorDePalavrasEncontradas === totalDePalavrasPorFase[indiceFaseAtual]) {
    avancarParaProximaFase();
  }
}

function avancarParaProximaFase() {
  indiceFaseAtual += 1;
  if (indiceFaseAtual < fases.length) {
    carregarNovaListaDePalavrasParaFaseAtual();
  } else {
    alert("Parabéns! Você completou todas as fases!");
  }
}

function calcularPontuacao(tempoDecorrido) {
  const pontos = Math.max(1000 - tempoDecorrido, 0);
  atualizarPontuacao(pontos);
  return pontos;
}

//Funções Auxiliares

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function onlyLetterOfTargetWords(id, letterPosition) {
  return letterPosition.includes(id);
}

function checkWordInWordSearch(stringValue, letterPosition) {
  let foundMatch = false;
  let matchedWord = '';

  for (let i = 0; i < letterPosition.length; i++) {
    if (letterPosition[i] === stringValue) {
      foundMatch = true;
      matchedWord = letterPosition[i];
      break;
    }
  }

  return [foundMatch, matchedWord];
}

//Event Listeners e Inicialização
document.querySelectorAll('.celula').forEach(celula => {
  celula.addEventListener('mousedown', handleSelecaoInicial);
  celula.addEventListener('touchstart', handleSelecaoInicial);
});

document.addEventListener('DOMContentLoaded', iniciarJogo);

