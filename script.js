let currentProduct = null;
let currentImageIndex = 0;
let allProducts = [];
let currentPage = 0;
const itemsPerPage = 20;

document.addEventListener('DOMContentLoaded', () => {
    fetch('product_images.json')
        .then(response => response.json())
        .then(data => {
            allProducts = data;
            loadMoreItems();
        })
        .catch(error => console.error('Error loading gallery:', error));

    window.addEventListener('scroll', () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
            loadMoreItems();
        }
    });
});

function loadMoreItems() {
    const gallery = document.getElementById('gallery');
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const productsToLoad = allProducts.slice(startIndex, endIndex);

    productsToLoad.forEach((product, index) => {
        if (product.images.length > 0) {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.innerHTML = '<div style="width: 100%; height: 100%; background-color: #333;"></div>';
            item.addEventListener('click', () => openViewer(product, startIndex + index));
            gallery.appendChild(item);

            const img = new Image();
            img.src = product.images[0];
            img.onload = () => {
                item.innerHTML = '';
                item.appendChild(img);
            };
        }
    });

    currentPage++;
}

function openViewer(product, index) {
    currentProduct = product;
    currentImageIndex = 0;
    const viewer = document.getElementById('fullscreenViewer');
    const imageContainer = document.getElementById('imageContainer');
    const thumbnailContainer = document.getElementById('thumbnailContainer');
    
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
    if (currentProduct && currentProduct.link) {
        if (navigator.share) {
            navigator.share({
                title: 'Check out this product',
                url: currentProduct.link
            }).catch(console.error);
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
                window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(currentProduct.link)}`, '_blank');
                break;
            case 'copy':
                navigator.clipboard.writeText(currentProduct.link)
                    .then(() => alert('Link copied to clipboard!'))
                    .catch(console.error);
                break;
            case 'email':
                window.location.href = `mailto:?subject=Check out this product&body=${currentProduct.link}`;
                break;
            case 'message':
                window.location.href = `sms:?&body=${currentProduct.link}`;
                break;
            case 'whatsapp':
                window.open(`https://wa.me/?text=${encodeURIComponent(currentProduct.link)}`, '_blank');
                break;
        }
        toggleShareMenu();
    });
});

// Close share menu when clicking outside
document.addEventListener('click', (e) => {
    const shareMenu = document.getElementById('shareMenu');
    const shareButton = document.getElementById('shareButton');
    if (shareMenu.style.display === 'block' && e.target !== shareButton && !shareMenu.contains(e.target)) {
        toggleShareMenu();
    }
});