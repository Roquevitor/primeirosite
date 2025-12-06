const API = "https://imperiumparfumm.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  const btnLogin = document.getElementById("btn-login");
  const inputSenha = document.getElementById("senha");

  if (!btnLogin || !inputSenha) return;

  btnLogin.addEventListener("click", async () => {
    const senha = inputSenha.value.trim();
    if (!senha) return alert("Digite a senha do administrador.");

    try {
      const resp = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }),
        credentials: "include",
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.erro || "Erro no login");
      }

      // Redireciona para painel
      window.location.href = "/admin/admin_panel.html";
    } catch (err) {
      alert(err.message);
    }
  });
});
