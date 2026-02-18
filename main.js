// ============================================
// COZA STORE - Main JavaScript
// ============================================

// Global Variables
let allProducts = [];
let displayedProducts = [];
let cart = [];
let wishlist = [];
let currentSlide = 0;
let slideInterval;
let productsPerPage = 8;
let currentPage = 1;
let currentFilter = 'all';
let currentSearchQuery = '';
let activeFilters = {
    categories: [],
    priceRange: { min: 0, max: 1000 }
};

// ============================================
// INITIALIZE
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    loadCartFromStorage();
    loadWishlistFromStorage();
    fetchProducts();
    initSlider();
});

// ============================================
// LOCAL STORAGE FUNCTIONS
// ============================================
function loadCartFromStorage() {
    const savedCart = localStorage.getItem('cozaCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCart();
    }
}

function saveCartToStorage() {
    localStorage.setItem('cozaCart', JSON.stringify(cart));
}

function loadWishlistFromStorage() {
    const savedWishlist = localStorage.getItem('cozaWishlist');
    if (savedWishlist) {
        wishlist = JSON.parse(savedWishlist);
        updateWishlistCount();
    }
}

function saveWishlistToStorage() {
    localStorage.setItem('cozaWishlist', JSON.stringify(wishlist));
}

// ============================================
// HEADER SCROLL EFFECT
// ============================================
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// ============================================
// MOBILE MENU
// ============================================
function toggleMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    mobileMenu.classList.toggle('active');
    document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : 'auto';
}

// ============================================
// HEADER SEARCH BAR
// ============================================
function toggleSearch() {
    const searchBar = document.getElementById('searchBar');
    searchBar.classList.toggle('active');
    if (searchBar.classList.contains('active')) {
        document.getElementById('searchInput').focus();
    }
}

function closeSearch() {
    document.getElementById('searchBar').classList.remove('active');
}

function searchProducts() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    currentSearchQuery = query;
    applyFilters();
    
    // Scroll to products if searching
    if (query.length > 0) {
        document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
    }
}

// ============================================
// PRODUCT OVERVIEW SEARCH (Separate from header)
// ============================================
function toggleProductSearch() {
    const productSearch = document.getElementById('productSearch');
    productSearch.classList.toggle('active');
    if (productSearch.classList.contains('active')) {
        document.getElementById('productSearchInput').focus();
    }
}

function closeProductSearch() {
    document.getElementById('productSearch').classList.remove('active');
    document.getElementById('productSearchInput').value = '';
    currentSearchQuery = '';
    applyFilters();
}

function searchProductsOverview() {
    const query = document.getElementById('productSearchInput').value.toLowerCase().trim();
    currentSearchQuery = query;
    currentPage = 1;
    applyFilters();
}

// ============================================
// HERO SLIDER
// ============================================
function initSlider() {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    if (slides.length === 0) return;
    
    slideInterval = setInterval(nextSlide, 5000);
}

const slides = document.querySelectorAll('.slide');
const dots = document.querySelectorAll('.dot');

function showSlide(index) {
    if (slides.length === 0) return;
    
    slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
    });
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
    currentSlide = index;
}

function nextSlide() {
    if (slides.length === 0) return;
    const next = (currentSlide + 1) % slides.length;
    showSlide(next);
}

function prevSlide() {
    if (slides.length === 0) return;
    const prev = (currentSlide - 1 + slides.length) % slides.length;
    showSlide(prev);
}

function goToSlide(index) {
    showSlide(index);
    resetSlideTimer();
}

function resetSlideTimer() {
    clearInterval(slideInterval);
    slideInterval = setInterval(nextSlide, 5000);
}

// ============================================
// FETCH PRODUCTS FROM API
// ============================================
async function fetchProducts() {
    try {
        const response = await fetch('https://fakestoreapi.com/products');
        allProducts = await response.json();
        
        // Fix image URLs and add proper formatting
        allProducts = allProducts.map(product => ({
            ...product,
            price: parseFloat(product.price),
            rating: product.rating || { rate: 4.0, count: 100 }
        }));
        
        displayedProducts = [...allProducts];
        renderProducts(displayedProducts);
        updateLoadMoreButton();
    } catch (error) {
        console.error('Error fetching products:', error);
        document.getElementById('productsGrid').innerHTML = 
            '<div class="loading">Failed to load products. Please try again.</div>';
    }
}

