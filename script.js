let currentProduct = null;
let currentImageIndex = 0;
let allProducts = [];
let currentPage = 0;
let favoriteProducts = [];
let shareProductIds = []; 
let showingFavorites = false;
let isShowingShare = false;
let shareLink = "";
const itemsPerPage = 20;

document.addEventListener('DOMContentLoaded', () => {
    loadFavoritesFromCookie();
    loadDataFromHref();
    fetch('product_images.json')
        .then(response => response.json())
        .then(data => {
            allProducts = data;
            loadMoreItems();
        })

    window.addEventListener('scroll', () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
            loadMoreItems();
        }
    });

    document.getElementById('toggleFavorites').addEventListener('click', toggleFavoriteView);
    document.getElementById('saveFavorite').addEventListener('click', toggleFavorite);
    document.getElementById('shareFavorites').addEventListener('click', shareFavorite);
    document.getElementById('clearFavorites').addEventListener('click', clearFavorites);
});

function loadDataFromHref() {
    if(location.search) {
        let parameters = location.search.replace("?id=", "");
        shareProductIds = parameters.split(",");
        isShowingShare = shareProductIds.length > 0;
    }
    
}
function loadFavoritesFromCookie() {
    const favoriteCookie = getCookie('favorites');
    if (favoriteCookie) {
        favoriteProducts = JSON.parse(favoriteCookie);
    }
}


function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function clearFavorites() {
    favoriteProducts = [];   
    setCookie('favorites', JSON.stringify(favoriteProducts), 30);  // Store for 30 days
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = '';
    currentPage = 0;
    loadMoreItems();
}

function shareFavorite() {
    let Ids = favoriteProducts.map( item => item.id );
    let paramters = Ids.join(",");
    let url = location.origin + location.pathname + "?id=" + paramters;
    shareLink = url;
    toggleShareMenu();
}

function loadMoreItems() {
    const gallery = document.getElementById('gallery');
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    if(isShowingShare) {
        allProducts = allProducts.filter(item => shareProductIds.indexOf(item.id + "") > -1);
        const toggleFavorites = document.getElementById('toggleFavorites');
        const shareFavorites = document.getElementById('shareFavorites');
        const clearFavorites = document.getElementById('clearFavorites');
        
        clearFavorites.hidden = true;
        toggleFavorites.hidden = true;
        shareFavorites.hidden = true;
    }

    //const productsToLoad = allProducts.slice(startIndex, endIndex);
    const productsToLoad = showingFavorites ? favoriteProducts.slice(startIndex, endIndex) : allProducts.slice(startIndex, endIndex);
    const favoriteProductIds = favoriteProducts.map(item => item.id);
    productsToLoad.forEach((product, index) => {
        if (product.images.length > 0) {
            const item = document.createElement('div');
            const isFavorite = favoriteProductIds.indexOf(product.id) > -1; 
            item.id = product.id;
            item.className = 'gallery-item position-relative';
            item.innerHTML = '<div style="width: 100%; height: 100%; background-color: #333;"></div>';
            item.addEventListener('click', () => openViewer(product, startIndex + index));
            gallery.appendChild(item);
    
            const img = new Image();
            img.src = product.images[0];
            img.className = "img-thumbnail rounded mx-auto d-block";
            img.onload = () => {
                item.innerHTML = '';
                item.appendChild(img);

                if(isFavorite) {
                    const badge = document.createElement('span');
                    badge.className = "badge rounded-pill bg-danger";
                    badge.innerText = 'Favorite';
                    item.appendChild(badge);
                    console.log(badge);
                }
            };
        }
    });
    currentPage++;
}

function openViewer(product, index) {
    currentProduct = product;
    currentImageIndex = 0;
    shareLink = product.link;
    const viewer = document.getElementById('fullscreenViewer');
    const imageContainer = document.getElementById('imageContainer');
    const thumbnailContainer = document.getElementById('thumbnailContainer');
    const saveFavorite = document.getElementById('saveFavorite');
    
    imageContainer.innerHTML = `<img src="${product.images[currentImageIndex]}" alt="Product Image">`;
    thumbnailContainer.innerHTML = '';
    
    product.images.forEach((image, idx) => {
        const thumbnail = document.createElement('div');
        thumbnail.className = `thumbnail ${idx === 0 ? 'active' : ''}`;
        thumbnail.innerHTML = `<img src="${image}" alt="Thumbnail">`;
        thumbnail.addEventListener('click', () => {
            currentImageIndex = idx;
            updateMainImage();
            updateActiveThumbnail();
        });
        thumbnailContainer.appendChild(thumbnail);
    });
    
    saveFavorite.classList.toggle('active', isFavorite(product));
    viewer.style.display = 'block';
    setupGestures();
}

