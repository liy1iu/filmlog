const STORAGE_KEY = 'filmLogUsuarios';
const GENEROS = ['drama', 'ficção científica', 'suspense', 'animação', 'ação', 'romance', 'terror'];

// bolinhas no canvas de fundo
const canvas = document.getElementById('bg');
const ctx = canvas.getContext('2d');
let dots = [];
const pointer = { x: -9999, y: -9999, active: false };
const modalOverlay = document.getElementById('modalOverlay');
const formEdicao = document.getElementById('formEdicao');
const feedbackEdicao = document.getElementById('feedbackEdicao');
const confirmarOverlay = document.getElementById('confirmarOverlay');
let indicePendenteExclusao = null;

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * ratio;
  canvas.height = window.innerHeight * ratio;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function initDots() {
  resizeCanvas();
  dots = [];
  const area = window.innerWidth * window.innerHeight;
  const total = Math.max(45, Math.round(area / 19000));

  for (let i = 0; i < total; i += 1) {
    dots.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      baseX: 0,
      baseY: 0,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      r: Math.random() * 1.8 + 0.8,
      o: Math.random() * 0.28 + 0.12
    });
  }
}

function drawDots() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  dots.forEach(dot => {
    dot.x += dot.vx;
    dot.y += dot.vy;

    if (dot.x < -10) dot.x = window.innerWidth + 10;
    if (dot.x > window.innerWidth + 10) dot.x = -10;
    if (dot.y < -10) dot.y = window.innerHeight + 10;
    if (dot.y > window.innerHeight + 10) dot.y = -10;

    let drawX = dot.x;
    let drawY = dot.y;

    if (pointer.active) {
      const dx = drawX - pointer.x;
      const dy = drawY - pointer.y;
      const distance = Math.hypot(dx, dy);

      if (distance < 130) {
        const force = (130 - distance) / 130;
        drawX += (dx / (distance || 1)) * force * 18;
        drawY += (dy / (distance || 1)) * force * 18;
      }
    }

    ctx.beginPath();
    ctx.arc(drawX, drawY, dot.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(90, 173, 168, ${dot.o})`;
    ctx.fill();
  });

  requestAnimationFrame(drawDots);
}

initDots();
drawDots();
window.addEventListener('resize', initDots);
window.addEventListener('mousemove', event => {
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  pointer.active = true;
});
window.addEventListener('mouseleave', () => {
  pointer.active = false;
});

// navegação entre telas
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const alvo = link.dataset.tela;
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelectorAll('.tela').forEach(t => t.classList.remove('ativa'));
    link.classList.add('active');
    document.getElementById(alvo).classList.add('ativa');
    if (alvo === 'lista') renderTabela();
  });
});

// máscara CPF
document.getElementById('cpf').addEventListener('input', e => {
  let v = e.target.value.replace(/\D/g, '');
  v = v.replace(/(\d{3})(\d)/, '$1.$2')
       .replace(/(\d{3})(\d)/, '$1.$2')
       .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  e.target.value = v;
});

// validação em tempo real, cada campo tem sua regra
function liveVal(id, erroId, fn) {
  const el = document.getElementById(id);
  const er = document.getElementById(erroId);
  const eventName = el.tagName === 'SELECT' ? 'change' : 'input';
  el.addEventListener(eventName, () => {
    const msg = fn(el.value);
    er.textContent = msg;
    el.classList.toggle('invalido', !!msg);
    el.classList.toggle('valido', !msg && el.value.trim() !== '');
  });
}

liveVal('nome',  'erroNome',  v => v.trim().length < 3 ? 'mínimo 3 caracteres' : '');
liveVal('email', 'erroEmail', v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'e-mail inválido');
liveVal('cpf',   'erroCpf',   v => /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(v) ? '' : 'formato: 000.000.000-00');
liveVal('idade', 'erroIdade', v => v >= 1 && v <= 120 ? '' : 'idade entre 1 e 120');
liveVal('filme', 'erroFilme', v => v.trim().length < 2 ? 'informe um filme' : '');
liveVal('genero', 'erroGenero', v => v ? '' : 'selecione um gênero');

// submit do formulário
document.getElementById('formCadastro').addEventListener('submit', e => {
  e.preventDefault();
  const nome  = document.getElementById('nome').value.trim();
  const email = document.getElementById('email').value.trim();
  const cpf   = document.getElementById('cpf').value.trim();
  const idade = Number(document.getElementById('idade').value);
  const filme = document.getElementById('filme').value.trim();
  const genero = document.getElementById('genero').value;
  const fb    = document.getElementById('feedbackCadastro');

  // checa tudo antes de salvar
  const invalido =
    nome.length < 3 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf) ||
    !(idade >= 1 && idade <= 120) ||
    filme.length < 2 ||
    !genero;

  if (invalido) {
    fb.textContent = 'preencha todos os campos corretamente antes de salvar o perfil';
    fb.className = 'feedback erro-feedback';
    return;
  }

  const lista = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  lista.push({ nome, email, cpf, idade, filme, genero });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));

  fb.textContent = 'perfil cinéfilo salvo com sucesso!';
  fb.className = 'feedback sucesso';
  e.target.reset();
  document.querySelectorAll('input,select').forEach(el =>
    el.classList.remove('valido', 'invalido')
  );
});

// renderiza tabela com o que tá no localStorage
function renderTabela() {
  const lista  = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const corpo  = document.getElementById('corpoTabela');
  const aviso  = document.getElementById('semUsuarios');
  corpo.innerHTML = '';
  aviso.style.display = lista.length ? 'none' : 'block';

  lista.forEach((usuario, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td data-label="nome">${usuario.nome}</td>
      <td data-label="e-mail">${usuario.email}</td>
      <td data-label="cpf">${usuario.cpf}</td>
      <td data-label="idade">${usuario.idade}</td>
      <td data-label="filme">${usuario.filme}</td>
      <td data-label="gênero">${usuario.genero}</td>
      <td data-label="ações">
        <div class="acoes-linha">
          <button class="btn-editar" type="button" onclick="editarUsuario(${i})">editar</button>
          <button class="btn-excluir" type="button" onclick="excluirUsuario(${i})">excluir</button>
        </div>
      </td>`;
    corpo.appendChild(tr);
  });
}

