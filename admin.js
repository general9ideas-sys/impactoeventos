(() => {
  const config = window.IMPACTO_CONFIG || {};
  const loginSection = document.getElementById("adminLogin");
  const loginForm = document.getElementById("adminLoginForm");
  const loginStatus = document.getElementById("adminLoginStatus");
  const panel = document.getElementById("adminPanel");
  const list = document.getElementById("adminList");
  const filter = document.getElementById("adminFilter");
  const refreshBtn = document.getElementById("adminRefresh");
  const statusEl = document.getElementById("adminStatus");

  const SESSION_KEY = "impacto_admin_ok";
  let rows = [];

  const hasSupabase = Boolean(config.supabaseUrl && config.supabaseAnonKey);
  const supabase =
    hasSupabase && window.supabase
      ? window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey)
      : null;

  const setLoginStatus = (message, type = "") => {
    loginStatus.textContent = message;
    loginStatus.className = `agenda-status${type ? ` is-${type}` : ""}`;
  };

  const setStatus = (message, type = "") => {
    statusEl.textContent = message;
    statusEl.className = `agenda-status${type ? ` is-${type}` : ""}`;
  };

  const formatDate = (value) =>
    new Date(`${value}T12:00:00`).toLocaleDateString("es-AR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const showPanel = () => {
    loginSection.hidden = true;
    panel.hidden = false;
    loadReservations();
  };

  const render = () => {
    const selected = filter.value;
    const visible = rows.filter((row) => selected === "todas" || row.status === selected);

    if (!visible.length) {
      list.innerHTML = `<p class="admin-empty">No hay reservas para mostrar.</p>`;
      return;
    }

    list.innerHTML = visible
      .map((row) => {
        return `
          <article class="admin-item" data-id="${row.id}">
            <div class="admin-item-top">
              <div>
                <h3>${formatDate(row.event_date)}</h3>
                <p>${row.client_name} · ${row.client_phone}</p>
              </div>
              <span class="admin-badge is-${row.status}">${row.status}</span>
            </div>
            <p class="admin-meta">
              <strong>${row.event_type}</strong>
              ${row.guests ? ` · ${row.guests} invitados` : ""}
            </p>
            ${row.notes ? `<p class="admin-notes">${row.notes}</p>` : ""}
            <div class="admin-actions">
              <button type="button" data-status="confirmada">Confirmar</button>
              <button type="button" data-status="pendiente">Pendiente</button>
              <button type="button" data-status="cancelada">Cancelar</button>
              <a href="https://wa.me/${String(row.client_phone).replace(/\D/g, "").replace(/^0/, "54")}" target="_blank" rel="noopener noreferrer">WhatsApp cliente</a>
            </div>
          </article>
        `;
      })
      .join("");
  };

  const loadReservations = async () => {
    if (!supabase) {
      setStatus(
        "Falta configurar Supabase en config.js para ver las reservas acá. Mientras tanto llegan por WhatsApp.",
        "error"
      );
      list.innerHTML = "";
      return;
    }

    setStatus("Cargando reservas...", "");
    const { data, error } = await supabase
      .from("reservations")
      .select("*")
      .order("event_date", { ascending: true });

    if (error) {
      console.error(error);
      setStatus("No se pudieron cargar las reservas. Revisá Supabase.", "error");
      return;
    }

    rows = data || [];
    setStatus(`${rows.length} reserva(s) encontrada(s).`, "ok");
    render();
  };

  const updateStatus = async (id, status) => {
    if (!supabase) return;
    const { error } = await supabase.from("reservations").update({ status }).eq("id", id);
    if (error) {
      setStatus("No se pudo actualizar el estado.", "error");
      return;
    }
    rows = rows.map((row) => (row.id === id ? { ...row, status } : row));
    render();
    setStatus("Estado actualizado.", "ok");
  };

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const pin = loginForm.elements.pin.value.trim();
    if (pin === (config.adminPin || "impacto2026")) {
      sessionStorage.setItem(SESSION_KEY, "1");
      showPanel();
    } else {
      setLoginStatus("PIN incorrecto.", "error");
    }
  });

  filter.addEventListener("change", render);
  refreshBtn.addEventListener("click", loadReservations);

  list.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-status]");
    if (!button) return;
    const item = button.closest(".admin-item");
    updateStatus(item.dataset.id, button.dataset.status);
  });

  if (sessionStorage.getItem(SESSION_KEY) === "1") {
    showPanel();
  }
})();
