/*
  YES Foundation website: live text from Google Sheets.

  The page loads with its own built-in text. This script then reads the
  "Website text" tab of the Google Sheet and swaps in whatever is in the
  yellow column (C), matched by the key in column D.

  The Sheet must be shared as "Anyone with the link: Viewer".
  If the Sheet ever moves, change SHEET_ID below (the long code in its link).
  If the Sheet can't be reached, the page simply keeps its built-in text.
*/
(function () {
  var SHEET_ID = "1cPMaugl0LW3UQCwSvxE_7Vz9poFufptgdT5hrJVKPU0";
  var SHEET_TAB = "Website text";
  var SHEET_URL =
    "https://docs.google.com/spreadsheets/d/" + SHEET_ID +
    "/gviz/tq?tqx=out:csv&headers=0&sheet=" + encodeURIComponent(SHEET_TAB) +
    "&t=" + Math.floor(Date.now() / 60000); // refresh at most once a minute per visitor

  /* ---------- small helpers ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  // Text with [square brackets] keeps the dashed "placeholder" look.
  function addText(el, text) {
    text.split(/(\[[^\]]*\])/).forEach(function (part) {
      if (!part) return;
      if (/^\[[^\]]*\]$/.test(part)) {
        var s = document.createElement("span");
        s.className = "ph";
        s.textContent = part;
        el.appendChild(s);
      } else {
        el.appendChild(document.createTextNode(part));
      }
    });
  }

  // Replace an element's text. Keeps icons (svg) at the end, keeps the
  // italic phrase if the new text still contains it, and turns *word* into italics.
  function fill(el, value) {
    if (!el || value == null) return;
    if (el.classList.contains("ph")) { // a placeholder slot: drop the dashed look once it's filled in
      el.classList.toggle("ph", /^\[[^\]]*\]$/.test(value));
      el.textContent = value;
      return;
    }
    var icons = $$(":scope > svg", el);
    var em = el.querySelector("em");
    var emText = em ? em.textContent.trim() : "";
    var emClass = em ? em.className : "";
    el.textContent = "";

    function addEm(t) {
      var e = document.createElement("em");
      if (emClass) e.className = emClass;
      e.textContent = t;
      el.appendChild(e);
    }

    if (/\*[^*]+\*/.test(value)) {
      value.split(/\*([^*]+)\*/).forEach(function (p, i) { i % 2 ? addEm(p) : addText(el, p); });
    } else if (emText && value.indexOf(emText) > -1) {
      var i = value.indexOf(emText);
      addText(el, value.slice(0, i));
      addEm(emText);
      addText(el, value.slice(i + emText.length));
    } else {
      addText(el, value);
    }
    icons.forEach(function (svg) { el.appendChild(document.createTextNode(" ")); el.appendChild(svg); });
  }

  function list(value) {
    return value.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function setLink(a, url) {
    if (!a || !/^https?:\/\//i.test(url || "")) return;
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
  }

  // Numbers like "1,00,000+" keep the count-up animation.
  function fillNumber(el, value) {
    if (!el) return;
    var m = value.match(/^([\d,]+)(.*)$/);
    if (m) {
      el.dataset.count = m[1].replace(/,/g, "");
      el.dataset.suffix = m[2];
    } else {
      delete el.dataset.count;
    }
    el.textContent = value;
  }

  /* ---------- CSV from Google Sheets ---------- */
  function parseCSV(t) {
    var rows = [], row = [], f = "", q = false;
    for (var i = 0; i < t.length; i++) {
      var c = t[i];
      if (q) {
        if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else { q = false; } }
        else f += c;
      } else if (c === '"') q = true;
      else if (c === ",") { row.push(f); f = ""; }
      else if (c === "\n") { row.push(f); rows.push(row); row = []; f = ""; }
      else if (c !== "\r") f += c;
    }
    if (f || row.length) { row.push(f); rows.push(row); }
    return rows;
  }

  function toMap(rows) {
    var map = {};
    rows.forEach(function (r) {
      var key = (r[3] || "").trim(), val = (r[2] || "").trim();
      if (/^[a-z0-9_]+$/.test(key) && val) map[key] = val;
    });
    return map;
  }

  /* ---------- put the Sheet's text on the page ---------- */
  function apply(d) {
    var v = function (k) { return d[k]; };

    // Top strip
    var top = $$(".topbar-row p");
    if (top[0]) {
      var spans = $$(".ph, span", top[0]);
      if (v("top_darpan")) fill(spans[0], v("top_darpan"));
      if (v("top_12a80g")) fill(spans[1], v("top_12a80g"));
    }
    if (top[1] && (v("contact_email") || v("contact_area"))) {
      top[1].textContent = "";
      addText(top[1], (v("contact_email") || "") + (v("contact_email") && v("contact_area") ? " · " : "") + (v("contact_area") || ""));
    }

    // Hero
    if (v("hero_tag")) fill($(".eyebrow-pill > span:last-child"), v("hero_tag"));
    if (v("hero_headline")) {
      var h = $("#hero-title"), pill = h && $(".pill", h), sc = h && $(".scribble", h), line = sc && $("svg", sc);
      var words = v("hero_headline").split(/\s+/);
      if (h && pill && sc && words.length >= 4) {
        var last = words.pop(), first = words.splice(0, 2).join(" ");
        h.textContent = "";
        h.append(first + " ", pill, " " + words.join(" ") + " ");
        sc.textContent = last;
        if (line) sc.appendChild(line);
        h.appendChild(sc);
      } else if (h) {
        h.textContent = v("hero_headline");
      }
    }
    if (v("hero_intro")) fill($(".hero .lede"), v("hero_intro"));
    var heroBtns = $$(".hero-actions .btn");
    if (v("hero_btn1")) fill(heroBtns[0], v("hero_btn1"));
    if (v("hero_btn2")) fill(heroBtns[1], v("hero_btn2"));
    if (v("hero_partners")) {
      var hp = $(".hero-partners");
      if (hp) {
        hp.textContent = "Partners include ";
        list(v("hero_partners")).forEach(function (name, i) {
          if (i) { var dot = document.createElement("span"); dot.className = "dot"; dot.setAttribute("aria-hidden", "true"); hp.appendChild(dot); }
          var b = document.createElement("b"); b.textContent = name; hp.appendChild(b);
        });
      }
    }
    if (v("hero_sticker_number")) fill($(".sticker strong"), v("hero_sticker_number"));
    if (v("hero_sticker_text")) fill($(".sticker span"), v("hero_sticker_text"));
    if (v("hero_photo_caption")) {
      var cap = $(".mini-photo figcaption"), parts = v("hero_photo_caption").split(/\s*·\s*/);
      if (cap) {
        var cs = $$("span", cap);
        if (parts.length > 1 && cs.length > 1) { cs[0].textContent = parts[0]; cs[1].textContent = parts.slice(1).join(" · "); }
        else cap.textContent = v("hero_photo_caption");
      }
    }

    // Values band (repeated in the moving strip)
    $$(".band-main .mq-group").forEach(function (g) {
      var hi = $$(".hi", g), en = $$(".en", g);
      for (var i = 0; i < 4; i++) {
        if (v("value_" + (i + 1) + "_hi") && hi[i]) hi[i].textContent = v("value_" + (i + 1) + "_hi");
        if (v("value_" + (i + 1) + "_en") && en[i]) en[i].textContent = v("value_" + (i + 1) + "_en");
      }
    });

    // Impact numbers
    if (v("impact_tag")) fill($("#impact .eyebrow"), v("impact_tag"));
    if (v("impact_heading")) fill($("#impact-title"), v("impact_heading"));
    $$(".stat").forEach(function (s, i) {
      var n = i + 1;
      if (v("stat_" + n + "_number")) fillNumber($(".stat-num", s), v("stat_" + n + "_number"));
      if (v("stat_" + n + "_label")) fill($(".stat-label", s), v("stat_" + n + "_label"));
      if (v("stat_" + n + "_desc")) fill($(".stat-desc", s), v("stat_" + n + "_desc"));
    });

    // Our approach
    if (v("approach_tag")) fill($("#approach .eyebrow"), v("approach_tag"));
    if (v("approach_heading")) fill($("#approach-title"), v("approach_heading"));
    if (v("approach_caption")) fill($(".tees figcaption span:last-child"), v("approach_caption"));
    if (v("approach_link")) fill($("#approach .text-link"), v("approach_link"));
    $$(".pillar").forEach(function (p, i) {
      var n = i + 1;
      if (v("approach_" + n + "_title")) fill($("h3", p), v("approach_" + n + "_title"));
      if (v("approach_" + n + "_text")) fill($("p", p), v("approach_" + n + "_text"));
    });

    // Areas of focus
    if (v("focus_tag")) fill($("#work .eyebrow"), v("focus_tag"));
    if (v("focus_heading")) fill($("#focus-title"), v("focus_heading"));
    $$(".focus-card").forEach(function (c, i) {
      var n = i + 1;
      if (v("focus_" + n + "_tag")) fill($(".chip", c), v("focus_" + n + "_tag"));
      if (v("focus_" + n + "_title")) fill($("h3", c), v("focus_" + n + "_title"));
      if (v("focus_" + n + "_text")) fill($("p", c), v("focus_" + n + "_text"));
    });

    // Stories
    if (v("stories_tag")) fill($("#stories .titles .eyebrow"), v("stories_tag"));
    if (v("stories_heading")) fill($("#stories-title"), v("stories_heading"));
    var tabs = $$(".story-tab"), panels = $$(".story-panel");
    for (var s = 0; s < 3; s++) {
      var n = s + 1, name = v("story_" + n + "_name"), tab = tabs[s], panel = panels[s];
      if (tab && name) fill($("strong", tab), name);
      if (tab && v("story_" + n + "_tab")) fill($("small", tab), v("story_" + n + "_tab"));
      if (!panel) continue;
      if (v("story_" + n + "_place")) fill($(".story-text .eyebrow", panel), v("story_" + n + "_place"));
      if (v("story_" + n + "_text")) fill($(".story-quote", panel), v("story_" + n + "_text"));
      if (name) {
        fill($(".story-photo figcaption", panel), name + "’s story");
        fill($(".story-text .text-link", panel), "Read " + name + "’s story");
      }
    }

    // Partners
    if (v("partners_heading")) fill($("#partners-title"), v("partners_heading"));
    if (v("partners_note")) fill($("#partners .section-note"), v("partners_note"));
    [["partners_list", ".partner-wall"], ["member_of_list", ".member-of .pills"]].forEach(function (pair) {
      var ul = $(pair[1]);
      if (!ul || !v(pair[0])) return;
      ul.textContent = "";
      list(v(pair[0])).forEach(function (name) { var li = document.createElement("li"); li.textContent = name; ul.appendChild(li); });
    });

    // Reports
    if (v("reports_heading")) fill($("#reports-title"), v("reports_heading"));
    $$(".folder").forEach(function (f, i) {
      var n = i + 1;
      if (v("report_" + n + "_tag")) fill($(".folder-tab", f), v("report_" + n + "_tag"));
      if (v("report_" + n + "_title")) fill($(".folder-title", f), v("report_" + n + "_title"));
      if (v("report_" + n + "_text")) fill($(".folder-desc", f), v("report_" + n + "_text"));
      if (v("report_" + n + "_link")) fill($(".folder-cta", f), v("report_" + n + "_link"));
      setLink(f, v("report_" + n + "_url"));
    });

    // Call to action
    if (v("cta_heading")) fill($("#cta-title"), v("cta_heading"));
    if (v("cta_text")) fill($(".cta-sub"), v("cta_text"));
    if (v("contact_email")) fill($(".cta-mail span"), v("contact_email"));

    // Footer
    if (v("footer_address")) fill($(".footer-brand p"), v("footer_address"));
    var fb = $$(".footer-bottom p span");
    if (v("footer_registration")) fill(fb[0], v("footer_registration"));
    if (v("top_darpan")) fill(fb[1], v("top_darpan"));
    var social = $$('nav[aria-label="Connect"] a');
    setLink(social[0], v("social_instagram"));
    setLink(social[1], v("social_linkedin"));
    setLink(social[2], v("social_youtube"));
  }

  fetch(SHEET_URL)
    .then(function (r) { if (!r.ok) throw new Error("Sheet returned " + r.status); return r.text(); })
    .then(function (csv) {
      var data = toMap(parseCSV(csv));
      if (Object.keys(data).length) apply(data);
    })
    .catch(function (err) {
      console.warn("[YES] Could not load text from the Google Sheet; showing built-in text.", err);
    });
})();
