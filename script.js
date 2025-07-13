class PhotoBooth {
    constructor() {
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.captureBtn = document.getElementById('captureBtn');
        this.photoGallery = document.getElementById('photoGallery');
        this.photoCount = document.getElementById('photoCount');
        this.reshootBtn = document.getElementById('reshootBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.collageCanvas = document.getElementById('collageCanvas');
        this.collageCtx = this.collageCanvas.getContext('2d');
        this.permissionModal = document.getElementById('permissionModal');
        this.requestPermissionBtn = document.getElementById('requestPermission');
        this.nameModal = document.getElementById('nameModal');
        this.userNameInput = document.getElementById('userName');
        this.skipNameBtn = document.getElementById('skipName');
        this.confirmNameBtn = document.getElementById('confirmName');
        
        this.photos = [];
        this.currentFilter = 'none';
        this.stream = null;
        this.userName = '';
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.showPermissionModal();
    }
    
    setupEventListeners() {
        this.captureBtn.addEventListener('click', () => this.capturePhoto());
        this.reshootBtn.addEventListener('click', () => this.reshoot());
        this.downloadBtn.addEventListener('click', () => this.downloadCollage());
        this.requestPermissionBtn.addEventListener('click', () => this.requestCameraPermission());
        this.skipNameBtn.addEventListener('click', () => this.skipName());
        this.confirmNameBtn.addEventListener('click', () => this.confirmName());
        
        // Enter key support for name input
        this.userNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.confirmName();
            }
        });
        
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.applyFilter(e.target.dataset.filter));
        });
    }
    
    showPermissionModal() {
        this.permissionModal.style.display = 'flex';
    }
    
    hidePermissionModal() {
        this.permissionModal.style.display = 'none';
    }
    
    async requestCameraPermission() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                } 
            });
            
            this.video.srcObject = this.stream;
            this.hidePermissionModal();
            
            // Set canvas dimensions
            this.video.addEventListener('loadedmetadata', () => {
                this.canvas.width = this.video.videoWidth;
                this.canvas.height = this.video.videoHeight;
            });
            
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Camera access denied. Please allow camera permission and refresh the page.');
        }
    }
    
    applyFilter(filterType) {
        // Remove active class from all filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to clicked button
        document.querySelector(`[data-filter="${filterType}"]`).classList.add('active');
        
        this.currentFilter = filterType;
        
        // Apply filter to video
        this.video.className = filterType === 'none' ? '' : `filter-${filterType}`;
    }
    
    capturePhoto() {
        if (this.photos.length >= 3) return;
        
        // Set canvas size to match video
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        
        // Draw video frame to canvas
        this.ctx.drawImage(this.video, 0, 0);
        
        // Apply filter to canvas if needed
        if (this.currentFilter !== 'none') {
            this.applyCanvasFilter();
        }
        
        // Convert to data URL
        const photoData = this.canvas.toDataURL('image/jpeg', 0.8);
        
        // Add to photos array
        this.photos.push({
            data: photoData,
            filter: this.currentFilter,
            timestamp: new Date()
        });
        
        this.updateUI();
        this.displayPhoto(photoData, this.photos.length - 1);
        
        // Show name modal if 3 photos taken
        if (this.photos.length === 3) {
            this.showNameModal();
        }
    }
    
    applyCanvasFilter() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        
        switch (this.currentFilter) {
            case 'grayscale':
                for (let i = 0; i < data.length; i += 4) {
                    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                    data[i] = gray;
                    data[i + 1] = gray;
                    data[i + 2] = gray;
                }
                break;
            case 'sepia':
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
                    data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
                    data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
                }
                break;
            case 'vintage':
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189)) * 0.8;
                    data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168)) * 0.8;
                    data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131)) * 0.8;
                }
                break;
            case 'neon':
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = Math.min(255, data[i] * 1.5);
                    data[i + 1] = Math.min(255, data[i + 1] * 2);
                    data[i + 2] = Math.min(255, data[i + 2] * 1.2);
                }
                break;
            case 'purple':
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = Math.min(255, data[i] * 1.3);
                    data[i + 1] = Math.min(255, data[i + 1] * 0.7);
                    data[i + 2] = Math.min(255, data[i + 2] * 1.5);
                }
                break;
            case 'cyberpunk':
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = Math.min(255, data[i] * 1.8);
                    data[i + 1] = Math.min(255, data[i + 1] * 0.3);
                    data[i + 2] = Math.min(255, data[i + 2] * 2.5);
                }
                break;
            case 'noir':
                for (let i = 0; i < data.length; i += 4) {
                    const gray = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) * 1.5 * 0.8;
                    data[i] = Math.min(255, gray);
                    data[i + 1] = Math.min(255, gray);
                    data[i + 2] = Math.min(255, gray);
                }
                break;
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }
    
    displayPhoto(photoData, index) {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';
        photoItem.innerHTML = `
            <img src="${photoData}" alt="Photo ${index + 1}">
            <button class="remove-btn" onclick="photoBooth.removePhoto(${index})">×</button>
        `;
        
        this.photoGallery.appendChild(photoItem);
    }
    
    removePhoto(index) {
        this.photos.splice(index, 1);
        this.photoGallery.innerHTML = '';
        
        // Re-display all photos
        this.photos.forEach((photo, i) => {
            this.displayPhoto(photo.data, i);
        });
        
        this.updateUI();
        
        // Hide collage if less than 3 photos
        if (this.photos.length < 3) {
            document.getElementById('collagePreview').style.display = 'none';
        } else if (this.photos.length === 3 && this.userName) {
            // Recreate collage if we have a name
            this.createCollage();
        }
    }
    
    updateUI() {
        this.photoCount.textContent = this.photos.length;
        
        // Enable/disable buttons
        this.captureBtn.disabled = this.photos.length >= 3;
        this.reshootBtn.disabled = this.photos.length === 0;
        this.downloadBtn.disabled = this.photos.length < 3;
    }
    
    reshoot() {
        this.photos = [];
        this.userName = '';
        this.userNameInput.value = '';
        this.photoGallery.innerHTML = '';
        document.getElementById('collagePreview').style.display = 'none';
        this.nameModal.style.display = 'none';
        this.updateUI();
    }
    
    showNameModal() {
        this.nameModal.style.display = 'flex';
        this.userNameInput.focus();
    }
    
    hideNameModal() {
        this.nameModal.style.display = 'none';
    }
    
    skipName() {
        this.userName = '';
        this.hideNameModal();
        this.createCollage();
    }
    
    confirmName() {
        this.userName = this.userNameInput.value.trim() || '';
        this.hideNameModal();
        this.createCollage();
    }
    
    createCollage() {
        // Polaroid ratio 3:14 (width:height)
        const collageWidth = 300;
        const collageHeight = 1400;
        const photoWidth = 240; // 3:4 ratio width
        const photoHeight = 320; // 3:4 ratio height
        const margin = 30;
        const photoSpacing = 40;
        
        this.collageCanvas.width = collageWidth;
        this.collageCanvas.height = collageHeight;
        
        // White polaroid background
        this.collageCtx.fillStyle = '#ffffff';
        this.collageCtx.fillRect(0, 0, collageWidth, collageHeight);
        
        // Add subtle shadow border
        this.collageCtx.shadowColor = 'rgba(0,0,0,0.1)';
        this.collageCtx.shadowBlur = 10;
        this.collageCtx.shadowOffsetX = 2;
        this.collageCtx.shadowOffsetY = 2;
        this.collageCtx.strokeStyle = '#f0f0f0';
        this.collageCtx.lineWidth = 3;
        this.collageCtx.strokeRect(15, 15, collageWidth - 30, collageHeight - 30);
        this.collageCtx.shadowColor = 'transparent';
        
        // Load and draw photos with proper 3:4 aspect ratio
        const promises = this.photos.map((photo, index) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    const x = (collageWidth - photoWidth) / 2;
                    const y = margin + (index * (photoHeight + photoSpacing));
                    
                    // Calculate crop dimensions to maintain 3:4 aspect ratio
                    const imgAspect = img.width / img.height;
                    const targetAspect = 3 / 4;
                    
                    let sourceX = 0, sourceY = 0, sourceWidth = img.width, sourceHeight = img.height;
                    
                    if (imgAspect > targetAspect) {
                        // Image is wider, crop sides
                        sourceWidth = img.height * targetAspect;
                        sourceX = (img.width - sourceWidth) / 2;
                    } else {
                        // Image is taller, crop top/bottom
                        sourceHeight = img.width / targetAspect;
                        sourceY = (img.height - sourceHeight) / 2;
                    }
                    
                    // Draw photo with proper cropping
                    this.collageCtx.drawImage(
                        img, 
                        sourceX, sourceY, sourceWidth, sourceHeight,
                        x, y, photoWidth, photoHeight
                    );
                    
                    // Add photo border with rounded corners effect
                    this.collageCtx.strokeStyle = '#ddd';
                    this.collageCtx.lineWidth = 2;
                    this.collageCtx.strokeRect(x, y, photoWidth, photoHeight);
                    
                    resolve();
                };
                img.src = photo.data;
            });
        });
        
        Promise.all(promises).then(() => {
            // Add date and title in the blank space at bottom
            const now = new Date();
            const dateStr = now.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            const bottomTextY = margin + (3 * (photoHeight + photoSpacing)) + 60;
            
            // User name or default text
             this.collageCtx.fillStyle = '#333333';
             this.collageCtx.font = 'bold 24px "Segoe UI", Arial';
             this.collageCtx.textAlign = 'center';
             const displayName = this.userName || 'My Memories';
             this.collageCtx.fillText(displayName, collageWidth / 2, bottomTextY);
            
            // Date
            this.collageCtx.font = '18px "Segoe UI", Arial';
            this.collageCtx.fillStyle = '#666';
            this.collageCtx.fillText(dateStr, collageWidth / 2, bottomTextY + 40);
            
            // Add decorative elements
            this.collageCtx.fillStyle = '#ff6b6b';
            this.collageCtx.font = '20px Arial';
            this.collageCtx.fillText('📸 ✨ 💫', collageWidth / 2, bottomTextY + 80);
            
            // Show collage
            document.getElementById('collagePreview').style.display = 'block';
        });
    }
    
    downloadCollage() {
        if (this.photos.length < 3) return;
        
        // Create download link
        const link = document.createElement('a');
        link.download = `photobooth-collage-${new Date().getTime()}.jpg`;
        link.href = this.collageCanvas.toDataURL('image/jpeg', 0.9);
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Initialize the PhotoBooth when page loads
let photoBooth;
window.addEventListener('DOMContentLoaded', () => {
    photoBooth = new PhotoBooth();
});

// Handle page unload to stop camera
window.addEventListener('beforeunload', () => {
    if (photoBooth && photoBooth.stream) {
        photoBooth.stream.getTracks().forEach(track => track.stop());
    }
});