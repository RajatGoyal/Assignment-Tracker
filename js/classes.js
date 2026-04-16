let role = null;

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "onClick") node.addEventListener("click", v);
    else if (k in node) node[k] = v;
    else node.setAttribute(k, v);
  }
  for (const child of children) {
    if (child == null) continue;
    if (typeof child === "string" || typeof child === "number") {
      node.appendChild(document.createTextNode(String(child)));
    } else {
      node.appendChild(child);
    }
  }
  return node;
}

function renderNav() {
  const nav = document.getElementById("navLinks");
  if (role === "teacher") {
    nav.appendChild(el("a", { href: "classes.html", class: "active" }, "Classes"));
  } else {
    nav.appendChild(el("a", { href: "index.html" }, "Dashboard"));
    nav.appendChild(el("a", { href: "calendar.html" }, "Calendar"));
    nav.appendChild(el("a", { href: "analytics.html" }, "Analytics"));
    nav.appendChild(el("a", { href: "classes.html", class: "active" }, "Classes"));
  }
  const logout = el("a", { href: "#", id: "logoutBtn" }, "Logout");
  logout.addEventListener("click", (e) => { e.preventDefault(); Auth.logout(); });
  nav.appendChild(logout);
}

function renderActionPanel() {
  const panel = document.getElementById("actionPanel");
  panel.replaceChildren();

  if (role === "teacher") {
    document.getElementById("pageSubtitle").textContent = "Create classes and manage assignments.";
    const wrap = el("div", { class: "d-flex justify-content-between align-items-center" },
      el("p", { class: "mb-0 text-muted" }, "Each class has a join code your students enter to enroll."),
      el("button", {
        class: "btn btn-success",
        onClick: () => bootstrap.Modal.getOrCreateInstance(document.getElementById("createClassModal")).show()
      }, "+ Create Class")
    );
    panel.appendChild(wrap);
    return;
  }

  document.getElementById("pageSubtitle").textContent = "Join classes to receive assignments.";

  const form = el("form", { class: "row g-2 align-items-end" });
  const inputCol = el("div", { class: "col-sm-8" },
    el("label", { class: "form-label small text-muted" }, "Join code from your teacher"),
    el("input", {
      type: "text", id: "joinCodeInput", class: "form-control",
      placeholder: "e.g. AB3K7Q", maxLength: 16, required: true,
      style: "text-transform:uppercase;"
    })
  );
  const btnCol = el("div", { class: "col-sm-4" },
    el("button", { type: "submit", class: "btn btn-primary w-100" }, "Join Class")
  );
  form.appendChild(inputCol);
  form.appendChild(btnCol);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const code = document.getElementById("joinCodeInput").value.trim().toUpperCase();
    if (!code) return;
    try {
      await Api.joinClass(code);
      document.getElementById("joinCodeInput").value = "";
      await loadClasses();
    } catch (err) {
      if (err.message !== "Unauthorized") alert(err.message);
    }
  });
  panel.appendChild(form);
}

function renderClassCard(cls) {
  const col = el("div", { class: "col-md-6 col-lg-4" });
  const card = el("div", { class: "card h-100", style: "background:#111827; border:1px solid #1f2933;" });
  const body = el("div", { class: "card-body" });

  body.appendChild(el("h5", { class: "card-title mb-1" }, cls.name));
  body.appendChild(el("p", { class: "text-muted small mb-2" }, cls.subject));

  if (role === "teacher") {
    body.appendChild(el("p", { class: "mb-2" },
      el("strong", {}, "Join code: "),
      el("code", { class: "text-info" }, cls.joinCode)
    ));
  }

  const actions = el("div", { class: "d-flex gap-2 mt-3" });
  actions.appendChild(el("a", {
    href: "class.html?id=" + cls._id,
    class: "btn btn-sm btn-outline-light"
  }, "Open"));
  body.appendChild(actions);

  card.appendChild(body);
  col.appendChild(card);
  return col;
}

async function loadClasses() {
  const list = document.getElementById("classList");
  list.replaceChildren();
  try {
    const classes = await Api.myClasses();
    if (classes.length === 0) {
      list.appendChild(el("div", { class: "col-12" },
        el("div", { class: "empty-state" },
          el("p", {}, role === "teacher"
            ? "You haven't created any classes yet."
            : "You haven't joined any classes yet.")
        )
      ));
      return;
    }
    classes.forEach(c => list.appendChild(renderClassCard(c)));
  } catch (err) {
    if (err.message !== "Unauthorized") alert("Failed to load classes: " + err.message);
  }
}

document.getElementById("createClassBtn").addEventListener("click", async () => {
  const name = document.getElementById("className").value.trim();
  const subject = document.getElementById("classSubject").value.trim();
  if (!name || !subject) {
    alert("Class name and subject are required.");
    return;
  }
  try {
    await Api.createClass({ name, subject });
    bootstrap.Modal.getOrCreateInstance(document.getElementById("createClassModal")).hide();
    document.getElementById("className").value = "";
    document.getElementById("classSubject").value = "";
    await loadClasses();
  } catch (err) {
    if (err.message !== "Unauthorized") alert(err.message);
  }
});

Auth.ready().then(() => {
  role = Auth.role();
  renderNav();
  renderActionPanel();
  loadClasses();
});
