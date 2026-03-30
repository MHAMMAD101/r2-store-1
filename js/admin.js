// ===== R2 STORE - Admin Panel JavaScript =====

const API_URL = 'http://localhost:3000/api';
let token = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
let currentSection = 'dashboard';
let allProducts = [];
let allOrders = [];
let allUsers = [];

// ===== التحقق من الصلاحيات =====
if (!currentUser || !currentUser.isAdmin || !token) {
    alert('🔐 غير مصرح لك بالدخول!');
    window.location.href = 'index.html';
}

// ===== تهيئة الصفحة =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ تهيئة لوحة التحكم');
    console.log('المستخدم:', currentUser);
    
    document.getElementById('adminName').textContent = currentUser.name;
    document.getElementById('adminAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
    loadDashboard();
});

// ===== التنقل بين الأقسام =====
function showSection(sectionName) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.sidebar-menu-link').forEach(l => l.classList.remove('active'));
    
    document.getElementById(sectionName).classList.add('active');
    event.target.closest('.sidebar-menu-link')?.classList.add('active');
    
    const titles = {
        'dashboard': 'لوحة التحكم',
        'products': 'إدارة المنتجات',
        'categories': 'إدارة الفئات',
        'orders': 'إدارة الطلبات',
        'users': 'إدارة المستخدمين',
        'discounts': 'أكواد الخصم',
        'payments': 'طرق الدفع',
        'reviews': 'التقييمات'
    };
    document.getElementById('pageTitle').textContent = titles[sectionName];
    
    switch(sectionName) {
        case 'dashboard': loadDashboard(); break;
        case 'products': loadProducts(); break;
        case 'categories': loadCategories(); break;
        case 'orders': loadOrders(); break;
        case 'users': loadUsers(); break;
        case 'discounts': loadDiscounts(); break;
        case 'payments': loadPayments(); break;
        case 'reviews': loadReviews(); break;
    }
}

// ===== لوحة التحكم =====
async function loadDashboard() {
    try {
        const stats = await apiRequest('/stats');
        document.getElementById('statProducts').textContent = stats.products || 0;
        document.getElementById('statOrders').textContent = stats.orders || 0;
        document.getElementById('statUsers').textContent = stats.users || 0;
        document.getElementById('statRevenue').textContent = (stats.revenue || 0).toFixed(2) + ' $';
        
        document.getElementById('productsCount').textContent = stats.products || 0;
        document.getElementById('ordersCount').textContent = stats.orders || 0;
        
        loadRecentOrders();
    } catch (error) {
        console.error('خطأ في تحميل الإحصائيات:', error);
    }
}

