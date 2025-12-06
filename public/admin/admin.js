(async () => {
  const API = "https://imperiumparfumm.onrender.com";
  let perfumes = [];

  // ------------------ LOGIN ------------------
  async function verificarLogin() {
    try {
      const resp = await fetch(`${API}/auth`, { credentials: "include" });
      if (!resp.ok) throw new Error("Não autenticado");
    } catch {
      window.location.href = `${API}/admin/login.html`;
    }
  }

  async function logout() {
    await fetch(`${API}/logout`, { method: "POST", credentials: "include" });
    window.location.href = `${API}/admin/login.html`;
  }

  // ------------------ CARREGAR PERFUMES ------------------
  async function carregarPerfumes() {
    const lista = document.getElementById("listaPerfumes");
    if (!lista) return;

    lista.innerHTML = `<p class="loading">Carregando perfumes...</p>`;

    try {
      const resp = await fetch(`${API}/perfumes`, { credentials: "include" });
      if (!resp.ok) throw new Error("Erro ao carregar perfumes");

      perfumes = await resp.json();
      renderizar(perfumes);
      preencherCategorias();
    } catch (erro) {
      console.error(erro);
      lista.innerHTML = `<p class="error">Erro ao carregar perfumes.</p>`;
    }
  }

  // ------------------ RENDER ------------------
  function renderizar(lista) {
    const container = document.getElementById("listaPerfumes");
    if (!container) return;

    container.innerHTML = "";

    if (!lista.length) {
      container.innerHTML = `<p>Nenhum perfume encontrado.</p>`;
      return;
    }

    lista.forEach((p) => {
      const card = document.createElement("div");
      card.className = "perfume-item";

      const imgSrc = p.img || "https://via.placeholder.com/150?text=Sem+Imagem";

      card.innerHTML = `
        <img src="${imgSrc}" class="perfume-img" alt="${p.nome}">
        <div class="info">
          <b>${p.nome}</b><br>
          <small>ID: ${p.id}</small>
          <p>${p.descricao}</p>
          <button class="editar-btn" data-id="${p.id}">Editar</button>
          <button class="remover-btn" data-id="${p.id}">Remover</button>
        </div>
      `;

      container.appendChild(card);
    });

    // EVENTO REMOVER
    document.querySelectorAll(".remover-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        if (!confirm("Deseja remover este perfume?")) return;

        try {
          const resp = await fetch(`${API}/perfumes/${id}`, {
            method: "DELETE",
            credentials: "include",
          });

          if (!resp.ok) throw new Error("Erro ao remover perfume");

          await carregarPerfumes();
        } catch (err) {
          console.error(err);
          alert("Erro ao remover perfume");
        }
      });
    });

    // EVENTO EDITAR
    document.querySelectorAll(".editar-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const perfume = perfumes.find((x) => x.id == id);
        if (!perfume) return;

        document.getElementById("nome").value = perfume.nome;
        document.getElementById("categoria").value = perfume.categoria;
        document.getElementById("descricao").value = perfume.descricao;
        document.getElementById("img").value = perfume.img;

        const botao = document.getElementById("btnSalvarEdicao");
        if (!botao) return;

        botao.style.display = "flex";
        botao.textContent = "Salvar Alterações";

        const novo = botao.cloneNode(true);
        botao.parentNode.replaceChild(novo, botao);

        novo.addEventListener("click", async () => {
          const nome = document.getElementById("nome").value.trim();
          const categoria = document.getElementById("categoria").value.trim();
          const descricao = document.getElementById("descricao").value.trim();
          const img = document.getElementById("img").value.trim();

          if (!nome || !categoria || !descricao) {
            return alert("Preencha todos os campos obrigatórios!");
          }

          try {
            const resp = await fetch(`${API}/perfumes/${id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ nome, categoria, descricao, img }),
              credentials: "include",
            });

            if (!resp.ok) throw new Error("Erro ao editar perfume");

            document.getElementById("nome").value = "";
            document.getElementById("categoria").value = "";
            document.getElementById("descricao").value = "";
            document.getElementById("img").value = "";

            await carregarPerfumes();
            novo.style.display = "none";
            alert("Perfume editado com sucesso!");
          } catch (err) {
            console.error(err);
            alert("Erro ao editar perfume");
          }
        });
      });
    });
  }

  // ------------------ ADICIONAR PERFUME ------------------
  const botaoAdd = document.querySelector(".btnAdicionar");

  if (botaoAdd) {
    botaoAdd.addEventListener("click", async () => {
      const nome = document.getElementById("nome").value.trim();
      const categoria = document.getElementById("categoria").value.trim();
      const descricao = document.getElementById("descricao").value.trim();
      const img = document.getElementById("img").value.trim();

      if (!nome || !categoria || !descricao) {
        return alert("Preencha todos os campos obrigatórios!");
      }

      try {
        const resp = await fetch(`${API}/perfumes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome, categoria, descricao, img }),
          credentials: "include",
        });

        if (!resp.ok) throw new Error("Erro ao adicionar perfume");

        document.getElementById("nome").value = "";
        document.getElementById("categoria").value = "";
        document.getElementById("descricao").value = "";
        document.getElementById("img").value = "";

        await carregarPerfumes();
        alert("Perfume adicionado com sucesso!");
      } catch (err) {
        console.error(err);
        alert("Erro ao adicionar perfume");
      }
    });
  }

  // ------------------ FILTROS ------------------
  function preencherCategorias() {
    const select = document.getElementById("filtroCategoria");
    if (!select) return;

    const categorias = [
      ...new Set(perfumes.map((p) => p.categoria || "Sem Categoria")),
    ];

    select.innerHTML = `<option value="">Todas categorias</option>`;
    categorias.forEach((cat) => {
      select.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
  }

  function aplicarFiltros() {
    const busca = document.getElementById("buscar").value.toLowerCase();
    const filtroCat = document.getElementById("filtroCategoria").value;
    const ordenar = document.getElementById("ordenar").value;

    let filtrados = perfumes.filter((p) => {
      const texto = `${p.nome} ${p.descricao} ${
        p.categoria || ""
      }`.toLowerCase();
      const condBusca = texto.includes(busca);
      const condCategoria = filtroCat ? p.categoria === filtroCat : true;
      return condBusca && condCategoria;
    });

    if (ordenar === "nomeA")
      filtrados.sort((a, b) => a.nome.localeCompare(b.nome));
    if (ordenar === "nomeZ")
      filtrados.sort((a, b) => b.nome.localeCompare(a.nome));
    if (ordenar === "idC") filtrados.sort((a, b) => a.id - b.id);
    if (ordenar === "idD") filtrados.sort((a, b) => b.id - a.id);

    renderizar(filtrados);
  }

  // ------------------ EVENTOS GLOBAIS ------------------
  await verificarLogin();
  await carregarPerfumes();

  document.getElementById("btnLogout")?.addEventListener("click", logout);
  document.getElementById("buscar")?.addEventListener("input", aplicarFiltros);
  document
    .getElementById("filtroCategoria")
    ?.addEventListener("change", aplicarFiltros);
  document
    .getElementById("ordenar")
    ?.addEventListener("change", aplicarFiltros);
})();
