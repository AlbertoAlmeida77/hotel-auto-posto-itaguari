function alternarTema() {
  const body    = document.body;
  const btnTema = document.getElementById('btnTema');
  const modoEscuroAtivo = body.classList.toggle('dark-mode');
  localStorage.setItem('villareal_tema_escuro', modoEscuroAtivo);
  if (btnTema) {
    btnTema.textContent = modoEscuroAtivo ? '☀️' : '🌙';
    btnTema.setAttribute('aria-label', modoEscuroAtivo ? 'Ativar modo claro' : 'Ativar modo escuro');
  }
}

function aplicarTemaSalvo() {
  const temaSalvo = localStorage.getItem('villareal_tema_escuro');
  const btnTema   = document.getElementById('btnTema');
  if (temaSalvo === 'true') {
    document.body.classList.add('dark-mode');
    if (btnTema) btnTema.textContent = '☀️';
  } else {
    if (btnTema) btnTema.textContent = '🌙';
  }
}

const btnTema = document.getElementById('btnTema');
if (btnTema) btnTema.addEventListener('click', alternarTema);
aplicarTemaSalvo();

const btnMenu   = document.getElementById('btnMenu');
const navMobile = document.getElementById('navMobile');

if (btnMenu && navMobile) {
  btnMenu.addEventListener('click', function () {
    const aberto = navMobile.classList.toggle('aberto');
    btnMenu.setAttribute('aria-expanded', aberto);
  });
  navMobile.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      navMobile.classList.remove('aberto');
      btnMenu.setAttribute('aria-expanded', false);
    });
  });
}

const cabecalho = document.getElementById('cabecalho');

function atualizarCabecalho() {
  if (!cabecalho) return;
  if (window.scrollY > 50) {
    cabecalho.classList.add('scrollado');
  } else {
    cabecalho.classList.remove('scrollado');
  }
}

window.addEventListener('scroll', atualizarCabecalho, { passive: true });
atualizarCabecalho();

function animarElementos() {
  const elementos = document.querySelectorAll('.card-quarto, .comodidade-item, .admin-card, .card-feed');
  const observador = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (entrada, i) {
      if (entrada.isIntersecting) {
        setTimeout(function () {
          entrada.target.style.opacity   = '1';
          entrada.target.style.transform = 'translateY(0)';
        }, i * 80);
        observador.unobserve(entrada.target);
      }
    });
  }, { threshold: 0.1 });

  elementos.forEach(function (el) {
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(24px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observador.observe(el);
  });
}