// ============================================
// RENDER PRODUCTS
// ============================================
function renderProducts(products) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    
    // Calculate which products to show based on current page
    const endIndex = currentPage * productsPerPage;
    const productsToShow = products.slice(0, endIndex);
    
    if (productsToShow.length === 0) {
        grid.innerHTML = '<div class="loading">No products found</div>';
        return;
    }
    
    grid.innerHTML = productsToShow.map(product => `
        <div class="card" data-id="${product.id}">
            <div class="img-box" onclick="openProductModal(${product.id})">
                <img src="${product.image}" alt="${product.title}" onerror="this.src='https://via.placeholder.com/300x400?text=No+Image'">
                <div class="quick-view">Quick View</div>
            </div>
            <div class="info">
                <div onclick="openProductModal(${product.id})">
                    <h4>${product.title.substring(0, 25)}${product.title.length > 25 ? '...' : ''}</h4>
                    <p>$${product.price.toFixed(2)}</p>
                </div>
                <i class="fa-${isInWishlist(product.id) ? 'solid' : 'regular'} fa-heart heart ${isInWishlist(product.id) ? 'active' : ''}" 
                   onclick="event.stopPropagation(); toggleWishlist(${product.id}, this)"></i>
            </div>
        </div>
    `).join('');
    
    updateLoadMoreButton(products.length);
}

function updateLoadMoreButton(totalProducts) {
    const loadMoreBtn = document.querySelector('.load-more');
    if (loadMoreBtn) {
        const shownProducts = currentPage * productsPerPage;
        if (shownProducts >= totalProducts) {
            loadMoreBtn.textContent = 'No More Products';
            loadMoreBtn.disabled = true;
            loadMoreBtn.style.opacity = '0.5';
        } else {
            loadMoreBtn.textContent = 'Load More';
            loadMoreBtn.disabled = false;
            loadMoreBtn.style.opacity = '1';
        }
    }
}

// ============================================
// LOAD MORE PRODUCTS
// ============================================
function loadMore() {
    currentPage++;
    applyFilters();
    showToast('Loading more products...');
}

// ============================================
// CATEGORY FILTER
// ============================================
function filterCategory(category, element) {
    currentFilter = category;
    currentPage = 1;
    
    // Update active state in menu
    document.querySelectorAll('.category-menu span').forEach(span => {
        span.classList.remove('active');
    });
    if (element) element.classList.add('active');
    
    applyFilters();
}

function filterByCategory(category) {
    // Scroll to products
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
    
    // Update menu
    document.querySelectorAll('.category-menu span').forEach(span => {
        span.classList.remove('active');
        if (span.textContent.toLowerCase().includes(category.toLowerCase())) {
            span.classList.add('active');
        }
    });
    
    currentFilter = category;
    currentPage = 1;
    applyFilters();
}

