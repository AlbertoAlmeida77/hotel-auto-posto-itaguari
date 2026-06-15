const CHAVE_QUARTOS = 'villareal_quartos';
const CHAVE_VERSAO  = 'villareal_versao';
const VERSAO_DADOS  = 'v4-api-hotel';

const QUARTOS_INICIAIS = [
  {
    id: 'q1',
    titulo: 'Suíte Tripla',
    tipo: 'Suíte',
    descricao: 'Espaçosa suíte com três camas confortáveis, ar-condicionado, Wi-Fi e café da manhã incluso. Ideal para grupos e famílias.',
    preco: 300,
    imagem: '../assets/imagens/quarto1.jpg',
    status: 'disponivel',
    capacidade: 3,
    numero: '101',
    comodidades: ['Wi-Fi', 'Café da manhã', 'Ar-condicionado', 'TV Smart'],
    data: new Date().toISOString(),
    destaque: true
  },
  {
    id: 'q2',
    titulo: 'Suíte Dupla',
    tipo: 'Casal',
    descricao: 'Confortável suíte para dois hóspedes com cama de casal, frigobar e banheiro privativo. Ótima opção para casais.',
    preco: 200,
    imagem: '../assets/imagens/quarto2.jpg',
    status: 'disponivel',
    capacidade: 2,
    numero: '201',
    comodidades: ['Wi-Fi', 'Frigobar', 'Ar-condicionado', 'TV Smart'],
    data: new Date().toISOString(),
    destaque: false
  },
  {
    id: 'q3',
    titulo: 'Quarto Simples',
    tipo: 'Solteiro',
    descricao: 'Quarto prático e aconchegante com cama de solteiro, Wi-Fi e o essencial para uma boa estadia.',
    preco: 100,
    imagem: '../assets/imagens/quarto3.jpg',
    status: 'disponivel',
    capacidade: 1,
    numero: '301',
    comodidades: ['Wi-Fi', 'Ar-condicionado'],
    data: new Date().toISOString(),
    destaque: false
  }
];

function buscarTodosQuartos() {
  if (localStorage.getItem(CHAVE_VERSAO) !== VERSAO_DADOS) {
    localStorage.setItem(CHAVE_QUARTOS, JSON.stringify(QUARTOS_INICIAIS));
    localStorage.setItem(CHAVE_VERSAO, VERSAO_DADOS);
    return QUARTOS_INICIAIS;
  }
  const salvo = localStorage.getItem(CHAVE_QUARTOS);
  if (!salvo) {
    localStorage.setItem(CHAVE_QUARTOS, JSON.stringify(QUARTOS_INICIAIS));
    return QUARTOS_INICIAIS;
  }
  return JSON.parse(salvo);
}

function buscarQuartoPorId(id) {
  return buscarTodosQuartos().find(function(q) { return q.id === id; }) || null;
}

async function salvarNovoQuarto(dadosFormulario) {
  const quartos = buscarTodosQuartos();
  const novoQuarto = {
    id:          'q' + Date.now(),
    titulo:      dadosFormulario.titulo,
    tipo:        dadosFormulario.tipo,
    descricao:   dadosFormulario.descricao,
    preco:       Number(dadosFormulario.preco),
    imagem:      dadosFormulario.imagem || '../assets/imagens/quarto1.jpg',
    status:      dadosFormulario.status || 'disponivel',
    capacidade:  Number(dadosFormulario.capacidade),
    numero:      dadosFormulario.numero || '---',
    comodidades: dadosFormulario.comodidades || [],
    data:        new Date().toISOString(),
    destaque:    false
  };
  quartos.unshift(novoQuarto);
  localStorage.setItem(CHAVE_QUARTOS, JSON.stringify(quartos));
  await salvarNaNuvem('quartos', novoQuarto);
  return novoQuarto;
}

async function salvarNaNuvem(colecao, dados) {
  if (!window.db) return null;
  try {
    const docRef = await window.db.collection(colecao).add({
      ...dados,
      criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });
    return docRef.id;
  } catch (erro) {
    console.warn('Nuvem indisponível:', erro.message);
    return null;
  }
}

async function sincronizarDaNuvem() {
  if (!window.db) return false;
  try {
    const snapshot = await window.db.collection('quartos').orderBy('data', 'desc').limit(50).get();
    if (snapshot.empty) return false;
    const quartosNuvem = snapshot.docs.map(function(doc) { return { ...doc.data(), idFirebase: doc.id }; });
    const quartosLocal = buscarTodosQuartos();
    const idsLocal = new Set(quartosLocal.map(function(q) { return q.id; }));
    const novos = quartosNuvem.filter(function(q) { return !idsLocal.has(q.id); });
    if (novos.length > 0) {
      localStorage.setItem(CHAVE_QUARTOS, JSON.stringify([...novos, ...quartosLocal]));
      return true;
    }
    return false;
  } catch (erro) {
    console.warn('Erro na sincronização:', erro.message);
    return false;
  }
}

function formatarPreco(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarData(dataISO) {
  return new Date(dataISO).toLocaleDateString('pt-BR');
}
