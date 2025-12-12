// assets/app.js
(async function () {
  const $ = (id) => document.getElementById(id);

  // Elements (main)
  const serviceSelect = $("serviceSelect");
  const urgencySelect = $("urgencySelect");
  const addonsWrap = $("addonsWrap");
  const dateSelect = $("dateSelect");
  const timeSelect = $("timeSelect");
  const bizTypeSelect = $("bizTypeSelect");
  const address = $("address");
  const contactName = $("contactName");
  const contactPhone = $("contactPhone");
  const contactEmail = $("contactEmail");
  const notes = $("notes");
  const depositConfirm = $("depositConfirm");

  const payDepositBtn = $("payDepositBtn");
  const payDepositBtnSticky = $("payDepositBtnSticky");
  const payDeepCleanBtn = $("payDeepCleanBtn");
  const payEmergencyBtn = $("payEmergencyBtn");

  const sendBookingTextBtn = $("sendBookingTextBtn");
  const sendBookingTextBtnSticky = $("sendBookingTextBtnSticky");
  const callBtn = $("callBtn");

  const estimateValue = $("estimateValue");
  const timelineValue = $("timelineValue");
  const summaryText = $("summaryText");
  const emergencyNote = $("emergencyNote");

  const readyChip = $("readyChip");
  const readySub = $("readySub");
  const stickySub = $("stickySub");

  const bizName = $("bizName");
  const bizMeta = $("bizMeta");
  const noticeChip = $("noticeChip");
  const priorityLine = $("priorityLine");
  const scheduleNote = $("scheduleNote");

  // Load config
  const res = await fetch("assets/config.json", { cache: "no-store" });
  const config = await res.json();

  // Inject top meta
  bizName.textContent = config.business.name;
  bizMeta.textContent = `${config.business.city} • Dispatch Scheduling`;
  noticeChip.textContent = `Min ${config.timeline.minimumNoticeHours}h notice`;
  priorityLine.innerHTML = config.responseExpectations.line;
  scheduleNote.textContent = config.scheduling.note;

  // Links
  payDepositBtn.href = config.links.depositLink;
  payDepositBtnSticky.href = config.links.depositLink;
  payDeepCleanBtn.href = config.links.deepCleanPayLink;

  // Call link
  callBtn.href = `tel:${config.business.phone_e164}`;

  // Helpers
  const money = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: config.pricing.currency || "USD",
      maximumFractionDigits: 0
    }).format(n);

  const todayLocal = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

  const addDays = (d, days) => {
    const nd = new Date(d);
    nd.setDate(nd.getDate() + days);
    return nd;
  };

  const fmtDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const prettyDate = (d) =>
    d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  // Populate selects
  function fillSelect(selectEl, items, getLabel, getValue) {
    selectEl.innerHTML = "";
    items.forEach((it, idx) => {
      const opt = document.createElement("option");
      opt.value = getValue ? getValue(it) : String(idx);
      opt.textContent = getLabel ? getLabel(it) : String(it);
      selectEl.appendChild(opt);
    });
  }

  fillSelect(serviceSelect, config.services, (s) => s.name, (s) => s.id);
  fillSelect(urgencySelect, config.urgency, (u) => u.name, (u) => u.id);
  fillSelect(bizTypeSelect, config.businessTypes, (b) => b, (b) => b);

  // Addons
  function renderAddons() {
    addonsWrap.innerHTML = "";
    config.addons.forEach((a) => {
      const row = document.createElement("label");
      row.className = "addon";
      row.innerHTML = `
        <input type="checkbox" data-addon-id="${a.id}" />
        <div>
          <div class="addon__name">${a.name} <span class="muted">(${money(a.low)}–${money(a.high)})</span></div>
          <div class="addon__desc">${a.description}</div>
        </div>
      `;
      addonsWrap.appendChild(row);
    });
  }
  renderAddons();

  // Dates (respect minimum notice)
  function renderDates() {
    const start = todayLocal();
    // minimumNoticeHours -> convert to days floor; keep it simple for UX
    const minDays = Math.max(1, Math.ceil((config.timeline.minimumNoticeHours || 24) / 24));
    const first = addDays(start, minDays);

    const days = [];
    for (let i = 0; i < (config.scheduling.daysToShow || 14); i++) {
      const d = addDays(first, i);
      days.push(d);
    }

    dateSelect.innerHTML = "";
    days.forEach((d) => {
      const opt = document.createElement("option");
      opt.value = fmtDate(d);
      opt.textContent = `${prettyDate(d)} (${fmtDate(d)})`;
      dateSelect.appendChild(opt);
    });

    fillSelect(timeSelect, config.scheduling.timeSlots, (t) => t, (t) => t);
  }
  renderDates();

  // Get selection state
  function getSelectedService() {
    const id = serviceSelect.value;
    return config.services.find((s) => s.id === id) || config.services[0];
  }

  function getSelectedUrgency() {
    const id = urgencySelect.value;
    return config.urgency.find((u) => u.id === id) || config.urgency[0];
  }

  function getSelectedAddons() {
    const checks = addonsWrap.querySelectorAll("input[type='checkbox']");
    const ids = [];
    checks.forEach((c) => {
      if (c.checked) ids.push(c.getAttribute("data-addon-id"));
    });
    return config.addons.filter((a) => ids.includes(a.id));
  }

  function applyMarkup(low, high, urgency) {
    if (!urgency) return { low, high };
    if (urgency.markupType === "percent") {
      const mult = 1 + (urgency.markupValue || 0) / 100;
      return { low: Math.round(low * mult), high: Math.round(high * mult) };
    }
    if (urgency.markupType === "flat") {
      const add = urgency.markupValue || 0;
      return { low: low + add, high: high + add };
    }
    return { low, high };
  }

  function timelineLabel(urgency) {
    const key = urgency.windowLabel;
    if (!key) return config.timeline.standardWindow;
    if (key === "timeline.standardWindow") return config.timeline.standardWindow;
    if (key === "timeline.rushWindow") return config.timeline.rushWindow;
    if (key === "timeline.emergencyWindow") return config.timeline.emergencyWindow;
    return config.timeline.standardWindow;
  }

  // Build summary + readiness
  function build() {
    const svc = getSelectedService();
    const urg = getSelectedUrgency();
    const addons = getSelectedAddons();

    let low = svc.baseLow;
    let high = svc.baseHigh;

    // add-ons add to range
    addons.forEach((a) => {
      low += a.low;
      high += a.high;
    });

    // urgency markup
    const marked = applyMarkup(low, high, urg);
    low = marked.low;
    high = marked.high;

    const estimate = `${money(low)}–${money(high)}`;
    estimateValue.textContent = estimate;

    const tlabel = timelineLabel(urg);
    timelineValue.textContent = tlabel;

    // Emergency note
    if (urg.id === "emergency") {
      emergencyNote.style.display = "block";
      emergencyNote.textContent = (urg.disclaimerLine || "Emergency / same-day is subject to availability.");
      // Emergency pay link if you add it later
      if (urg.emergencyPayLink) {
        payEmergencyBtn.style.display = "inline-flex";
        payEmergencyBtn.href = urg.emergencyPayLink;
        payEmergencyBtn.textContent = urg.emergencyPayLabel || "Pay Emergency Fee";
      } else {
        payEmergencyBtn.style.display = "none";
      }
    } else {
      emergencyNote.style.display = "none";
      payEmergencyBtn.style.display = "none";
    }

    const addonsText = addons.length ? addons.map((a) => a.name).join(", ") : "None";

    const summary =
`Service: ${svc.name}
Urgency: ${urg.name}
Add-ons: ${addonsText}

Requested window:
Date: ${dateSelect.value}
Time: ${timeSelect.value}

Business type: ${bizTypeSelect.value}

Address:
${address.value || "—"}

On-site contact:
Name: ${contactName.value || "—"}
Phone: ${contactPhone.value || "—"}
Email: ${contactEmail.value || "—"}

Notes:
${notes.value || "—"}

Estimate (example): ${estimate}
Timeline: ${tlabel}`;

    summaryText.textContent = summary;

    // readiness rules
    const requiredOk =
      (address.value || "").trim().length >= 8 &&
      (contactName.value || "").trim().length >= 2 &&
      (contactPhone.value || "").trim().length >= 7 &&
      (contactEmail.value || "").includes("@") &&
      depositConfirm.checked;

    const msg = compileSMS({
      date: dateSelect.value,
      time: timeSelect.value,
      biz_type: bizTypeSelect.value,
      name: contactName.value.trim(),
      customer_phone: contactPhone.value.trim(),
      customer_email: contactEmail.value.trim(),
      city: config.business.city,
      service: svc.name,
      addons: addonsText,
      urgency: urg.name,
      estimate: estimate,
      address: address.value.trim(),
      notes: (notes.value || "").trim() || "None"
    });

    const smsHref = makeSMSLink(config.business.phone_e164, msg);

    sendBookingTextBtn.disabled = !requiredOk;
    sendBookingTextBtnSticky.disabled = !requiredOk;

    sendBookingTextBtn.setAttribute("data-sms", smsHref);
    sendBookingTextBtnSticky.setAttribute("data-sms", smsHref);

    if (requiredOk) {
      readyChip.textContent = "Ready";
      readyChip.classList.add("chip--live");
      readySub.textContent = "You’re ready. Send your dispatch request now.";
      stickySub.textContent = "Ready. Tap Send to request dispatch.";
    } else {
      readyChip.textContent = "Not ready";
      readyChip.classList.remove("chip--live");
      readySub.textContent = "Complete required fields + confirm deposit to unlock Send.";
      stickySub.textContent = "Complete required fields + confirm deposit.";
    }
  }

  function compileSMS(data) {
    const tpl = config.smsTemplates.dispatchRequest;
    return tpl
      .replace("{{date}}", data.date)
      .replace("{{time}}", data.time)
      .replace("{{biz_type}}", data.biz_type)
      .replace("{{name}}", data.name || "—")
      .replace("{{customer_phone}}", data.customer_phone || "—")
      .replace("{{customer_email}}", data.customer_email || "—")
      .replace("{{city}}", data.city || "—")
      .replace("{{service}}", data.service || "—")
      .replace("{{addons}}", data.addons || "None")
      .replace("{{urgency}}", data.urgency || "Standard")
      .replace("{{estimate}}", data.estimate || "—")
      .replace("{{address}}", data.address || "—")
      .replace("{{notes}}", data.notes || "None");
  }

  // iOS-friendly SMS links:
  // sms:+1773...?&body=... sometimes needs ?body= on some platforms.
  function makeSMSLink(phoneE164, body) {
    const encoded = encodeURIComponent(body);
    // Prefer sms:PHONE?&body= for iOS reliability
    return `sms:${phoneE164}?&body=${encoded}`;
  }

  function handleSend(btn) {
    const href = btn.getAttribute("data-sms");
    if (!href) return;
    // Optional: GA event hooks (works if GA configured)
    try {
      if (window.gtag) window.gtag("event", "dispatch_send_click", { event_category: "lead", event_label: "sms" });
    } catch (e) {}
    window.location.href = href;
  }

  function handleDepositClick() {
    try {
      if (window.gtag) window.gtag("event", "deposit_click", { event_category: "lead", event_label: "deposit" });
    } catch (e) {}
  }

  function handleCallClick() {
    try {
      if (window.gtag) window.gtag("event", "call_click", { event_category: "lead", event_label: "call" });
    } catch (e) {}
  }

  // Bind events
  [
    serviceSelect, urgencySelect, dateSelect, timeSelect, bizTypeSelect,
    address, contactName, contactPhone, contactEmail, notes, depositConfirm
  ].forEach((el) => el.addEventListener("input", build));

  addonsWrap.addEventListener("change", build);

  sendBookingTextBtn.addEventListener("click", () => handleSend(sendBookingTextBtn));
  sendBookingTextBtnSticky.addEventListener("click", () => handleSend(sendBookingTextBtnSticky));

  payDepositBtn.addEventListener("click", handleDepositClick);
  payDepositBtnSticky.addEventListener("click", handleDepositClick);

  callBtn.addEventListener("click", handleCallClick);

  // Initial render
  build();
})();