function updateMainImage() {
    const imageContainer = document.getElementById('imageContainer');
    imageContainer.innerHTML = `<img src="${currentProduct.images[currentImageIndex]}" alt="Product Image">`;
}

function updateActiveThumbnail() {
    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach((thumb, idx) => {
        if (idx === currentImageIndex) {
            thumb.classList.add('active');
        } else {
            thumb.classList.remove('active');
        }
    });
}

function isFavorite(product) {
    return favoriteProducts.some(favProduct => favProduct.id === product.id);
}

function toggleFavorite() {
    const saveFavorite = document.getElementById('saveFavorite');
    const currentItem = document.getElementById(currentProduct.id);
    if (isFavorite(currentProduct)) {
        favoriteProducts = favoriteProducts.filter(product => product.id !== currentProduct.id);
        saveFavorite.classList.remove('active');
        
        const badge = currentItem.querySelector('span.badge');
        console.log("plan to remove", badge);
        currentItem.removeChild(badge);
    } else {
        favoriteProducts.push(currentProduct);
        saveFavorite.classList.add('active');

        const badge = document.createElement('span');
        badge.className = "badge rounded-pill bg-danger";
        badge.innerText = 'Favorite';
        currentItem.appendChild(badge);
    }
    setCookie('favorites', JSON.stringify(favoriteProducts), 30);  // Store for 30 days
}

function toggleFavoriteView() {
    showingFavorites = !showingFavorites;
    const gallery = document.getElementById('gallery');
    const toggleButton = document.getElementById('toggleFavorites');
    gallery.innerHTML = '';
    currentPage = 0;
    toggleButton.textContent = showingFavorites ? '呈現全部' : '呈現收藏';
    loadMoreItems();
}

function setupGestures() {
    const imageContainer = document.getElementById('imageContainer');
    const hammer = new Hammer(imageContainer);

    hammer.get('pinch').set({ enable: true });
    hammer.get('swipe').set({ direction: Hammer.DIRECTION_HORIZONTAL });

    hammer.on('swipeleft', () => navigateImage(1));
    hammer.on('swiperight', () => navigateImage(-1));

    let currentScale = 1;
    hammer.on('pinch', (e) => {
        currentScale = Math.max(1, Math.min(e.scale, 3));
        imageContainer.style.transform = `scale(${currentScale})`;
    });

    hammer.on('pinchend', () => {
        currentScale = 1;
        imageContainer.style.transform = '';
    });
}

function navigateImage(direction) {
    currentImageIndex += direction;
    if (currentImageIndex < 0) currentImageIndex = currentProduct.images.length - 1;
    if (currentImageIndex >= currentProduct.images.length) currentImageIndex = 0;

    updateMainImage();
    updateActiveThumbnail();
}

document.getElementById('closeViewer').addEventListener('click', () => {
    document.getElementById('fullscreenViewer').style.display = 'none';
});

document.getElementById('shareButton').addEventListener('click', () => {
    if (shareLink) {
        if (navigator.share) {
            navigator.share({
                title: 'Check out this product',
                url: shareLink
            });
        } else {
            toggleShareMenu();
        }
    }
});


function toggleShareMenu() {
    const shareMenu = document.getElementById('shareMenu');
    shareMenu.style.display = shareMenu.style.display === 'block' ? 'none' : 'block';
}

document.querySelectorAll('.share-option').forEach(option => {
    option.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        switch(action) {
            case 'line':
                window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareLink)}`, '_blank');
                break;
            case 'copy':
                navigator.clipboard.writeText(shareLink)
                    .then(() => alert('Link copied to clipboard!'))
                break;
            case 'open':
                window.open(`${shareLink}`, '_blank');
                break;
        }
        toggleShareMenu();
    });
});

// Close share menu when clicking outside
document.addEventListener('click', (e) => {
    const shareMenu = document.getElementById('shareMenu');
    const shareButton = document.getElementById('shareButton');
    if (shareMenu.style.display === 'block' && (e.target !== shareButton && e.target !== shareFavorites ) && !shareMenu.contains(e.target)) {
        toggleShareMenu();
    }
});