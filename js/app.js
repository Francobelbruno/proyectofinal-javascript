const state = {
products: [],
filt: [],
cart: JSON.parse(localStorage.getItem('cart') || '[]'),
currency: localStorage.getItem('currency') || 'ARS',
rates: { ARS: 1, USD: 0.001 },
};


const els = {
grid: () => document.getElementById('grid'),
q: () => document.getElementById('q'),
category: () => document.getElementById('category'),
currency: () => document.getElementById('currency'),
cartCount: () => document.getElementById('cartCount'),
cartModal: () => document.getElementById('cartModal'),
cartItems: () => document.getElementById('cartItems'),
btnCart: () => document.getElementById('btnCart'),
closeCart: () => document.getElementById('closeCart'),
goCheckout: () => document.getElementById('goCheckout'),
checkoutForm: () => document.getElementById('checkoutForm'),
subtotal: () => document.getElementById('subtotal'),
shipping: () => document.getElementById('shipping'),
discount: () => document.getElementById('discount'),
grandTotal: () => document.getElementById('grandTotal'),
btnClearCart: () => document.getElementById('btnClearCart'),
name: () => document.getElementById('name')
}

async function fetchProducts() {
  const res = await fetch('data/products.json');
  const products = await res.json();
  state.products = products;
  state.filtros = products;
  renderProducts();
  renderCategories();
}

