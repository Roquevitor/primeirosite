(async () => {
  // Dados dos produtos (substitua pela sua API ou JSON)
  const API = "https://imperiumparfumm.onrender.com";
  const resposta = await fetch(`${API}/perfumes`, { credentials: "include" });
  //const resposta = await fetch(`perfumes.json`);

  const produtos = await resposta.json();
  let carrinho = [];
  let filteredProdutos = [...produtos];
  let currentPage = 0;
  const cardsPerPage = 9;

  const grid = document.getElementById("grid");
  const categoriaSelect = document.getElementById("categoria");
  const buscarInput = document.getElementById("buscar");
  const cartCount = document.getElementById("cartCount");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const pageInfo = document.getElementById("pageInfo");
  const header = document.getElementById("header");
  const menuToggle = document.getElementById("menuToggle");
  const menu = document.getElementById("menu");

  // Header scroll effect
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });

  // Menu toggle
  menuToggle.addEventListener("click", () => {
    menu.classList.toggle("show");
  });

  // Close menu on link click
  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.remove("show");
    });
  });

  // Notification
  function mostrarNotificacao(msg) {
    const n = document.getElementById("notificacao");
    n.textContent = msg;
    n.classList.add("show");
    setTimeout(() => n.classList.remove("show"), 2500);
  }

  // Update cart counter
  function atualizarContador() {
    cartCount.textContent = carrinho.length;
  }

  // Render cart
  function atualizarCarrinho() {
    const lista = document.getElementById("listaCarrinho");
    const totalSpan = document.querySelector("#cartTotal span:last-child");
    lista.innerHTML = "";

    if (carrinho.length === 0) {
      lista.innerHTML = `
        <li style="text-align: center; color: var(--neutral-400); padding: 40px 20px; border: none;">
          <i class="fa-solid fa-shopping-bag" style="fontSize: 3rem; marginBottom: 16px; display: block; opacity: 0.3;"></i>
          <p>Seu carrinho está vazio</p>
        </li>
      `;
      totalSpan.textContent = "0";
      return;
    }

    carrinho.forEach((item, index) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <div style="flex: 1;">
          <div style="font-weight: 600; margin-bottom: 4px;">${item.nome}</div>
          <div style="font-size: 0.8125rem; color: var(--neutral-400);">
            ${item.categoria}${
        item.preco ? ` • R$ ${item.preco.toFixed(2)}` : ""
      }
          </div>
        </div>
        <button class="removerItemBtn" data-index="${index}">
          <i class="fa-solid fa-trash"></i>
        </button>
      `;
      lista.appendChild(li);
    });

    totalSpan.textContent = carrinho.length;

    // Add remove listeners
    document.querySelectorAll(".removerItemBtn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const index = parseInt(btn.dataset.index);
        removerDoCarrinho(index);
      });
    });
  }

  // Add to cart
  function adicionarAoCarrinho(id) {
    const produto = produtos.find((p) => p.id === id);
    if (!produto) return;
    carrinho.push(produto);
    atualizarContador();
    atualizarCarrinho();
    mostrarNotificacao(`${produto.nome} adicionado ao carrinho!`);
  }

  // Remove from cart
  function removerDoCarrinho(index) {
    carrinho.splice(index, 1);
    atualizarContador();
    atualizarCarrinho();
  }

  // Open cart
  document.getElementById("cartBtn").addEventListener("click", () => {
    atualizarCarrinho();
    document.getElementById("modalCarrinho").classList.add("show");
  });

  // Close cart
  document.getElementById("fecharCarrinhoBtn").addEventListener("click", () => {
    document.getElementById("modalCarrinho").classList.remove("show");
  });

  // Close cart on backdrop click
  document.getElementById("modalCarrinho").addEventListener("click", (e) => {
    if (e.target.id === "modalCarrinho") {
      document.getElementById("modalCarrinho").classList.remove("show");
    }
  });

  // Finalize purchase
  document
    .getElementById("finalizarCompraBtn")
    .addEventListener("click", () => {
      if (carrinho.length === 0) {
        mostrarNotificacao("Seu carrinho está vazio!");
        return;
      }

      let mensagem = "Olá! Quero comprar estes perfumes:\n\n";
      carrinho.forEach((p, index) => {
        mensagem += `${index + 1}. ${p.nome} - ${p.categoria}`;
        if (p.preco) mensagem += ` - R$ ${p.preco.toFixed(2)}`;
        mensagem += "\n";
      });

      const telefone = "5573999786050";
      const textoWhats = encodeURIComponent(mensagem);
      const link = `https://api.whatsapp.com/send?phone=${telefone}&text=${textoWhats}`;
      window.open(link, "_blank");

      carrinho = [];
      atualizarContador();
      atualizarCarrinho();
      document.getElementById("modalCarrinho").classList.remove("show");
    });

  // Render products
  function renderizar(lista) {
    grid.innerHTML = "";

    if (lista.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 80px 20px; color: var(--text-tertiary);">
          <i class="fas fa-search" style="font-size: 4rem; margin-bottom: 24px; opacity: 0.3; display: block;"></i>
          <h3 style="margin-bottom: 12px; color: var(--text-secondary);">Nenhum produto encontrado</h3>
          <p>Tente ajustar os filtros de busca</p>
        </div>
      `;
      document.getElementById("pagination").style.display = "none";
      return;
    }

    document.getElementById("pagination").style.display = "flex";
    const startIndex = currentPage * cardsPerPage;
    const endIndex = startIndex + cardsPerPage;
    const paginatedLista = lista.slice(startIndex, endIndex);

    paginatedLista.forEach((prod) => {
      const card = document.createElement("div");
      card.classList.add("card");
      card.innerHTML = `
        <div class="imgdiv">
          <div class="img" style="background-image: url('${prod.img}')"></div>
        </div>
        <div class="body">
          <div class="divp"><span>${prod.categoria}</span></div>
          <div class="divh3"><h3>${prod.nome}</h3></div>
          <div class="descricaop"><p>${prod.descricao}</p></div>
          ${
            prod.preco
              ? `<div class="row"><div class="price">R$ ${prod.preco.toFixed(
                  2
                )}</div></div>`
              : ""
          }
          <div class="divbtn">
            <button class="btn adicionar-btn" data-id="${
              prod.id
            }">Adicionar ao Carrinho</button>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

    // Add click listeners
    document.querySelectorAll(".adicionar-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.id);
        adicionarAoCarrinho(id);
      });
    });

    updatePagination(lista.length);
  }

  // Update pagination
  function updatePagination(totalItems) {
    const totalPages = Math.ceil(totalItems / cardsPerPage);
    pageInfo.textContent = `${currentPage + 1} / ${totalPages}`;
    prevBtn.disabled = currentPage === 0;
    nextBtn.disabled = currentPage >= totalPages - 1;
  }

  // Pagination
  prevBtn.addEventListener("click", () => {
    if (currentPage > 0) {
      currentPage--;
      renderizar(filteredProdutos);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  nextBtn.addEventListener("click", () => {
    const totalPages = Math.ceil(filteredProdutos.length / cardsPerPage);
    if (currentPage < totalPages - 1) {
      currentPage++;
      renderizar(filteredProdutos);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  // Filter
  function filtrar() {
    const cat = categoriaSelect.value;
    const busca = buscarInput.value.toLowerCase();
    filteredProdutos = produtos.filter(
      (p) =>
        (cat === "" || p.categoria === cat) &&
        p.nome.toLowerCase().includes(busca)
    );
    currentPage = 0;
    renderizar(filteredProdutos);
  }

  categoriaSelect.addEventListener("change", filtrar);
  buscarInput.addEventListener("input", filtrar);

  // Initial render
  renderizar(filteredProdutos);
})();
