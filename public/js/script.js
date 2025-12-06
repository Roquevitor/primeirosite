(async () => {
  const API = "https://imperiumparfumm.onrender.com";
  const resposta = await fetch(`${API}/perfumes`, { credentials: "include" });
  //const resposta = await fetch(`perfumes.json`);

  const produtos = await resposta.json();

  let carrinho = [];
  const grid = document.getElementById("grid");
  const form = document.getElementById("contatoForm");
  const categoriaSelect = document.getElementById("categoria");
  const buscarInput = document.getElementById("buscar");
  const cartCount = document.querySelector(".cart-count");

  const nextBtn = document.querySelector(".next");
  const prevBtn = document.querySelector(".prev");

  const cardsPerPage = 5 * 5; // 5 linhas x 5 colunas
  let currentPage = 0;
  let filteredProdutos = [...produtos];

  // ---------------- FUNÇÕES ----------------
  function mostrarNotificacao(msg) {
    const n = document.getElementById("notificacao");
    n.textContent = msg;
    n.classList.add("show");
    setTimeout(() => n.classList.remove("show"), 2500);
  }

  function atualizarContador() {
    cartCount.textContent = carrinho.length;
    cartCount.style.background = "green";
  }

  function atualizarCarrinho() {
    const lista = document.getElementById("listaCarrinho");
    lista.innerHTML = "";
    carrinho.forEach((item, index) => {
      const li = document.createElement("li");
      li.textContent = item.nome;
      const btnRemover = document.createElement("button");
      btnRemover.className = "removerItemBtn";
      btnRemover.innerHTML = `<i class="fa-solid fa-trash"></i>`;
      btnRemover.addEventListener("click", () => removerDoCarrinho(index));
      li.appendChild(btnRemover);
      lista.appendChild(li);
    });
  }

  function adicionarAoCarrinho(id) {
    const produto = produtos.find((p) => p.id === id);
    if (!produto) return;
    carrinho.push(produto);

    atualizarContador();
    atualizarCarrinho();
    mostrarNotificacao(`${produto.nome} adicionado ao carrinho!`);
  }

  function removerDoCarrinho(index) {
    carrinho.splice(index, 1);
    atualizarContador();
    atualizarCarrinho();
  }

  function abrirCarrinho() {
    atualizarCarrinho();

    document.getElementById("modalCarrinho").style.display = "flex";
  }

  function fecharCarrinho() {
    document.getElementById("modalCarrinho").style.display = "none";
  }

  function finalizarCompra() {
    if (carrinho.length === 0) {
      alert("Seu carrinho está vazio!");
      return;
    }
    let mensagem = "Olá! Quero comprar estes perfumes:\n\n";
    carrinho.forEach((p, index) => {
      mensagem += `${index + 1}. ${p.nome} - ${p.categoria}\n`;
    });

    const telefone = "5573999786050";
    const textoWhats = encodeURIComponent(mensagem);
    const link = `https://api.whatsapp.com/send?phone=${telefone}&text=${textoWhats}`;
    window.open(link, "_blank");
  }

  function toggleMenu() {
    document.querySelector(".menu").classList.toggle("show");
  }

  // ---------------- RENDERIZAÇÃO ----------------
  function renderizar(lista) {
    grid.innerHTML = "";
    lista.forEach((prod) => {
      const card = document.createElement("div");
      card.classList.add("card");
      card.innerHTML = `
      <div class="body">

          <div class="imgdiv"><div class="img" style="background-image:url('${prod.img}')"></div></div>
          <div class="divh3"><h3>${prod.nome}</h3></div>
          <div class="divp"><p>${prod.categoria}</p></div>
          <div class="descricaop"><p>${prod.descricao}</p></div>

          <div class="divbtn"><button class="btn adicionar-btn" data-id="${prod.id}">Adicionar</button></div>
        </div>
      `;
      grid.appendChild(card);
    });

    // Adiciona evento nos botões
    document.querySelectorAll(".adicionar-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.id);
        adicionarAoCarrinho(id);
      });
    });

    // Paginação
    currentPage = 0;
    renderPage();
  }

  function renderPage() {
    const cards = Array.from(grid.children);
    const totalPages = Math.ceil(filteredProdutos.length / cardsPerPage);
    const start = currentPage * cardsPerPage;
    const end = start + cardsPerPage;

    cards.forEach((card, index) => {
      card.style.display = index >= start && index < end ? "flex" : "none";
    });

    // Desativa botões se necessário
    prevBtn.disabled = currentPage === 0;
    nextBtn.disabled = currentPage >= totalPages - 1;
  }

  nextBtn.addEventListener("click", () => {
    const totalPages = Math.ceil(filteredProdutos.length / cardsPerPage);
    if (currentPage < totalPages - 1) {
      currentPage++;
      renderPage();
    }
  });

  prevBtn.addEventListener("click", () => {
    if (currentPage > 0) {
      currentPage--;
      renderPage();
    }
  });

  // ---------------- FILTROS ----------------
  function filtrar() {
    const cat = categoriaSelect.value;
    const busca = buscarInput.value.toLowerCase();
    filteredProdutos = produtos.filter(
      (p) =>
        (cat === "" || p.categoria === cat) &&
        p.nome.toLowerCase().includes(busca)
    );
    renderizar(filteredProdutos);
  }

  // ---------------- EVENTOS ----------------
  categoriaSelect.addEventListener("change", filtrar);
  buscarInput.addEventListener("input", filtrar);
  document.querySelector(".menu-toggle").addEventListener("click", toggleMenu);
  document
    .querySelector(".fecharCarrinhoBtn")
    .addEventListener("click", fecharCarrinho);
  document.querySelector(".cart").addEventListener("click", abrirCarrinho);
  document
    .getElementById("finalizarCompraBtn")
    .addEventListener("click", finalizarCompra);

  // Inicializa
  renderizar(produtos);
})();
