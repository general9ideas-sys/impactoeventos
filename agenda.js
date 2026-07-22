(() => {
  const config = window.IMPACTO_CONFIG || {};
  const monthLabel = document.getElementById("agendaMonthLabel");
  const grid = document.getElementById("agendaGrid");
  const prevBtn = document.getElementById("agendaPrev");
  const nextBtn = document.getElementById("agendaNext");
  const form = document.getElementById("agendaForm");
  const selectedLabel = document.getElementById("agendaSelectedDate");
  const statusEl = document.getElementById("agendaStatus");
  const submitBtn = document.getElementById("agendaSubmit");

  if (!grid || !form) return;

  const state = {
    view: new Date(),
    selected: null,
    booked: new Set(),
  };

  state.view.setDate(1);
  state.view.setHours(0, 0, 0, 0);

  const hasSupabase = Boolean(config.supabaseUrl && config.supabaseAnonKey);
  let supabase = null;

  if (hasSupabase && window.supabase) {
    supabase = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
  }

  const toKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const parseKey = (key) => {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d);
  };

  const formatLong = (key) =>
    parseKey(key).toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const startOfToday = () => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  };

  const setStatus = (message, type = "") => {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = `agenda-status${type ? ` is-${type}` : ""}`;
  };

  const loadBookedDates = async () => {
    state.booked = new Set();
    if (!supabase) {
      render();
      return;
    }

    const { data, error } = await supabase
      .from("reservations")
      .select("event_date, status")
      .neq("status", "cancelada");

    if (!error && data) {
      data.forEach((row) => state.booked.add(row.event_date));
    }
    render();
  };

  const render = () => {
    const year = state.view.getFullYear();
    const month = state.view.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startWeekday = (firstDay.getDay() + 6) % 7; // Monday first
    const today = startOfToday();

    if (monthLabel) {
      monthLabel.textContent = state.view.toLocaleDateString("es-AR", {
        month: "long",
        year: "numeric",
      });
    }

    grid.innerHTML = "";

    ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"].forEach((day) => {
      const el = document.createElement("div");
      el.className = "agenda-weekday";
      el.textContent = day;
      grid.appendChild(el);
    });

    for (let i = 0; i < startWeekday; i += 1) {
      const empty = document.createElement("div");
      empty.className = "agenda-day is-empty";
      grid.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      const key = toKey(date);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "agenda-day";
      btn.textContent = String(day);

      const isPast = date < today;
      const isBooked = state.booked.has(key);

      if (isPast) {
        btn.classList.add("is-disabled");
        btn.disabled = true;
      } else if (isBooked) {
        btn.classList.add("is-booked");
        btn.disabled = true;
        btn.title = "Fecha no disponible";
      } else {
        btn.addEventListener("click", () => selectDate(key));
      }

      if (state.selected === key) btn.classList.add("is-selected");
      grid.appendChild(btn);
    }

    if (selectedLabel) {
      selectedLabel.textContent = state.selected
        ? formatLong(state.selected)
        : "Elegí una fecha disponible";
    }
  };

  const selectDate = (key) => {
    state.selected = key;
    form.hidden = false;
    form.elements.event_date.value = key;
    setStatus("");
    render();
  };

  const openWhatsApp = (payload) => {
    const phone = (config.whatsapp || "543764836208").replace(/\D/g, "");
    const text = [
      "Hola Impacto Eventos, quiero reservar una fecha:",
      `Fecha: ${formatLong(payload.event_date)}`,
      `Nombre: ${payload.client_name}`,
      `Teléfono: ${payload.client_phone}`,
      `Tipo de evento: ${payload.event_type}`,
      payload.guests ? `Invitados: ${payload.guests}` : null,
      payload.notes ? `Notas: ${payload.notes}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!state.selected) {
      setStatus("Elegí una fecha en el calendario.", "error");
      return;
    }

    const payload = {
      event_date: state.selected,
      client_name: form.elements.client_name.value.trim(),
      client_phone: form.elements.client_phone.value.trim(),
      event_type: form.elements.event_type.value,
      guests: form.elements.guests.value ? Number(form.elements.guests.value) : null,
      notes: form.elements.notes.value.trim(),
      status: "pendiente",
    };

    if (!payload.client_name || !payload.client_phone) {
      setStatus("Completá nombre y teléfono.", "error");
      return;
    }

    submitBtn.disabled = true;
    setStatus("Enviando reserva...", "");

    try {
      if (supabase) {
        const { error } = await supabase.from("reservations").insert([payload]);
        if (error) throw error;
        state.booked.add(payload.event_date);
        setStatus("Reserva enviada. El salón la verá en su panel de agenda.", "ok");
      } else {
        setStatus(
          "Reserva armada. Te abrimos WhatsApp para enviársela al salón.",
          "ok"
        );
      }

      openWhatsApp(payload);
      form.reset();
      form.elements.event_date.value = state.selected;
      render();
    } catch (err) {
      console.error(err);
      setStatus("No se pudo guardar online. Te abrimos WhatsApp para enviarla igual.", "error");
      openWhatsApp(payload);
    } finally {
      submitBtn.disabled = false;
    }
  });

  prevBtn?.addEventListener("click", () => {
    state.view.setMonth(state.view.getMonth() - 1);
    render();
  });

  nextBtn?.addEventListener("click", () => {
    state.view.setMonth(state.view.getMonth() + 1);
    render();
  });

  loadBookedDates();
})();