// ============================================
// ADVANCED FILTER SYSTEM
// ============================================
function showFilterPopup() {
    const filterPopup = document.getElementById('filterPopup');
    filterPopup.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeFilterPopup() {
    const filterPopup = document.getElementById('filterPopup');
    filterPopup.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function toggleFilterCategory(category, checkbox) {
    if (checkbox.checked) {
        if (!activeFilters.categories.includes(category)) {
            activeFilters.categories.push(category);
        }
    } else {
        activeFilters.categories = activeFilters.categories.filter(c => c !== category);
    }
}

function setPriceRange(min, max) {
    activeFilters.priceRange = { min, max };
    document.getElementById('priceValue').textContent = `$${min} - $${max}`;
}

function applyFilterSettings() {
    currentPage = 1;
    applyFilters();
    closeFilterPopup();
    showToast('Filters applied!');
}

function resetFilters() {
    activeFilters = {
        categories: [],
        priceRange: { min: 0, max: 1000 }
    };
    
    // Reset UI
    document.querySelectorAll('.filter-category input').forEach(cb => cb.checked = false);
    document.getElementById('priceRange').value = 1000;
    document.getElementById('priceValue').textContent = '$0 - $1000';
    
    currentFilter = 'all';
    currentSearchQuery = '';
    currentPage = 1;
    
    // Reset category menu
    document.querySelectorAll('.category-menu span').forEach(span => span.classList.remove('active'));
    document.querySelector('.category-menu span:first-child')?.classList.add('active');
    
    applyFilters();
    showToast('Filters reset!');
}

function applyFilters() {
    let filtered = [...allProducts];
    
    // Apply category filter from menu
    if (currentFilter !== 'all') {
        filtered = filtered.filter(p => 
            p.category.toLowerCase().includes(currentFilter.toLowerCase())
        );
    }
    
    // Apply advanced filter categories
    if (activeFilters.categories.length > 0) {
        filtered = filtered.filter(p => 
            activeFilters.categories.some(cat => 
                p.category.toLowerCase().includes(cat.toLowerCase())
            )
        );
    }
    
    // Apply price range filter
    filtered = filtered.filter(p => 
        p.price >= activeFilters.priceRange.min && 
        p.price <= activeFilters.priceRange.max
    );
    
    // Apply search query
    if (currentSearchQuery) {
        filtered = filtered.filter(p => 
            p.title.toLowerCase().includes(currentSearchQuery.toLowerCase()) || 
            p.category.toLowerCase().includes(currentSearchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(currentSearchQuery.toLowerCase())
        );
    }
    
    displayedProducts = filtered;
    renderProducts(displayedProducts);
}

// ============================================
// PRODUCT MODAL
// ============================================
function openProductModal(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const modal = document.getElementById('productModal');
    const modalBody = document.getElementById('modalBody');
    
    modalQuantity = 1;
    
    modalBody.innerHTML = `
        <div class="modal-image">
            <img src="${product.image}" alt="${product.title}" onerror="this.src='https://via.placeholder.com/400x500?text=No+Image'">
        </div>
        <div class="modal-info">
            <p class="modal-category">${product.category}</p>
            <h2>${product.title}</h2>
            <div class="modal-price">$${product.price.toFixed(2)}</div>
            <div class="modal-rating">
                <span class="stars">${getStars(product.rating.rate)}</span>
                <span>(${product.rating.count} reviews)</span>
            </div>
            <p class="modal-desc">${product.description}</p>
            <div class="modal-actions">
                <div class="qty-selector">
                    <button onclick="event.stopPropagation(); changeQty(-1)">-</button>
                    <span id="modalQty">1</span>
                    <button onclick="event.stopPropagation(); changeQty(1)">+</button>
                </div>
                <button class="add-cart-btn" onclick="addToCart(${product.id})">
                    <i class="fa-solid fa-cart-plus"></i> Add to Cart
                </button>
            </div>
            <button class="wishlist-btn ${isInWishlist(product.id) ? 'active' : ''}" onclick="toggleWishlistFromModal(${product.id})">
                <i class="fa-${isInWishlist(product.id) ? 'solid' : 'regular'} fa-heart"></i> 
                ${isInWishlist(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
            </button>
        </div>
    `;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('productModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

function getStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fa-solid fa-star"></i>';
        } else if (i - 0.5 <= rating) {
            stars += '<i class="fa-solid fa-star-half-stroke"></i>';
        } else {
            stars += '<i class="fa-regular fa-star"></i>';
        }
    }
    return stars;
}

let modalQuantity = 1;

function changeQty(change) {
    modalQuantity += change;
    if (modalQuantity < 1) modalQuantity = 1;
    const qtyEl = document.getElementById('modalQty');
    if (qtyEl) qtyEl.textContent = modalQuantity;
}

// Close modal on outside click
document.addEventListener('click', (e) => {
    const modal = document.getElementById('productModal');
    if (modal && e.target === modal) {
        closeModal();
    }
});

// ============================================
// CART FUNCTIONALITY
// ============================================
function toggleCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('overlay');
    cartSidebar.classList.toggle('active');
    overlay.classList.toggle('active');
    document.body.style.overflow = cartSidebar.classList.contains('active') ? 'hidden' : 'auto';
}

function closeAll() {
    document.getElementById('cartSidebar').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
    document.getElementById('wishlistSidebar')?.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += modalQuantity;
    } else {
        cart.push({
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.image,
            quantity: modalQuantity
        });
    }
    
    saveCartToStorage();
    updateCart();
    closeModal();
    showToast('Added to cart!');
    modalQuantity = 1;
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCartToStorage();
    updateCart();
}

function updateCartQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            saveCartToStorage();
            updateCart();
        }
    }
}

