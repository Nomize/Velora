/* script.js — Velora
   Robust handlers: back-to-top, mobile menu, filters, search, lightbox, cart drawer.
   Designed to be safe if certain elements are missing on a page.
*/

document.addEventListener('DOMContentLoaded', () => {
  /* ---------------------------
     Utility helpers
  --------------------------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const byClosest = (el, sel) => el.closest(sel);

  /* ---------------------------
     Back to top
  --------------------------- */
  (function initBackToTop() {
    const btn = $('.back-to-top');
    if (!btn) return;
    window.addEventListener('scroll', () => btn.classList.toggle('show', window.scrollY > 300));
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  })();

  /* ---------------------------
     Mobile menu toggle
  --------------------------- */
  (function initMobileMenu() {
    const toggle = $('.menu-toggle');
    const navLinks = $('.nav-links');
    if (!toggle || !navLinks) return;
    toggle.addEventListener('click', () => navLinks.classList.toggle('show'));
    // Close menu when clicking a link on mobile
    navLinks.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') navLinks.classList.remove('show');
    });
  })();

  /* ---------------------------
     Filters (and expose global filter function)
  --------------------------- */
  (function initFilters() {
    const filterContainer = $('.filters');
    if (!filterContainer) {
      // also expose a no-op filter function so inline calls don't crash
      window.filterProducts = (category) => {};
      return;
    }
    const buttons = $$('[data-filter]', filterContainer);
    const cards = $$('.product-card');

    function applyFilter(category) {
      cards.forEach(card => {
        const cat = card.dataset.category || Array.from(card.classList).find(c => c !== 'product-card' && c !== 'product-info') || '';
        const matches = category === 'all' || cat.toLowerCase().includes(category.toLowerCase()) || card.classList.contains(category);
        card.style.display = matches ? '' : 'none';
      });
    }

    function setActive(btn) {
      buttons.forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
    }

    // attach click handlers
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const category = btn.dataset.filter || btn.textContent.trim().toLowerCase();
        applyFilter(category);
        setActive(btn);
      });
    });

    // allow inline calls like filterProducts('shoes') by exposing global
    window.filterProducts = function(category, evt) {
      const match = buttons.find(b => (b.dataset.filter && b.dataset.filter === category) || b.textContent.trim().toLowerCase() === category.toLowerCase());
      setActive(match || null);
      applyFilter(category);
    };

    // initialize (show all)
    applyFilter('all');
  })();


  /* ---------------------------
     Search
  --------------------------- */
  (function initSearch() {
    const input = $('#search');
    if (!input) return;
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      $$('.product-card').forEach(card => {
        const text = (card.innerText || '').toLowerCase();
        card.style.display = text.includes(q) ? '' : 'none';
      });
    });
  })();


  /* ---------------------------
     Image lightbox (simple)
  --------------------------- */
  (function initLightbox() {
    // target product & gallery images
    const clickable = $$('.product-grid img, .gallery-grid img');
    if (clickable.length === 0) return;

    // build modal if not present
    let modal = $('.vl-modal') || null;
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'vl-modal';
      modal.innerHTML = `
        <div class="vl-modal-inner" role="dialog" aria-modal="true">
          <button class="vl-modal-close" aria-label="Close">×</button>
          <button class="vl-modal-prev" aria-label="Previous">‹</button>
          <img class="vl-modal-img" src="" alt="Preview">
          <button class="vl-modal-next" aria-label="Next">›</button>
        </div>
      `;
      document.body.appendChild(modal);
    }

    const imgEl = modal.querySelector('.vl-modal-img');
    const btnClose = modal.querySelector('.vl-modal-close');
    const btnPrev = modal.querySelector('.vl-modal-prev');
    const btnNext = modal.querySelector('.vl-modal-next');

    let idx = 0;
    function open(i) {
      idx = i;
      imgEl.src = clickable[idx].src;
      imgEl.alt = clickable[idx].alt || 'Preview';
      modal.classList.add('show');
      modal.setAttribute('aria-hidden', 'false');
    }
    function close() { modal.classList.remove('show'); modal.setAttribute('aria-hidden', 'true'); }
    function prev() { idx = (idx <= 0) ? clickable.length - 1 : idx - 1; imgEl.src = clickable[idx].src; }
    function next() { idx = (idx >= clickable.length - 1) ? 0 : idx + 1; imgEl.src = clickable[idx].src; }

    clickable.forEach((el, i) => {
      el.style.cursor = 'zoom-in';
      el.addEventListener('click', () => open(i));
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target === btnClose) close();
    });
    btnPrev.addEventListener('click', (e) => { e.stopPropagation(); prev(); });
    btnNext.addEventListener('click', (e) => { e.stopPropagation(); next(); });

    document.addEventListener('keydown', (e) => {
      if (!modal.classList.contains('show')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    });
  })();


  /* ---------------------------
     Cart system (persistent)
  --------------------------- */
  (function initCart() {
    // locate or create cart-count button
    let cartBtn = $('.cart-count') || $('.cart-count') || $('.cart-count') || $('button.cart-count');
    const nav = $('.header-inner') || $('.navbar') || $('.site-header');
    if (!cartBtn && nav) {
      cartBtn = document.createElement('button');
      cartBtn.className = 'cart-count';
      cartBtn.title = 'Cart';
      cartBtn.textContent = '0';
      // append to nav (end)
      const ul = nav.querySelector('.nav-links');
      if (ul) {
        const li = document.createElement('li');
        li.appendChild(cartBtn);
        ul.appendChild(li);
      } else {
        nav.appendChild(cartBtn);
      }
    }

    // create cart drawer if not present
    let drawer = $('.cart-drawer');
    if (!drawer) {
      drawer = document.createElement('aside');
      drawer.className = 'cart-drawer';
      drawer.innerHTML = `
        <button class="cart-close" aria-label="Close cart">×</button>
        <h3>Your Cart</h3>
        <div class="cart-items"></div>
        <div class="cart-footer">
          <div class="cart-subtotal">Subtotal: <strong>$<span class="subtotal">0</span></strong></div>
          <div style="margin-top:8px;">
            <button class="checkout-btn btn">Checkout</button>
          </div>
        </div>
      `;
      document.body.appendChild(drawer);
    }
    const cartItemsEl = drawer.querySelector('.cart-items');
    const subtotalEl = drawer.querySelector('.subtotal');
    const cartClose = drawer.querySelector('.cart-close');

    // load cart from storage
    let cart = JSON.parse(localStorage.getItem('velora_cart') || '[]');

    function save() { localStorage.setItem('velora_cart', JSON.stringify(cart)); }

    function computeTotals() {
      let count = 0, total = 0;
      cart.forEach(it => { count += (it.qty || 1); total += (Number(it.price || 0) * (it.qty || 1)); });
      return { count, total };
    }

    function updateCartUI() {
      const { count, total } = computeTotals();
      if (cartBtn) cartBtn.textContent = count;
      subtotalEl.textContent = Number(total || 0).toFixed(2);
      // render items
      cartItemsEl.innerHTML = '';
      cart.forEach((it, idx) => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
          <img src="${it.img || ''}" alt="${it.name || 'Item'}" />
          <div class="ci-info">
            <strong>${it.name}</strong>
            <div class="ci-meta">₦${it.price || 0} × <input class="ci-qty" data-index="${idx}" type="number" min="1" value="${it.qty || 1}"></div>
            <button class="ci-remove" data-index="${idx}">Remove</button>
          </div>
        `;
        cartItemsEl.appendChild(div);
      });
      save();
    }

    function addToCart(product) {
      // product: { id?, name, price, img }
      // find same item by name+price (simple)
      let existing = cart.find(i => i.name === product.name && String(i.price) === String(product.price));
      if (existing) {
        existing.qty = (existing.qty || 1) + 1;
      } else {
        cart.push({ id: product.id || Date.now().toString(36), name: product.name || 'Item', price: product.price || 0, img: product.img || '', qty: 1 });
      }
      updateCartUI();
    }

    // open/close drawer
    if (cartBtn) cartBtn.addEventListener('click', () => drawer.classList.toggle('open'));
    if (cartClose) cartClose.addEventListener('click', () => drawer.classList.remove('open'));

    // listen for remove/qty change
    cartItemsEl.addEventListener('click', (e) => {
      if (e.target.classList.contains('ci-remove')) {
        const idx = Number(e.target.dataset.index);
        if (!Number.isNaN(idx)) cart.splice(idx, 1);
        updateCartUI();
      }
    });
    cartItemsEl.addEventListener('input', (e) => {
      if (e.target.classList.contains('ci-qty')) {
        const idx = Number(e.target.dataset.index);
        let val = parseInt(e.target.value, 10);
        if (Number.isNaN(val) || val < 1) val = 1;
        if (!Number.isNaN(idx) && cart[idx]) {
          cart[idx].qty = val;
          updateCartUI();
        }
      }
    });

    // attach add-to-cart to all buttons (safe attach)
    $$('.add-to-cart').forEach(btn => {
      btn.addEventListener('click', (e) => {
        // prefer data-* attributes, otherwise infer from DOM
        const card = byClosest(btn, '.product-card');
        const name = btn.dataset.name || card?.querySelector('h3')?.innerText?.trim() || 'Item';
        let price = btn.dataset.price ?? card?.querySelector('.price')?.innerText?.replace(/[^0-9.]/g, '') ?? '0';
        price = Number(price || 0);
        const img = btn.dataset.img || card?.querySelector('img')?.src || '';
        addToCart({ name, price, img });
        // visual feedback
        btn.classList.add('added');
        setTimeout(() => btn.classList.remove('added'), 700);
      });
    });

    // initialize UI
    updateCartUI();
  })();

  /* ---------------------------
   Optional: form validation + success toast
--------------------------- */
(function initFormValidation() {
  const form = document.querySelector('#contact-form');
  if (!form) return;

  // Create toast container if not already present
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    // Show animation
    setTimeout(() => toast.classList.add('show'), 50);

    // Hide after 3s
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 500);
    }, 3000);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = form.querySelector('input[type="email"]');
    const name = form.querySelector('input[type="text"]');
    const msg = form.querySelector('textarea');
    const errors = [];

    if (name && name.value.trim().length < 2) errors.push('Please enter your name.');
    if (email && !/^[^@]+@[^@]+\.[^@]+$/.test(email.value.trim())) errors.push('Please enter a valid email.');
    if (msg && msg.value.trim().length < 5) errors.push('Please enter a message.');

    if (errors.length) {
      showToast(errors.join('\n'), 'error');
      return false;
    }

    // ✅ Success
    showToast('✅ Message sent successfully!', 'success');
    form.reset();
 });
  })();

}); //