function renderProducts() {
  const grid = els.grid();
  grid.innerHTML = '';
  state.filtros.forEach(product => {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
      <img src="${product.img}" class="card__img" alt="${product.title}">
      <div class="card__title">${product.title}</div>
      <div class="card__price">${formatPrice(product.price)}</div>
      <div class="card__footer d-flex align-items-center gap-2">
        <input type="number" min="1" value="1" class="form-control form-control-sm qty-input" style="width:70px" id="qty-${product.id}">
        <button class="btn btn--primary" data-id="${product.id}">Agregar</button>
      </div>
    `;
    grid.appendChild(div);
  });

  // Evento para cada botón Agregar
  grid.querySelectorAll('.btn--primary').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = Number(btn.getAttribute('data-id'));
      const qtyInput = document.getElementById(`qty-${id}`);
      const qty = Math.max(1, parseInt(qtyInput.value) || 1);
      addToCart(id, qty);
    });
  });
}

function renderCategories() {
  const select = els.category();
  const categories = [...new Set(state.products.map(p => p.category))];
  select.innerHTML = `<option value="">Todas las categorías</option>` +
    categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
}

function formatPrice(price) {
  return state.currency === 'USD'
    ? `$${(price * state.rates.USD).toFixed(2)} USD`
    : `$${price.toLocaleString()} ARS`;
}

// Llama a fetchProducts al cargar la página
document.addEventListener('DOMContentLoaded', fetchProducts);

els.q().addEventListener('input', () => {
  const q = els.q().value.toLowerCase();
  state.filtros = state.products.filter(p =>
    p.title.toLowerCase().includes(q)
  );
  renderProducts();
});

els.category().addEventListener('change', () => {
  const cat = els.category().value;
  state.filtros = cat
    ? state.products.filter(p => p.category === cat)
    : state.products;
  renderProducts();
});

function addToCart(id, qty = 1) {
  const item = state.cart.find(i => i.id === id);
  if (item) {
    item.qty += qty;
  } else {
    state.cart.push({ id, qty });
  }
  localStorage.setItem('cart', JSON.stringify(state.cart));
  updateCartCount();
  Toastify({ text: "Producto agregado al carrito", duration: 1500, gravity: "top", position: "right", backgroundColor: "#22c55e" }).showToast();
}

function updateCartCount() {
  els.cartCount().textContent = state.cart.reduce((acc, item) => acc + item.qty, 0);
}

document.addEventListener('DOMContentLoaded', updateCartCount);

function renderCart() {
  const cartItems = els.cartItems();
  if (!state.cart.length) {
    cartItems.innerHTML = '<p>El carrito está vacío.</p>';
    els.goCheckout().disabled = true;
    return;
  }
  els.goCheckout().disabled = false;
  cartItems.innerHTML = state.cart.map(item => {
    const prod = state.products.find(p => p.id === item.id);
    return `
      <div class="cart-item align-items-center">
        <img src="${prod.img}" alt="${prod.title}" width="64" height="48">
        <div>
          <div class="cart-item__title">${prod.title}</div>
          <div class="cart-item__meta d-flex align-items-center gap-2">
            <button class="btn btn-sm btn-secondary btn-qty" data-action="decrease" data-id="${item.id}">–</button>
            <span>${item.qty}</span>
            <button class="btn btn-sm btn-secondary btn-qty" data-action="increase" data-id="${item.id}">+</button>
          </div>
        </div>
        <div>
          <strong>${formatPrice(prod.price * item.qty)}</strong>
          <button class="btn btn-sm btn-danger ms-2 btn-remove" data-id="${item.id}" title="Eliminar"><i class="bi bi-trash"></i></button>
        </div>
      </div>
    `;
  }).join('');

  // Eventos para +, -, eliminar
  cartItems.querySelectorAll('.btn-qty').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = Number(btn.getAttribute('data-id'));
      const action = btn.getAttribute('data-action');
      const item = state.cart.find(i => i.id === id);
      if (action === 'increase') {
        item.qty += 1;
      } else if (action === 'decrease' && item.qty > 1) {
        item.qty -= 1;
      }
      localStorage.setItem('cart', JSON.stringify(state.cart));
      updateCartCount();
      renderCart();
    });
  });

  cartItems.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = Number(btn.getAttribute('data-id'));
      state.cart = state.cart.filter(i => i.id !== id);
      localStorage.setItem('cart', JSON.stringify(state.cart));
      updateCartCount();
      renderCart();
    });
  });
}

function openCart() {
  renderCart();
  const modal = new bootstrap.Modal(els.cartModal());
  modal.show();
}

function closeCart() {
  const modalEl = els.cartModal();
  const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
  modal.hide();
}

els.btnCart().addEventListener('click', openCart);
els.closeCart().addEventListener('click', closeCart);

// Vaciar carrito
els.btnClearCart().addEventListener('click', () => {
  Swal.fire({
    title: '¿Vaciar carrito?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, vaciar',
    cancelButtonText: 'Cancelar'
  }).then(result => {
    if (result.isConfirmed) {
      state.cart = [];
      localStorage.setItem('cart', JSON.stringify(state.cart));
      updateCartCount();
      renderCart();
      Toastify({ text: "Carrito vaciado", duration: 1500, backgroundColor: "#ef4444" }).showToast();
    }
  });
});

// Confirmar compra
els.goCheckout().addEventListener('click', () => {
  if (!state.cart.length) {
    Swal.fire('El carrito está vacío', '', 'info');
    return;
  }
  Swal.fire({
    title: '¡Gracias por la compra!',
    text: 'Nos comunicaremos brevemente.',
    icon: 'success'
  });
  state.cart = [];
  localStorage.setItem('cart', JSON.stringify(state.cart));
  updateCartCount();
  renderCart();
  closeCart();
});

//TEMA OSCURO Y CLARO

document.addEventListener('DOMContentLoaded', () => {
  const themeBtn = document.getElementById('toggleTheme');
  const themeIcon = document.getElementById('themeIcon');
  const body = document.body; // <-- CAMBIA html por body

  if (localStorage.getItem('theme') === 'light') {
    body.setAttribute('data-bs-theme', 'light');
    themeIcon.classList.remove('bi-moon');
    themeIcon.classList.add('bi-sun');
  } else {
    body.setAttribute('data-bs-theme', 'dark');
    themeIcon.classList.remove('bi-sun');
    themeIcon.classList.add('bi-moon');
  }

  themeBtn.addEventListener('click', () => {
    const current = body.getAttribute('data-bs-theme');
    if (current === 'dark') {
      body.setAttribute('data-bs-theme', 'light');
      themeIcon.classList.remove('bi-moon');
      themeIcon.classList.add('bi-sun');
      localStorage.setItem('theme', 'light');
    } else {
      body.setAttribute('data-bs-theme', 'dark');
      themeIcon.classList.remove('bi-sun');
      themeIcon.classList.add('bi-moon');
      localStorage.setItem('theme', 'dark');
    }
  });
});