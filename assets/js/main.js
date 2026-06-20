/* Wood Fire Pizza Lenuo — main.js (vanilla, guarded) */
(function () {
  "use strict";

  /* Preloader: always hide (max 1.2s fallback) */
  var preloader = document.getElementById("preloader");
  function hidePreloader() {
    if (!preloader) return;
    preloader.classList.add("hide");
    setTimeout(function () { if (preloader) preloader.style.display = "none"; }, 550);
  }
  window.addEventListener("load", function () { setTimeout(hidePreloader, 350); });
  setTimeout(hidePreloader, 1200); // safety fallback

  /* Year */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* Sticky header shrink */
  var header = document.getElementById("siteHeader");
  function onScroll() {
    if (!header) return;
    if (window.scrollY > 40) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* Mobile menu */
  var burger = document.getElementById("burgerBtn");
  var menu = document.getElementById("mobileMenu");
  var menuClose = document.getElementById("menuClose");

  function openMenu() {
    if (!menu) return;
    menu.hidden = false;
    requestAnimationFrame(function () { menu.classList.add("open"); });
    if (burger) burger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }
  function closeMenu() {
    if (!menu) return;
    menu.classList.remove("open");
    if (burger) burger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    setTimeout(function () { if (menu) menu.hidden = true; }, 300);
  }
  if (burger) burger.addEventListener("click", openMenu);
  if (menuClose) menuClose.addEventListener("click", closeMenu);
  if (menu) {
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (menu && menu.classList.contains("open")) closeMenu();
      if (lightbox && !lightbox.hidden) closeLightbox();
    }
  });

  /* Scroll reveal (IntersectionObserver + fallback) */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
    // safety: ensure visible after 2.5s regardless
    setTimeout(function () {
      reveals.forEach(function (el) { el.classList.add("in"); });
    }, 2500);
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* Lightbox */
  var lightbox = document.getElementById("lightbox");
  var lbImg = document.getElementById("lbImg");
  var lbClose = document.getElementById("lbClose");
  function openLightbox(src, alt) {
    if (!lightbox || !lbImg) return;
    lbImg.src = src;
    lbImg.alt = alt || "صورة مكبّرة";
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeLightbox() {
    if (!lightbox) return;
    lightbox.hidden = true;
    if (lbImg) lbImg.src = "";
    document.body.style.overflow = "";
  }
  document.querySelectorAll(".gal-item").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var src = btn.getAttribute("data-full");
      var img = btn.querySelector("img");
      openLightbox(src, img ? img.alt : "");
    });
  });
  if (lbClose) lbClose.addEventListener("click", closeLightbox);
  if (lightbox) lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) closeLightbox();
  });

  /* Toast */
  var toast = document.getElementById("toast");
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.hidden = false;
    requestAnimationFrame(function () { toast.classList.add("show"); });
    setTimeout(function () {
      toast.classList.remove("show");
      setTimeout(function () { if (toast) toast.hidden = true; }, 400);
    }, 4200);
  }

  /* Reservation/order form (demo) */
  var form = document.getElementById("reserveForm");
  var summary = document.getElementById("formSummary");

  function setError(id, msg) {
    var field = document.getElementById(id);
    if (!field) return;
    var wrap = field.closest(".field");
    var err = document.querySelector('.err[data-for="' + id + '"]');
    if (wrap) wrap.classList.toggle("invalid", !!msg);
    if (err) err.textContent = msg || "";
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("rName");
      var phone = document.getElementById("rPhone");
      var guests = document.getElementById("rGuests");
      var date = document.getElementById("rDate");
      var time = document.getElementById("rTime");
      var type = document.getElementById("rType");
      var notes = document.getElementById("rNotes");

      var ok = true;
      ["rName", "rPhone", "rGuests", "rDate", "rTime"].forEach(function (id) { setError(id, ""); });

      if (!name.value.trim()) { setError("rName", "فضلًا اكتب الاسم"); ok = false; }
      var digits = (phone.value || "").replace(/\D/g, "");
      if (digits.length < 9) { setError("rPhone", "رقم جوال غير صحيح"); ok = false; }
      if (!guests.value) { setError("rGuests", "اختر عدد الضيوف"); ok = false; }
      if (!date.value) { setError("rDate", "اختر التاريخ"); ok = false; }
      if (!time.value) { setError("rTime", "اختر الوقت"); ok = false; }

      if (!ok) {
        var firstInvalid = form.querySelector(".field.invalid input, .field.invalid select");
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var btn = document.getElementById("submitBtn");
      if (btn) { btn.disabled = true; btn.textContent = "جارٍ الإرسال..."; }

      var data = {
        name: name.value.trim(),
        phone: phone.value.trim(),
        guests: guests.value,
        date: date.value,
        time: time.value,
        type: type ? type.value : "حجز طاولة",
        notes: notes ? notes.value.trim() : "",
        at: new Date().toISOString()
      };

      try {
        var key = "lenuo_reservations";
        var arr = JSON.parse(localStorage.getItem(key) || "[]");
        arr.push(data);
        localStorage.setItem(key, JSON.stringify(arr));
      } catch (err) { /* storage may be blocked; continue */ }

      setTimeout(function () {
        if (summary) {
          summary.hidden = false;
          summary.innerHTML =
            "<b>تم استلام طلبك (تجريبي):</b><br>" +
            "الاسم: " + escapeHtml(data.name) + "<br>" +
            "الجوال: " + escapeHtml(data.phone) + "<br>" +
            "النوع: " + escapeHtml(data.type) + " · الضيوف: " + escapeHtml(data.guests) + "<br>" +
            "التاريخ: " + escapeHtml(data.date) + " الساعة " + escapeHtml(data.time) +
            (data.notes ? "<br>ملاحظات: " + escapeHtml(data.notes) : "");
        }
        showToast("تم استلام طلبك — سنتواصل معك للتأكيد (عرض تجريبي)");
        form.reset();
        if (btn) { btn.disabled = false; btn.textContent = "أرسل الطلب"; }
      }, 700);
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
})();