function excluirUsuario(i) {
  const lista = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const usuario = lista[i];
  indicePendenteExclusao = i;
  document.getElementById('textoConfirmacao').textContent = `você quer mesmo excluir o perfil de ${usuario.nome}?`;
  confirmarOverlay.hidden = false;
  document.body.style.overflow = 'hidden';
}

function editarUsuario(i) {
  const lista = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const usuario = lista[i];
  document.getElementById('editIndice').value = i;
  document.getElementById('editNome').value = usuario.nome;
  document.getElementById('editEmail').value = usuario.email;
  document.getElementById('editIdade').value = usuario.idade;
  document.getElementById('editFilme').value = usuario.filme;
  document.getElementById('editGenero').value = GENEROS.includes(usuario.genero) ? usuario.genero : '';
  feedbackEdicao.textContent = '';
  feedbackEdicao.className = 'feedback';
  modalOverlay.hidden = false;
  document.body.style.overflow = 'hidden';
  document.getElementById('editNome').focus();
}

function fecharModal() {
  modalOverlay.hidden = true;
  formEdicao.reset();
  feedbackEdicao.textContent = '';
  feedbackEdicao.className = 'feedback';
  atualizarScrollBody();
}

function fecharConfirmacao() {
  confirmarOverlay.hidden = true;
  indicePendenteExclusao = null;
  atualizarScrollBody();
}

function atualizarScrollBody() {
  document.body.style.overflow = modalOverlay.hidden && confirmarOverlay.hidden ? '' : 'hidden';
}

document.getElementById('fecharModal').addEventListener('click', fecharModal);
document.getElementById('cancelarEdicao').addEventListener('click', fecharModal);
document.getElementById('fecharConfirmacao').addEventListener('click', fecharConfirmacao);
document.getElementById('cancelarConfirmacao').addEventListener('click', fecharConfirmacao);
document.getElementById('confirmarExclusao').addEventListener('click', () => {
  if (indicePendenteExclusao === null) return;
  const lista = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  lista.splice(indicePendenteExclusao, 1);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  fecharConfirmacao();
  renderTabela();
});

modalOverlay.addEventListener('click', event => {
  if (event.target === modalOverlay) {
    fecharModal();
  }
});

confirmarOverlay.addEventListener('click', event => {
  if (event.target === confirmarOverlay) {
    fecharConfirmacao();
  }
});

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (!modalOverlay.hidden) fecharModal();
  if (!confirmarOverlay.hidden) fecharConfirmacao();
});

formEdicao.addEventListener('submit', event => {
  event.preventDefault();

  const indice = Number(document.getElementById('editIndice').value);
  const nome = document.getElementById('editNome').value.trim();
  const email = document.getElementById('editEmail').value.trim();
  const idade = Number(document.getElementById('editIdade').value);
  const filme = document.getElementById('editFilme').value.trim();
  const genero = document.getElementById('editGenero').value;

  const invalido =
    nome.length < 3 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !(idade >= 1 && idade <= 120) ||
    filme.length < 2 ||
    !genero;

  if (invalido) {
    feedbackEdicao.textContent = 'confere os campos antes de salvar as mudanças';
    feedbackEdicao.className = 'feedback erro-feedback';
    return;
  }

  const lista = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  lista[indice] = { ...lista[indice], nome, email, idade, filme, genero };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  renderTabela();
  fecharModal();
});

document.getElementById('btnLimpar').addEventListener('click', () => {
  if (confirm('apagar todos os perfis cadastrados?')) {
    localStorage.removeItem(STORAGE_KEY);
    renderTabela();
  }
});

// máscara CEP
document.getElementById('inputCep').addEventListener('input', e => {
  let v = e.target.value.replace(/\D/g, '');
  if (v.length > 5) v = v.slice(0, 5) + '-' + v.slice(5, 8);
  e.target.value = v;
});

// consulta CEP via ViaCEP ao sair do campo
document.getElementById('inputCep').addEventListener('blur', async () => {
  const cep  = document.getElementById('inputCep').value.replace(/\D/g, '');
  const erro = document.getElementById('erroCep');

  if (cep.length !== 8) {
    erro.textContent = 'precisa ter 8 dígitos';
    limparCep(); return;
  }

  erro.textContent = '';
  try {
    const res  = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await res.json();
    if (data.erro) { erro.textContent = 'cep não encontrado'; limparCep(); return; }
    document.getElementById('rua').value    = data.logradouro || '';
    document.getElementById('bairro').value = data.bairro     || '';
    document.getElementById('cidade').value = data.localidade || '';
    document.getElementById('estado').value = data.uf         || '';
  } catch {
    erro.textContent = 'erro na requisição, checa a conexão';
    limparCep();
  }
});

function limparCep() {
  ['rua','bairro','cidade','estado'].forEach(id =>
    document.getElementById(id).value = ''
  );
}

renderTabela();
