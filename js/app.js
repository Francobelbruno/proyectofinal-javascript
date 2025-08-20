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
      <div class="card__footer">
        <button class="btn btn--primary" onclick="addToCart(${product.id})">Agregar</button>
      </div>
    `;
    grid.appendChild(div);
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

function addToCart(id) {
  const item = state.cart.find(i => i.id === id);
  if (item) {
    item.qty += 1;
  } else {
    state.cart.push({ id, qty: 1 });
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
    return;
  }
  cartItems.innerHTML = state.cart.map(item => {
    const prod = state.products.find(p => p.id === item.id);
    return `
      <div class="cart-item">
        <img src="${prod.img}" alt="${prod.title}" width="64" height="48">
        <div>
          <div class="cart-item__title">${prod.title}</div>
          <div class="cart-item__meta">${item.qty} x ${formatPrice(prod.price)}</div>
        </div>
        <div><strong>${formatPrice(prod.price * item.qty)}</strong></div>
      </div>
    `;
  }).join('');
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
    title: '¡Compra confirmada!',
    text: 'Gracias por tu compra. Pronto recibirás un email con los detalles.',
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