function updateCart() {
    const cartItems = document.getElementById('cartItems');
    const cartCount = document.getElementById('cartCount');
    const cartTotal = document.getElementById('cartTotal');
    
    if (!cartItems) return;
    
    // Update count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    // Update items
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.title}" onerror="this.src='https://via.placeholder.com/80x80?text=No+Image'">
                <div class="cart-item-info">
                    <h4>${item.title.substring(0, 30)}${item.title.length > 30 ? '...' : ''}</h4>
                    <p>$${item.price.toFixed(2)}</p>
                    <div class="cart-item-qty">
                        <button onclick="updateCartQuantity(${item.id}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateCartQuantity(${item.id}, 1)">+</button>
                    </div>
                </div>
                <span class="remove-item" onclick="removeFromCart(${item.id})">
                    <i class="fa-solid fa-trash"></i>
                </span>
            </div>
        `).join('');
    }
    
    // Update total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = '$' + total.toFixed(2);
}

// ============================================
// WISHLIST FUNCTIONALITY
// ============================================
function toggleWishlistSidebar() {
    const wishlistSidebar = document.getElementById('wishlistSidebar');
    const overlay = document.getElementById('overlay');
    wishlistSidebar.classList.toggle('active');
    overlay.classList.toggle('active');
    document.body.style.overflow = wishlistSidebar.classList.contains('active') ? 'hidden' : 'auto';
    renderWishlist();
}

function isInWishlist(productId) {
    return wishlist.includes(productId);
}

function toggleWishlist(productId, element) {
    const index = wishlist.indexOf(productId);
    
    if (index === -1) {
        wishlist.push(productId);
        element.classList.remove('fa-regular');
        element.classList.add('fa-solid', 'active');
        showToast('Added to wishlist!');
    } else {
        wishlist.splice(index, 1);
        element.classList.remove('fa-solid', 'active');
        element.classList.add('fa-regular');
        showToast('Removed from wishlist!');
    }
    
    saveWishlistToStorage();
    updateWishlistCount();
}

function toggleWishlistFromModal(productId) {
    const index = wishlist.indexOf(productId);
    
    if (index === -1) {
        wishlist.push(productId);
        showToast('Added to wishlist!');
    } else {
        wishlist.splice(index, 1);
        showToast('Removed from wishlist!');
    }
    
    saveWishlistToStorage();
    updateWishlistCount();
    openProductModal(productId);
    renderProducts(displayedProducts);
}

function removeFromWishlist(productId) {
    wishlist = wishlist.filter(id => id !== productId);
    saveWishlistToStorage();
    updateWishlistCount();
    renderWishlist();
    renderProducts(displayedProducts);
}

function updateWishlistCount() {
    const wishCount = document.getElementById('wishCount');
    if (wishCount) {
        wishCount.textContent = wishlist.length;
    }
}

function renderWishlist() {
    const wishlistItems = document.getElementById('wishlistItems');
    if (!wishlistItems) return;
    
    if (wishlist.length === 0) {
        wishlistItems.innerHTML = '<p class="empty-wishlist">Your wishlist is empty</p>';
        return;
    }
    
    const wishlistProducts = allProducts.filter(p => wishlist.includes(p.id));
    
    wishlistItems.innerHTML = wishlistProducts.map(product => `
        <div class="wishlist-item">
            <img src="${product.image}" alt="${product.title}" onerror="this.src='https://via.placeholder.com/80x80?text=No+Image'">
            <div class="wishlist-item-info">
                <h4>${product.title.substring(0, 30)}${product.title.length > 30 ? '...' : ''}</h4>
                <p>$${product.price.toFixed(2)}</p>
                <button class="add-to-cart-btn" onclick="addToCartFromWishlist(${product.id})">
                    <i class="fa-solid fa-cart-plus"></i> Add to Cart
                </button>
            </div>
            <span class="remove-wishlist-item" onclick="removeFromWishlist(${product.id})">
                <i class="fa-solid fa-times"></i>
            </span>
        </div>
    `).join('');
}

function addToCartFromWishlist(productId) {
    modalQuantity = 1;
    addToCart(productId);
}

// ============================================
// TOAST NOTIFICATION
// ============================================
function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (!toast) return;
    
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ============================================
// NEWSLETTER
// ============================================
function subscribeNewsletter() {
    const emailInput = document.getElementById('newsletterEmail');
    const email = emailInput?.value;
    if (email) {
        showToast('Subscribed successfully!');
        emailInput.value = '';
    } else {
        showToast('Please enter your email');
    }
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closeAll();
        closeSearch();
        closeProductSearch();
        closeFilterPopup();
    }
});

// Close popups when clicking overlay
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('overlay')) {
        closeAll();
        closeFilterPopup();
    }
});