async function loadRecentOrders() {
    try {
        const orders = await apiRequest('/admin/orders');
        const tbody = document.getElementById('recentOrdersTable');
        tbody.innerHTML = orders.slice(0, 5).map(o => `
            <tr>
                <td>#${o.id}</td>
                <td>${o.user_name || 'عميل'}</td>
                <td>${o.total_amount.toFixed(2)} $</td>
                <td><span class="badge badge-success">${o.status || 'مكتمل'}</span></td>
                <td>${new Date(o.created_at).toLocaleDateString('ar-SA')}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('خطأ في تحميل الطلبات:', error);
    }
}

// ===== المنتجات =====
async function loadProducts() {
    try {
        allProducts = await apiRequest('/products');
        const tbody = document.getElementById('productsTable');
        tbody.innerHTML = allProducts.map(p => `
            <tr>
                <td>${p.icon || '📦'} ${p.title}</td>
                <td>${p.category || '-'}</td>
                <td>${p.price} $</td>
                <td>${p.stock || 0}</td>
                <td>${p.sales || 0}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteProduct(${p.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('خطأ في تحميل المنتجات:', error);
    }
}

async function saveProduct(event) {
    event.preventDefault();
    try {
        const formData = new FormData();
        formData.append('title', document.getElementById('p-title').value);
        formData.append('price', document.getElementById('p-price').value);
        formData.append('category', document.getElementById('p-category').value);
        formData.append('icon', document.getElementById('p-icon').value);
        formData.append('badge', document.getElementById('p-badge').value);
        formData.append('description', document.getElementById('p-desc').value);
        formData.append('stock', document.getElementById('p-stock').value);
        
        if (document.getElementById('p-image').files[0]) {
            formData.append('image', document.getElementById('p-image').files[0]);
        }
        
        await apiRequest('/products', { method: 'POST', body: formData });
        
        alert('✅ تم حفظ المنتج');
        closeModal('productModal');
        loadProducts();
        loadDashboard();
    } catch (error) {
        alert('❌ فشل الحفظ: ' + error.message);
    }
}

async function deleteProduct(id) {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    try {
        await apiRequest(`/products/${id}`, { method: 'DELETE' });
        alert('✅ تم حذف المنتج');
        loadProducts();
        loadDashboard();
    } catch (error) {
        alert('❌ فشل الحذف: ' + error.message);
    }
}

function openProductModal() {
    document.getElementById('productModal').classList.add('active');
}

// ===== الفئات =====
async function loadCategories() {
    try {
        const categories = await apiRequest('/categories');
        const tbody = document.getElementById('categoriesTable');
        tbody.innerHTML = categories.map(c => `
            <tr>
                <td>${c.name}</td>
                <td>${c.icon || '📦'}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteCategory(${c.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('خطأ في تحميل الفئات:', error);
    }
}

async function saveCategory(event) {
    event.preventDefault();
    try {
        await apiRequest('/categories', {
            method: 'POST',
            body: JSON.stringify({
                name: document.getElementById('cat-name').value,
                icon: document.getElementById('cat-icon').value
            })
        });
        alert('✅ تم حفظ الفئة');
        closeModal('categoryModal');
        loadCategories();
    } catch (error) {
        alert('❌ فشل الحفظ: ' + error.message);
    }
}

function openCategoryModal() {
    document.getElementById('categoryModal').classList.add('active');
}

async function deleteCategory(id) {
    if (!confirm('هل أنت متأكد من حذف هذه الفئة؟')) return;
    try {
        await apiRequest(`/categories/${id}`, { method: 'DELETE' });
        alert('✅ تم حذف الفئة');
        loadCategories();
    } catch (error) {
        alert('❌ فشل الحذف: ' + error.message);
    }
}

// ===== الطلبات =====
async function loadOrders() {
    try {
        allOrders = await apiRequest('/admin/orders');
        const tbody = document.getElementById('ordersTable');
        tbody.innerHTML = allOrders.map(o => `
            <tr>
                <td>#${o.id}</td>
                <td>${o.user_name || 'عميل'}</td>
                <td>${o.products || '-'}</td>
                <td>${o.total_amount.toFixed(2)} $</td>
                <td>${o.payment_method || '-'}</td>
                <td><span class="badge badge-success">${o.status || 'مكتمل'}</span></td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('خطأ في تحميل الطلبات:', error);
    }
}

// ===== المستخدمين =====
async function loadUsers() {
    try {
        allUsers = await apiRequest('/admin/users');
        const tbody = document.getElementById('usersTable');
        tbody.innerHTML = allUsers.map(u => `
            <tr>
                <td>${u.name}</td>
                <td>${u.email}</td>
                <td>${u.phone || '-'}</td>
                <td><span class="badge ${u.is_admin ? 'badge-success' : 'badge-info'}">${u.is_admin ? 'مدير' : 'عميل'}</span></td>
                <td>${new Date(u.created_at).toLocaleDateString('ar-SA')}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('خطأ في تحميل المستخدمين:', error);
    }
}

// ===== أكواد الخصم =====
async function loadDiscounts() {
    try {
        const codes = await apiRequest('/admin/discount-codes');
        const tbody = document.getElementById('discountsTable');
        tbody.innerHTML = codes.map(c => `
            <tr>
                <td><strong>${c.code}</strong></td>
                <td>${c.type === 'percent' ? 'نسبة %' : 'مبلغ $'}</td>
                <td>${c.value}${c.type === 'percent' ? '%' : '$'}</td>
                <td>${c.description || '-'}</td>
                <td><span class="badge ${c.is_active ? 'badge-success' : 'badge-danger'}">${c.is_active ? 'نشط' : 'معطل'}</span></td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteDiscount(${c.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('خطأ في تحميل أكواد الخصم:', error);
    }
}

async function saveDiscount(event) {
    event.preventDefault();
    try {
        await apiRequest('/admin/discount-codes', {
            method: 'POST',
            body: JSON.stringify({
                code: document.getElementById('d-code').value.toUpperCase(),
                type: document.getElementById('d-type').value,
                value: parseFloat(document.getElementById('d-value').value),
                description: document.getElementById('d-desc').value,
                is_active: document.getElementById('d-active').checked ? 1 : 0
            })
        });
        alert('✅ تم حفظ كود الخصم');
        closeModal('discountModal');
        loadDiscounts();
    } catch (error) {
        alert('❌ فشل الحفظ: ' + error.message);
    }
}

function openDiscountModal() {
    document.getElementById('discountModal').classList.add('active');
}

async function deleteDiscount(id) {
    if (!confirm('هل أنت متأكد من حذف كود الخصم؟')) return;
    try {
        await apiRequest(`/admin/discount-codes/${id}`, { method: 'DELETE' });
        alert('✅ تم حذف كود الخصم');
        loadDiscounts();
    } catch (error) {
        alert('❌ فشل الحذف: ' + error.message);
    }
}

// ===== طرق الدفع =====
async function loadPayments() {
    try {
        const methods = await apiRequest('/payment-methods');
        const tbody = document.getElementById('paymentsTable');
        tbody.innerHTML = methods.map(m => `
            <tr>
                <td>${m.name}</td>
                <td>${m.type}</td>
                <td>${m.details || '-'}</td>
                <td><span class="badge ${m.is_active ? 'badge-success' : 'badge-danger'}">${m.is_active ? 'نشط' : 'معطل'}</span></td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="editPayment(${m.id}, '${m.name}', '${m.type}', '${m.details || ''}', ${m.display_order || 0}, ${m.is_active})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm ${m.is_active ? 'btn-danger' : 'btn-success'}" onclick="togglePaymentMethod(${m.id}, ${m.is_active ? 0 : 1})">${m.is_active ? 'تعطيل' : 'تفعيل'}</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('خطأ في تحميل طرق الدفع:', error);
    }
}

function editPayment(id, name, type, details, displayOrder, isActive) {
    document.getElementById('pm-id').value = id;
    document.getElementById('pm-name').value = name;
    document.getElementById('pm-type').value = type;
    document.getElementById('pm-details').value = details;
    document.getElementById('pm-order').value = displayOrder;
    document.getElementById('pm-active').checked = isActive === 1;
    document.getElementById('paymentModalTitle').innerHTML = '<i class="fas fa-edit"></i> تعديل طريقة دفع';
    document.getElementById('paymentModal').classList.add('active');
}

async function savePayment(event) {
    event.preventDefault();
    try {
        const id = document.getElementById('pm-id').value;
        const data = {
            name: document.getElementById('pm-name').value,
            type: document.getElementById('pm-type').value,
            details: document.getElementById('pm-details').value,
            display_order: parseInt(document.getElementById('pm-order').value),
            is_active: document.getElementById('pm-active').checked ? 1 : 0
        };
        
        if (id) {
            await apiRequest(`/payment-methods/${id}`, { method: 'PUT', body: JSON.stringify(data) });
            alert('✅ تم تعديل طريقة الدفع');
        } else {
            await apiRequest('/payment-methods', { method: 'POST', body: JSON.stringify(data) });
            alert('✅ تم إضافة طريقة الدفع');
        }
        
        closeModal('paymentModal');
        loadPayments();
        document.getElementById('pm-id').value = '';
        document.getElementById('paymentModalTitle').innerHTML = '<i class="fas fa-credit-card"></i> إضافة طريقة دفع';
        event.target.reset();
    } catch (error) {
        alert('❌ فشل الحفظ: ' + error.message);
    }
}

function openPaymentModal() {
    document.getElementById('pm-id').value = '';
    document.getElementById('paymentModalTitle').innerHTML = '<i class="fas fa-credit-card"></i> إضافة طريقة دفع';
    document.getElementById('paymentModal').classList.add('active');
}

async function togglePaymentMethod(id, isActive) {
    try {
        await apiRequest(`/payment-methods/${id}`, { method: 'PUT', body: JSON.stringify({ is_active: isActive }) });
        alert(`✅ تم ${isActive ? 'تفعيل' : 'تعطيل'} طريقة الدفع`);
        loadPayments();
    } catch (error) {
        alert('❌ فشل: ' + error.message);
    }
}

// ===== التقييمات =====
async function loadReviews() {
    try {
        const reviews = await apiRequest('/admin/reviews');
        const tbody = document.getElementById('reviewsTable');
        tbody.innerHTML = reviews.map(r => `
            <tr>
                <td>${r.user_name}</td>
                <td>${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</td>
                <td>${r.comment.substring(0, 50)}...</td>
                <td>${new Date(r.created_at).toLocaleDateString('ar-SA')}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteReview(${r.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('خطأ في تحميل التقييمات:', error);
    }
}

async function deleteReview(id) {
    if (!confirm('هل أنت متأكد من حذف هذا التقييم؟')) return;
    try {
        await apiRequest(`/admin/reviews/${id}`, { method: 'DELETE' });
        alert('✅ تم حذف التقييم');
        loadReviews();
    } catch (error) {
        alert('❌ فشل الحذف: ' + error.message);
    }
}

// ===== Utility =====
async function apiRequest(endpoint, options = {}) {
    try {
        const headers = { ...options.headers };
        if (!(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }
        
        console.log('📡 Request:', `${API_URL}${endpoint}`);
        
        const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
        
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await res.text();
            console.error('❌ Expected JSON but got:', text.substring(0, 100));
            throw new Error('السيرفر لم يرجع بيانات صحيحة. تأكد أن السيرفر شغال على البورت 3000');
        }
        
        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.error || 'Request failed');
        }
        return data;
    } catch (error) {
        console.error('❌ API Error:', error);
        alert('⚠️ خطأ في الاتصال:\n' + error.message);
        throw error;
    }
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

function logout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}