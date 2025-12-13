// assets/app.js — Minimal Dispatch (WooCommerce handles options/pricing)

(async function () {
  const $ = (id) => document.getElementById(id);

  const bizName = $("bizName");
  const bizMeta = $("bizMeta");
  const noticeChip = $("noticeChip");
  const priorityLine = $("priorityLine");
  const scheduleNote = $("scheduleNote");

  const urgencySelect = $("urgencySelect");
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

  const sendTextBtn = $("sendBookingTextBtn");
  const sendTextBtnSticky = $("sendBookingTextBtnSticky");
  const emailBtn = $("emailBtn");
  const callBtn = $("callBtn");

  const readyChip = $("readyChip");
  const readySub = $("readySub");
  const stickySub = $("stickySub");

  // Load config
  const res = await fetch("assets/config.json", { cache: "no-store" });
  const config = await res.json();

  // Inject meta
  bizName.textContent = config.business.name;
  bizMeta.textContent = `${config.business.city} • Priority Dispatch`;
  noticeChip.textContent = `Min ${config.timeline.minimumNoticeHours}h notice`;
  priorityLine.innerHTML = config.responseExpectations.line;
  scheduleNote.textContent = config.scheduling.note;

  // Links
  payDepositBtn.href = config.links.depositLink;
  payDepositBtnSticky.href = config.links.depositLink;
  payDeepCleanBtn.href = config.links.deepCleanPayLink;

  // Call link
  callBtn.href = `tel:${config.business.phone_e164}`;

  // Populate business types
  (function fillBizTypes() {
    bizTypeSelect.innerHTML = "";
    (config.businessTypes || []).forEach((b) => {
      const opt = document.createElement("option");
      opt.value = b;
      opt.textContent = b;
      bizTypeSelect.appendChild(opt);
    });
  })();

  // Populate urgency (for routing language only)
  (function fillUrgency() {
    urgencySelect.innerHTML = "";
    (config.urgency || []).forEach((u) => {
      const opt = document.createElement("option");
      opt.value = u.id;
      opt.textContent = u.name;
      urgencySelect.appendChild(opt);
    });
  })();

  // Dates / times (respect minimum notice)
  function todayLocal() {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  function addDays(d, days) {
    const nd = new Date(d);
    nd.setDate(nd.getDate() + days);
    return nd;
  }
  function fmtDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  function prettyDate(d) {
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  function renderDates() {
    const start = todayLocal();
    const minDays = Math.max(1, Math.ceil((config.timeline.minimumNoticeHours || 24) / 24));
    const first = addDays(start, minDays);

    dateSelect.innerHTML = "";
    const daysToShow = config.scheduling.daysToShow || 14;
    for (let i = 0; i < daysToShow; i++) {
      const d = addDays(first, i);
      const opt = document.createElement("option");
      opt.value = fmtDate(d);
      opt.textContent = `${prettyDate(d)} (${fmtDate(d)})`;
      dateSelect.appendChild(opt);
    }

    timeSelect.innerHTML = "";
    (config.scheduling.timeSlots || []).forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.textContent = t;
      timeSelect.appendChild(opt);
    });
  }
  renderDates();

  function selectedUrgencyName() {
    const id = urgencySelect.value;
    const u = (config.urgency || []).find((x) => x.id === id);
    return u ? u.name : "Standard";
  }

  function compileDispatch(data) {
    // Minimal, scheduling-only. WooCommerce handles pricing/options.
    return (
`DISPATCH REQUEST — Commercial Bathroom Cleaning

Deposit: CUSTOMER CONFIRMS PAID

Urgency: ${data.urgency}

Requested Window:
Date: ${data.date}
Time: ${data.time}

Business Type: ${data.biz_type}

Service Address:
${data.address}

On-site Contact:
Name: ${data.name}
Phone: ${data.customer_phone}
Email: ${data.customer_email}

Access / Notes:
${data.notes}`
    );
  }

  function makeSMSLink(phoneE164, body) {
    const encoded = encodeURIComponent(body);
    return `sms:${phoneE164}?&body=${encoded}`;
  }

  function makeMailto(email, subject, body) {
    return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  function build() {
    const requiredOk =
      (address.value || "").trim().length >= 8 &&
      (contactName.value || "").trim().length >= 2 &&
      (contactPhone.value || "").trim().length >= 7 &&
      (contactEmail.value || "").includes("@") &&
      depositConfirm.checked;

    const payload = compileDispatch({
      urgency: selectedUrgencyName(),
      date: dateSelect.value,
      time: timeSelect.value,
      biz_type: bizTypeSelect.value,
      address: (address.value || "").trim() || "—",
      name: (contactName.value || "").trim() || "—",
      customer_phone: (contactPhone.value || "").trim() || "—",
      customer_email: (contactEmail.value || "").trim() || "—",
      notes: (notes.value || "").trim() || "None"
    });

    const smsHref = makeSMSLink(config.business.phone_e164, payload);
    const mailHref = makeMailto(config.business.email, "Dispatch Request — Commercial Bathroom Cleaning", payload);

    sendTextBtn.disabled = !requiredOk;
    sendTextBtnSticky.disabled = !requiredOk;

    sendTextBtn.dataset.sms = smsHref;
    sendTextBtnSticky.dataset.sms = smsHref;

    emailBtn.href = mailHref;
    emailBtn.setAttribute("aria-disabled", String(!requiredOk));
    emailBtn.style.pointerEvents = requiredOk ? "auto" : "none";
    emailBtn.style.opacity = requiredOk ? "1" : "0.45";

    if (requiredOk) {
      readyChip.textContent = "Ready";
      readyChip.classList.add("chip--live");
      readySub.textContent = "You’re ready. Tap Send to request dispatch now.";
      stickySub.textContent = "Ready. Tap Send to request dispatch.";
    } else {
      readyChip.textContent = "Not ready";
      readyChip.classList.remove("chip--live");
      readySub.textContent = "Pay deposit + confirm checkbox + fill required fields to unlock Send.";
      stickySub.textContent = "Pay deposit + confirm + fill required fields.";
    }