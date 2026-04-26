const authView = document.getElementById("auth-view");
const dashboardView = document.getElementById("dashboard-view");
const userEmailDisplay = document.getElementById("user-email-display");

const authForm = document.querySelector("#auth-form");
const signupButton = document.querySelector("#signup-button");
const logoutButton = document.querySelector("#logout-button");
const merchantForm = document.querySelector("#merchant-form");
const rulesForm = document.querySelector("#rules-form");
const authStatus = document.querySelector("#auth-status");

// Routing logic
const navItems = document.querySelectorAll(".nav-item");
const sections = document.querySelectorAll(".dashboard-section");

navItems.forEach(item => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    const targetId = item.getAttribute("data-target");
    
    // Update active nav
    navItems.forEach(nav => nav.classList.remove("active"));
    item.classList.add("active");
    
    // Update active section
    sections.forEach(section => {
      if (section.id === targetId) {
        section.classList.remove("hidden");
        section.classList.add("active");
      } else {
        section.classList.add("hidden");
        section.classList.remove("active");
      }
    });
  });
});

authForm.addEventListener("submit", (event) => {
  event.preventDefault();
  void authenticate("login");
});

signupButton.addEventListener("click", () => {
  if (!authForm.reportValidity()) return;
  void authenticate("signup");
});

logoutButton.addEventListener("click", async () => {
  await request("/admin/api/logout", { method: "POST" });
  authStatus.textContent = "Signed out";
  authView.classList.remove("hidden");
  dashboardView.classList.add("hidden");
});

merchantForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = {
    name: value("#merchant-name"),
    category: value("#merchant-category"),
    cityId: value("#merchant-city"),
    latitude: Number(value("#merchant-latitude")),
    longitude: Number(value("#merchant-longitude")),
    description: value("#merchant-description"),
  };
  const existing = await request("/admin/api/merchant").catch(() => ({ merchant: null }));
  await request("/admin/api/merchant", {
    method: existing.merchant ? "PUT" : "POST",
    body: JSON.stringify(payload),
  });
  await refreshDashboard();
  alert("Store configuration saved");
});

rulesForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await request("/admin/api/rules", {
    method: "PUT",
    body: JSON.stringify({
      maxDiscountPercent: Number(value("#max-discount")),
      allowedWindows: lines("#allowed-windows"),
      exclusions: lines("#exclusions"),
      tone: value("#tone"),
      validityMinutes: Number(value("#validity-minutes")),
      extraInstructions: value("#extra-instructions"),
      active: document.querySelector("#rules-active").checked,
    }),
  });
  await refreshDashboard();
  alert("Campaign parameters updated");
});

async function authenticate(mode) {
  try {
    const response = await request(`/admin/api/${mode}`, {
      method: "POST",
      body: JSON.stringify({
        email: value("#email"),
        password: value("#password"),
      }),
    });
    authStatus.textContent = "Sign in successful";
    await refreshDashboard();
  } catch (error) {
    authStatus.textContent = error.message;
  }
}

async function refreshDashboard() {
  const me = await request("/admin/api/me").catch(() => null);
  if (!me) {
    authStatus.textContent = "Please sign in";
    authView.classList.remove("hidden");
    dashboardView.classList.add("hidden");
    return;
  }
  
  // Update views
  authView.classList.add("hidden");
  dashboardView.classList.remove("hidden");
  
  userEmailDisplay.textContent = me.owner.email;
  authStatus.textContent = `Signed in as ${me.owner.email}`;

  const merchantResponse = await request("/admin/api/merchant").catch(() => ({ merchant: null }));
  if (merchantResponse.merchant) {
    fillMerchantForm(merchantResponse.merchant);
    if (merchantResponse.merchant.ruleSet) {
      fillRulesForm(merchantResponse.merchant.ruleSet);
    }
  }

  const analytics = await request("/admin/api/analytics/summary").catch(() => null);
  if (analytics) {
    renderAnalytics(analytics);
  }
}

function fillMerchantForm(merchant) {
  setValue("#merchant-name", merchant.name);
  setValue("#merchant-category", merchant.category);
  setValue("#merchant-city", merchant.cityId);
  setValue("#merchant-latitude", merchant.latitude);
  setValue("#merchant-longitude", merchant.longitude);
  setValue("#merchant-description", merchant.description);
}

function fillRulesForm(ruleSet) {
  setValue("#max-discount", ruleSet.maxDiscountPercent);
  setValue("#validity-minutes", ruleSet.validityMinutes);
  setValue("#allowed-windows", (ruleSet.allowedWindows ?? []).join("\n"));
  setValue("#exclusions", (ruleSet.exclusions ?? []).join("\n"));
  setValue("#tone", ruleSet.tone);
  setValue("#extra-instructions", ruleSet.extraInstructions ?? "");
  document.querySelector("#rules-active").checked = ruleSet.active;
}

function renderAnalytics(analytics) {
  document.querySelector("#metric-recommended").textContent = analytics.counts.RECOMMENDED || 0;
  document.querySelector("#metric-generated").textContent = analytics.counts.COUPON_GENERATED || 0;
  document.querySelector("#metric-accepted").textContent = analytics.counts.COUPON_ACCEPTED || 0;
  document.querySelector("#metric-redeemed").textContent = analytics.counts.COUPON_REDEEMED || 0;
  
  document.querySelector("#conversion-rates").textContent = 
    `Generated to accepted: ${analytics.conversionRates.generatedToAccepted}% · Accepted to redeemed: ${analytics.conversionRates.acceptedToRedeemed}%`;

  const events = document.querySelector("#recent-events");
  events.replaceChildren(
    ...analytics.recentEvents.map((event) => {
      const item = document.createElement("li");
      
      const typeSpan = document.createElement("strong");
      typeSpan.textContent = event.type;
      typeSpan.style.marginRight = "auto";
      
      const timeSpan = document.createElement("span");
      timeSpan.textContent = new Date(event.createdAt).toLocaleString(undefined, {
        dateStyle: 'short', timeStyle: 'short'
      });
      timeSpan.style.color = "var(--text-muted)";
      timeSpan.style.fontSize = "0.85rem";

      item.appendChild(typeSpan);
      item.appendChild(timeSpan);
      return item;
    }),
  );
  
  if (analytics.recentEvents.length === 0) {
    events.innerHTML = '<li style="background: transparent; border: none; justify-content: center; color: var(--text-muted)">No recent events</li>';
  }
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!response.ok) {
    let detail = "";
    try {
      detail = await response.text();
    } catch (e) {}
    throw new Error(detail || `Request failed: ${response.status}`);
  }
  return response.json();
}

function value(selector) {
  const el = document.querySelector(selector);
  return el ? el.value.trim() : "";
}

function setValue(selector, nextValue) {
  const el = document.querySelector(selector);
  if (el) el.value = nextValue ?? "";
}

function lines(selector) {
  const v = value(selector);
  if (!v) return [];
  return v
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

void refreshDashboard();