function criarCardFeed(quarto) {
  const corStatus = {
    disponivel: 'badge-disponivel',
    ocupado:    'badge-ocupado',
    manutencao: 'badge-manutencao'
  };
  const textoStatus = {
    disponivel: 'Disponível',
    ocupado:    'Ocupado',
    manutencao: 'Manutenção'
  };
  const primeirasComodidades = (quarto.comodidades || []).slice(0, 3);
  return `
    <div class="card-quarto card-feed" onclick="irParaDetalhes('${quarto.id}')">
      <div class="card-quarto-img">
        <img src="${quarto.imagem}" alt="${quarto.titulo}" loading="lazy"
             onerror="this.src='../assets/imagens/quarto1.jpg'">
        <span class="card-quarto-tipo">${quarto.tipo}</span>
        <span class="badge ${corStatus[quarto.status] || 'badge-disponivel'} badge-no-card">
          ${textoStatus[quarto.status] || quarto.status}
        </span>
      </div>
      <div class="card-quarto-corpo">
        <h3 class="card-quarto-nome">${quarto.titulo}</h3>
        <p class="card-quarto-desc">${quarto.descricao}</p>
        <div class="card-quarto-info">
          <span class="info-item">👥 ${quarto.capacidade} hóspede${quarto.capacidade > 1 ? 's' : ''}</span>
          ${primeirasComodidades.map(function (c) { return `<span class="info-item">✓ ${c}</span>`; }).join('')}
        </div>
        <div class="card-quarto-rodape">
          <div class="card-quarto-preco">
            <strong>R$ ${Number(quarto.preco).toLocaleString('pt-BR')}</strong>
            <small>por noite</small>
          </div>
          <div style="display:flex;gap:0.5rem;">
            <span class="btn-secundario" style="padding:0.5rem 0.85rem;font-size:0.82rem;cursor:pointer;" onclick="event.stopPropagation();irParaDetalhes('${quarto.id}')">Detalhes</span>
            <a href="reserva.html?quarto=${quarto.id.replace('q','')}" class="btn-primario" style="padding:0.5rem 0.85rem;font-size:0.82rem;" onclick="event.stopPropagation()">Reservar</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

function irParaDetalhes(id) {
  window.location.href = 'detalhes.html?id=' + id;
}

async function carregarFeed() {
  const container = document.getElementById('feedQuartos');
  const statusEl  = document.getElementById('feedStatus');
  if (!container) return;
  if (statusEl) statusEl.textContent = 'Atualizando feed...';
  const houveNovidades = await sincronizarDaNuvem();
  const quartos = buscarTodosQuartos();
  if (statusEl) {
    const disponiveis = quartos.filter(function (q) { return q.status === 'disponivel'; }).length;
    statusEl.textContent = quartos.length + ' quartos — ' + disponiveis + ' disponíveis';
  }
  container.innerHTML = quartos.map(criarCardFeed).join('');
  animarElementos();
  if (houveNovidades) mostrarToast('☁️ Feed atualizado com novos dados da nuvem!', 'sucesso');
}

let ultimaAceleracao  = { x: 0, y: 0, z: 0 };
let ultimaChacoalhada = 0;
const LIMIAR_SHAKE    = 15;
const INTERVALO_SHAKE = 1500;

function processarMovimento(evento) {
  const ac = evento.accelerationIncludingGravity;
  if (!ac || ac.x === null) return;
  const agora  = Date.now();
  const deltaX = Math.abs(ac.x - ultimaAceleracao.x);
  const deltaY = Math.abs(ac.y - ultimaAceleracao.y);
  const deltaZ = Math.abs(ac.z - ultimaAceleracao.z);
  if (
    (deltaX > LIMIAR_SHAKE || deltaY > LIMIAR_SHAKE || deltaZ > LIMIAR_SHAKE) &&
    agora - ultimaChacoalhada > INTERVALO_SHAKE
  ) {
    ultimaChacoalhada = agora;
    aoDetectarChacoalhada();
  }
  ultimaAceleracao = { x: ac.x, y: ac.y, z: ac.z };
}

function aoDetectarChacoalhada() {
  const paginaAtual = window.location.pathname;
  if (paginaAtual.includes('cadastro.html')) {
    if (typeof limparFormulario === 'function') limparFormulario();
    mostrarToast('🔄 Campos limpos!', 'info');
  } else if (paginaAtual.includes('index.html') || paginaAtual.endsWith('/')) {
    carregarFeed();
    mostrarToast('🔄 Feed atualizado!', 'info');
  }
}

async function ativarSensorMovimento() {
  if (typeof DeviceMotionEvent === 'undefined') return;
  try {
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      const permissao = await DeviceMotionEvent.requestPermission();
      if (permissao !== 'granted') return;
    }
    window.addEventListener('devicemotion', processarMovimento, { passive: true });
  } catch (erro) {
    window.addEventListener('devicemotion', processarMovimento, { passive: true });
  }
}

const btnSensor = document.getElementById('btnSensor');
if (btnSensor) {
  btnSensor.addEventListener('click', async function () {
    await ativarSensorMovimento();
    btnSensor.textContent = '📳 Sensor ativo';
    btnSensor.disabled = true;
  });
}

if (typeof DeviceMotionEvent !== 'undefined' &&
    typeof DeviceMotionEvent.requestPermission !== 'function') {
  ativarSensorMovimento();
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker
      .register('../sw.js')
      .then(function (reg) { console.log('SW registrado:', reg.scope); })
      .catch(function (e) { console.warn('SW erro:', e); });
  });
}

function mostrarToast(mensagem, tipo) {
  tipo = tipo || 'sucesso';
  document.querySelectorAll('.toast').forEach(function (t) { t.remove(); });
  const toast = document.createElement('div');
  toast.className   = 'toast toast-' + tipo;
  toast.textContent = mensagem;
  document.body.appendChild(toast);
  setTimeout(function () { toast.classList.add('visivel'); }, 10);
  setTimeout(function () {
    toast.classList.remove('visivel');
    setTimeout(function () { toast.remove(); }, 400);
  }, 3000);
}

document.addEventListener('DOMContentLoaded', function () {
  animarElementos();
  if (document.getElementById('feedQuartos')) carregarFeed();
});
