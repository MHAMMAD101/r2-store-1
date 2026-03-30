// ===== R2 STORE - Main JavaScript File =====

const API_URL = 'http://localhost:3000/api';

let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
let token = localStorage.getItem('token');
let categories = [];

document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    updateUI();
});

// ===== API Request =====
async function apiRequest(endpoint, options = {}) {
    const headers = { ...options.headers };
    
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }
    
    if (token) {
        headers['Authorization'] = 'Bearer ' + token;
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || 'Request failed');
    }
    
    return data;
}

// ===== UI Updates =====
function updateUI() {
    const authBtn = document.getElementById('authBtn');
    const userName = document.getElementById('userName');
    const adminBtn = document.getElementById('adminPanelBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (currentUser) {
        if (userName) userName.textContent = currentUser.name;
        if (adminBtn) {
            adminBtn.style.display = currentUser.isAdmin ? 'inline-flex' : 'none';
        }
        if (authBtn) authBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-flex';
    } else {
        if (userName) userName.textContent = 'دخول';
        if (adminBtn) adminBtn.style.display = 'none';
        if (authBtn) authBtn.style.display = 'inline-flex';
        if (logoutBtn) logoutBtn.style.display = 'none';
    }
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    document.querySelectorAll('#cartCount').forEach(el => {
        if (el) el.textContent = count;
    });
}

// ===== Cart Functions =====
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

function addToCart(id, title, price, icon = '📦') {
    const existing = cart.find(item => item.id === id);
    
    if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
    } else {
        cart.push({ id, title, price, quantity: 1, icon });
    }
    
    saveCart();
    renderCartItems();
    alert('✅ تم الإضافة للسلة!');
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    renderCartItems();
}

function updateCartQuantity(id, change) {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity = (item.quantity || 1) + change;
        if (item.quantity <= 0) {
            removeFromCart(id);
        } else {
            saveCart();
            renderCartItems();
        }
    }
}

function renderCartItems() {
    const container = document.getElementById('cartItems');
    const totalEl = document.getElementById('cartTotal');
    if (!container) return;
    
    if (cart.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text-muted);"><i class="fas fa-shopping-cart" style="font-size:3rem;margin-bottom:1rem;"></i><p>السلة فارغة</p></div>';
        if (totalEl) totalEl.textContent = '0 ر.س';
        return;
    }
    
    let total = 0;
    let html = '';
    cart.forEach(item => {
        const itemTotal = item.price * (item.quantity || 1);
        total += itemTotal;
        html += `<div style="display:flex;gap:1rem;padding:1rem;background:var(--bg-dark);border-radius:12px;margin-bottom:1rem;border:1px solid var(--border);">
            <div style="width:60px;height:60px;background:var(--bg-hover);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;">${item.icon || '📦'}</div>
            <div style="flex:1;">
                <div style="font-weight:700;margin-bottom:0.3rem;">${item.title}</div>
                <div style="color:var(--primary);font-weight:700;">${item.price} ر.س × ${item.quantity || 1}</div>
                <div style="margin-top:0.5rem;">
                    <button class="btn btn-sm" onclick="updateCartQuantity(${item.id}, -1)" style="padding:0.25rem 0.5rem;margin:0 0.25rem;">-</button>
                    <span style="margin:0 0.5rem;">${item.quantity || 1}</span>
                    <button class="btn btn-sm" onclick="updateCartQuantity(${item.id}, 1)" style="padding:0.25rem 0.5rem;margin:0 0.25rem;">+</button>
                    <button class="btn btn-danger btn-sm" onclick="removeFromCart(${item.id})" style="margin-right:0.5rem;padding:0.25rem 0.5rem;"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            <div style="font-weight:700;color:var(--primary);align-self:center;">${itemTotal} ر.س</div>
        </div>`;
    });
    container.innerHTML = html;
    if (totalEl) totalEl.textContent = total.toFixed(2) + ' ر.س';
}

function toggleCart() {
    const sidebar = document.getElementById('cartSidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
        if (sidebar.classList.contains('active')) {
            renderCartItems();
        }
    }
}

// ===== Auth Functions =====
async function login() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        alert('⚠️ املأ جميع الحقول');
        return;
    }
    
    try {
        const data = await apiRequest('/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        currentUser = data.user;
        token = data.token;
        
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        localStorage.setItem('token', token);
        
        closeModal('authModal');
        updateUI();
        alert(`👋 أهلاً ${currentUser.name}!`);
        
        if (currentUser.isAdmin) {
            alert('🎛️ لديك صلاحيات مسؤول');
        }
        
    } catch (error) {
        alert('❌ فشل تسجيل الدخول: ' + error.message);
    }
}

async function register() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const phone = document.getElementById('regPhone').value.trim();
    
    if (!name || !email || !password) {
        alert('⚠️ املأ جميع الحقول المطلوبة');
        return;
    }
    
    try {
        const data = await apiRequest('/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password, phone })
        });
        
        currentUser = data.user;
        token = data.token;
        
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        localStorage.setItem('token', token);
        
        closeModal('authModal');
        updateUI();
        alert('✅ تم التسجيل بنجاح!');
        
    } catch (error) {
        alert('❌ فشل التسجيل: ' + error.message);
    }
}

function logout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        currentUser = null;
        token = null;
        updateUI();
        window.location.reload();
    }
}

function showAuthModal() {
    document.getElementById('authModal').classList.add('active');
    showLogin();
}

function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('authTitle').textContent = 'تسجيل الدخول';
}

function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('authTitle').textContent = 'تسجيل حساب جديد';
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
};

// ===== Utility Functions =====
function getBadgeText(badge) {
    const badges = { 'new': 'جديد', 'discount': 'خصم', 'popular': 'الأكثر مبيعاً' };
    return badges[badge] || badge;
}

function getCategoryName(slug) {
    const names = { 'templates': 'قوالب', 'ebooks': 'كتب', 'software': 'برمجيات', 'graphics': 'تصاميم', 'courses': 'دورات' };
    return names[slug] || slug;
}

// ===== Export for debugging =====
window.R2Store = {
    cart,
    wishlist,
    currentUser,
    token,
    apiRequest,
    updateUI,
    updateCartCount,
    addToCart,
    removeFromCart,
    login,
    register,
    logout
};

console.log('%c👋 Welcome to R2 STORE!', 'font-size: 20px; font-weight: bold; color: #6366f1;');