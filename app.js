/**
 * QR Code Generator Pro
 * Advanced QR code customization with real-time preview
 */

// DOM Elements
const urlInput = document.getElementById('url-input');
const clearBtn = document.getElementById('clear-btn');
const generateBtn = document.getElementById('generate-btn');
const qrCodeContainer = document.getElementById('qr-code');
const qrContainer = document.getElementById('qr-container');
const actionsContainer = document.getElementById('actions');
const downloadBtn = document.getElementById('download-btn');
const downloadSvgBtn = document.getElementById('download-svg-btn');
const copyBtn = document.getElementById('copy-btn');
const copyText = document.getElementById('copy-text');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// Customization Panel Elements
const panelToggle = document.getElementById('panel-toggle');
const panelContent = document.getElementById('panel-content');
const logoInput = document.getElementById('logo-input');
const logoPreview = document.getElementById('logo-preview');
const logoImage = document.getElementById('logo-image');
const removeLogoBtn = document.getElementById('remove-logo-btn');
const marginSlider = document.getElementById('margin-slider');
const marginValue = document.getElementById('margin-value');
const sizeSlider = document.getElementById('size-slider');
const sizeValue = document.getElementById('size-value');
const dotStyleButtons = document.getElementById('dot-style-buttons');
const cornerStyleButtons = document.getElementById('corner-style-buttons');
const dotColorInput = document.getElementById('dot-color');
const cornerColorInput = document.getElementById('corner-color');
const bgColorInput = document.getElementById('bg-color');
const dotColorHex = document.getElementById('dot-color-hex');
const cornerColorHex = document.getElementById('corner-color-hex');
const bgColorHex = document.getElementById('bg-color-hex');

// State
let qrCode = null;
let currentUrl = '';
let logoDataUrl = null;
let isGenerated = false;
let debounceTimer = null;

// Configuration
const config = {
    width: 200,
    height: 200,
    margin: 10,
    downloadSize: 300,
    dotStyle: 'rounded',
    cornerStyle: 'extra-rounded',
    dotColor: '#1a1a2e',
    cornerColor: '#7c3aed',
    bgColor: '#ffffff',
    errorCorrectionLevel: 'Q'
};

// Preview placeholder URL
const PREVIEW_URL = 'https://preview.qr';

/**
 * Get current QR code configuration
 */
function getQRCodeConfig(forPreview = false) {
    const data = forPreview ? PREVIEW_URL : (currentUrl || PREVIEW_URL);

    return {
        width: config.width,
        height: config.height,
        type: 'canvas',
        data: data,
        margin: config.margin,
        qrOptions: {
            errorCorrectionLevel: config.errorCorrectionLevel
        },
        dotsOptions: {
            color: config.dotColor,
            type: config.dotStyle
        },
        cornersSquareOptions: {
            color: config.cornerColor,
            type: config.cornerStyle
        },
        cornersDotOptions: {
            color: config.cornerColor,
            type: 'dot'
        },
        backgroundOptions: {
            color: config.bgColor
        },
        imageOptions: {
            crossOrigin: 'anonymous',
            margin: 5,
            imageSize: 0.4,
            hideBackgroundDots: true
        },
        image: logoDataUrl || undefined
    };
}

/**
 * Initialize QR Code with preview
 */
function initQRCode() {
    qrCode = new QRCodeStyling(getQRCodeConfig(true));
    qrCodeContainer.innerHTML = '';
    qrCode.append(qrCodeContainer);
    qrCodeContainer.classList.add('visible');

    // Add preview indicator
    updatePreviewIndicator(true);
}

/**
 * Update preview indicator
 */
function updatePreviewIndicator(isPreview) {
    let indicator = document.querySelector('.preview-indicator');

    if (isPreview && !isGenerated) {
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'preview-indicator';
            indicator.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2"/>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                </svg>
                Preview
            `;
            qrContainer.appendChild(indicator);
        }
        indicator.style.display = 'flex';
    } else if (indicator) {
        indicator.style.display = 'none';
    }
}

/**
 * Update QR Code preview in real-time (debounced)
 */
function updatePreview() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        if (!qrCode) return;

        const newConfig = getQRCodeConfig(!isGenerated);
        qrCode.update(newConfig);
    }, 50);
}

/**
 * Validate URL
 */
function isValidUrl(url) {
    if (!url || url.trim() === '') return false;

    let testUrl = url;
    if (!url.match(/^https?:\/\//i)) {
        testUrl = 'https://' + url;
    }

    try {
        new URL(testUrl);
        return true;
    } catch {
        return false;
    }
}

/**
 * Normalize URL
 */
function normalizeUrl(url) {
    if (!url.match(/^https?:\/\//i)) {
        return 'https://' + url;
    }
    return url;
}

/**
 * Generate QR Code (final)
 */
function generateQRCode() {
    const url = urlInput.value.trim();

    if (!isValidUrl(url)) {
        showToast('Por favor, insira um link válido', 'error');
        urlInput.focus();
        return;
    }

    currentUrl = normalizeUrl(url);
    isGenerated = true;

    generateBtn.disabled = true;
    generateBtn.innerHTML = `
        <svg class="btn-icon spinning" viewBox="0 0 24 24" fill="none">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        Gerando...
    `;

    // Update QR with real URL
    qrCode.update(getQRCodeConfig(false));

    setTimeout(() => {
        actionsContainer.classList.remove('hidden');
        updatePreviewIndicator(false);

        generateBtn.disabled = false;
        generateBtn.innerHTML = `
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Atualizar QR Code
        `;

        showToast('QR Code gerado com sucesso!', 'success');
    }, 300);
}

/**
 * Handle URL input changes for real-time preview
 */
function handleUrlInput() {
    const url = urlInput.value.trim();

    if (isGenerated && isValidUrl(url)) {
        // Update preview with typed URL
        currentUrl = normalizeUrl(url);
        qrCode.update(getQRCodeConfig(false));
    }
}

/**
 * Download PNG
 */
async function downloadPNG() {
    if (!qrCode || !currentUrl) return;

    try {
        const downloadConfig = getQRCodeConfig(false);
        downloadConfig.width = config.downloadSize;
        downloadConfig.height = config.downloadSize;

        const downloadQR = new QRCodeStyling(downloadConfig);
        await downloadQR.download({ name: 'qrcode', extension: 'png' });
        showToast('Download PNG realizado!', 'success');
    } catch (error) {
        showToast('Erro ao fazer download', 'error');
        console.error('Download error:', error);
    }
}

/**
 * Download SVG with embedded logo
 * Fixes Illustrator compatibility by ensuring image is inline base64
 */
async function downloadSVG() {
    if (!qrCode || !currentUrl) return;

    try {
        showToast('Gerando SVG...', 'success');

        const downloadConfig = getQRCodeConfig(false);
        downloadConfig.width = config.downloadSize;
        downloadConfig.height = config.downloadSize;
        downloadConfig.type = 'svg';

        const downloadQR = new QRCodeStyling(downloadConfig);

        // Get SVG as blob
        const svgBlob = await downloadQR.getRawData('svg');

        // Read blob as text
        const svgText = await svgBlob.text();

        // Parse and fix the SVG
        let fixedSvg = svgText;

        // If there's a logo, ensure it's embedded as base64
        if (logoDataUrl) {
            // The logo should already be base64 from our optimizeLogo function
            // Check if the SVG has an image with xlink:href or href
            fixedSvg = fixedSvg.replace(
                /xlink:href="(?!data:)[^"]*"/g,
                `xlink:href="${logoDataUrl}"`
            );
            fixedSvg = fixedSvg.replace(
                /href="(?!data:)(?!#)[^"]*"/g,
                `href="${logoDataUrl}"`
            );
        }

        // Create downloadable blob
        const blob = new Blob([fixedSvg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

        // Download
        const link = document.createElement('a');
        link.href = url;
        link.download = 'qrcode.svg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showToast('Download SVG realizado!', 'success');
    } catch (error) {
        showToast('Erro ao fazer download', 'error');
        console.error('Download error:', error);
    }
}


/**
 * Copy URL to clipboard
 */
async function copyToClipboard() {
    if (!currentUrl) return;

    try {
        await navigator.clipboard.writeText(currentUrl);
        copyText.textContent = 'Copiado!';
        copyBtn.style.borderColor = 'var(--purple-500)';
        copyBtn.style.color = 'var(--purple-400)';

        setTimeout(() => {
            copyText.textContent = 'Copiar Link';
            copyBtn.style.borderColor = '';
            copyBtn.style.color = '';
        }, 2000);

        showToast('Link copiado!', 'success');
    } catch (error) {
        showToast('Erro ao copiar link', 'error');
    }
}

/**
 * Toggle customization panel
 */
function togglePanel() {
    panelToggle.classList.toggle('active');
    panelContent.classList.toggle('visible');
}

/**
 * Optimize and compress logo image
 * @param {string} dataUrl - Original image data URL
 * @param {number} maxSize - Maximum dimension (width/height)
 * @param {number} quality - JPEG quality (0-1)
 * @returns {Promise<string>} - Optimized image data URL
 */
function optimizeLogo(dataUrl, maxSize = 150, quality = 0.8) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Scale down if larger than maxSize
            if (width > maxSize || height > maxSize) {
                if (width > height) {
                    height = Math.round((height * maxSize) / width);
                    width = maxSize;
                } else {
                    width = Math.round((width * maxSize) / height);
                    height = maxSize;
                }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');

            // White background for transparency
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);

            // Draw image
            ctx.drawImage(img, 0, 0, width, height);

            // Export as PNG for best compatibility with SVG
            const optimizedDataUrl = canvas.toDataURL('image/png', quality);
            resolve(optimizedDataUrl);
        };
        img.src = dataUrl;
    });
}

/**
 * Handle logo upload
 */
async function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showToast('Por favor, selecione uma imagem', 'error');
        return;
    }

    // Check file size (warn if > 1MB)
    if (file.size > 1024 * 1024) {
        showToast('Otimizando imagem grande...', 'success');
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        // Optimize the logo
        const originalDataUrl = e.target.result;
        logoDataUrl = await optimizeLogo(originalDataUrl, 150, 0.85);

        logoImage.src = logoDataUrl;
        logoImage.style.display = 'block';
        logoPreview.classList.add('has-logo');
        logoPreview.querySelector('.upload-icon').style.display = 'none';
        removeLogoBtn.style.display = 'flex';

        // Auto-set high error correction when logo is added
        config.errorCorrectionLevel = 'H';
        document.querySelector('input[name="errorCorrection"][value="H"]').checked = true;

        updatePreview();
        showToast('Logo otimizado e adicionado!', 'success');
    };
    reader.readAsDataURL(file);
}

/**
 * Remove logo
 */
function removeLogo() {
    logoDataUrl = null;
    logoImage.src = '';
    logoImage.style.display = 'none';
    logoPreview.classList.remove('has-logo');
    logoPreview.querySelector('.upload-icon').style.display = 'block';
    removeLogoBtn.style.display = 'none';
    logoInput.value = '';

    updatePreview();
    showToast('Logo removido', 'success');
}

/**
 * Handle slider changes
 */
function handleMarginChange() {
    config.margin = parseInt(marginSlider.value);
    marginValue.textContent = config.margin + 'px';
    updatePreview();
}

function handleSizeChange() {
    config.downloadSize = parseInt(sizeSlider.value);
    sizeValue.textContent = config.downloadSize + 'px';
}

/**
 * Handle style button clicks
 */
function handleDotStyleClick(event) {
    const btn = event.target.closest('.style-btn');
    if (!btn) return;

    dotStyleButtons.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    config.dotStyle = btn.dataset.style;
    updatePreview();
}

function handleCornerStyleClick(event) {
    const btn = event.target.closest('.style-btn');
    if (!btn) return;

    cornerStyleButtons.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    config.cornerStyle = btn.dataset.style;
    updatePreview();
}

/**
 * Handle color changes
 */
function handleDotColorChange() {
    config.dotColor = dotColorInput.value;
    dotColorHex.textContent = config.dotColor;
    updatePreview();
}

function handleCornerColorChange() {
    config.cornerColor = cornerColorInput.value;
    cornerColorHex.textContent = config.cornerColor;
    updatePreview();
}

function handleBgColorChange() {
    config.bgColor = bgColorInput.value;
    bgColorHex.textContent = config.bgColor;

    // Update container background to match
    qrContainer.style.backgroundColor = config.bgColor;
    updatePreview();
}

/**
 * Handle error correction change
 */
function handleErrorCorrectionChange(event) {
    if (event.target.type === 'radio') {
        config.errorCorrectionLevel = event.target.value;
        updatePreview();
    }
}

/**
 * Clear input
 */
function clearInput() {
    urlInput.value = '';
    currentUrl = '';
    isGenerated = false;
    actionsContainer.classList.add('hidden');

    // Reset to preview mode
    qrCode.update(getQRCodeConfig(true));
    updatePreviewIndicator(true);

    // Reset button text
    generateBtn.innerHTML = `
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        Gerar QR Code
    `;

    urlInput.focus();
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
    toastMessage.textContent = message;

    const toastIcon = toast.querySelector('.toast-icon');
    if (type === 'error') {
        toastIcon.innerHTML = `<path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`;
        toastIcon.style.color = '#ef4444';
    } else {
        toastIcon.innerHTML = `<path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`;
        toastIcon.style.color = 'var(--purple-400)';
    }

    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 3000);
}

/**
 * Handle Enter key
 */
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        generateQRCode();
    }
}

// Add styles
const style = document.createElement('style');
style.textContent = `
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .spinning { animation: spin 1s linear infinite; }
    
    .preview-indicator {
        position: absolute;
        bottom: 8px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        background: rgba(0, 0, 0, 0.7);
        border-radius: 20px;
        font-size: 11px;
        font-weight: 500;
        color: #a855f7;
        pointer-events: none;
    }
    
    .preview-indicator svg {
        width: 12px;
        height: 12px;
    }
`;
document.head.appendChild(style);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initQRCode();

    // Main actions
    generateBtn.addEventListener('click', generateQRCode);
    clearBtn.addEventListener('click', clearInput);
    downloadBtn.addEventListener('click', downloadPNG);
    downloadSvgBtn.addEventListener('click', downloadSVG);
    copyBtn.addEventListener('click', copyToClipboard);
    urlInput.addEventListener('keypress', handleKeyPress);
    urlInput.addEventListener('input', handleUrlInput);

    // Panel toggle
    panelToggle.addEventListener('click', togglePanel);

    // Logo
    logoInput.addEventListener('change', handleLogoUpload);
    removeLogoBtn.addEventListener('click', removeLogo);

    // Sliders
    marginSlider.addEventListener('input', handleMarginChange);
    sizeSlider.addEventListener('input', handleSizeChange);

    // Style buttons
    dotStyleButtons.addEventListener('click', handleDotStyleClick);
    cornerStyleButtons.addEventListener('click', handleCornerStyleClick);

    // Colors
    dotColorInput.addEventListener('input', handleDotColorChange);
    cornerColorInput.addEventListener('input', handleCornerColorChange);
    bgColorInput.addEventListener('input', handleBgColorChange);

    // Error correction
    document.getElementById('error-correction').addEventListener('change', handleErrorCorrectionChange);

    // Initialize tracking features
    initTracking();

    urlInput.focus();
});

// ========================================
// TRACKING FUNCTIONALITY
// ========================================

const API_BASE_URL = 'https://qr-tracker.acssjr.workers.dev';

// Tracking state
let trackingEnabled = false;
let currentTrackingData = null;

// Tracking DOM Elements
const trackingSection = document.getElementById('tracking-section');
const trackingToggle = document.getElementById('tracking-toggle');
const trackingToggleWrapper = document.getElementById('tracking-toggle-wrapper');
const trackingInfo = document.getElementById('tracking-info');
const trackingUrlDisplay = document.getElementById('tracking-url');
const statsBtn = document.getElementById('stats-btn');
const dashboardModal = document.getElementById('dashboard-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const openDashboardBtn = document.getElementById('open-dashboard-btn');
const qrListView = document.getElementById('qr-list-view');
const qrList = document.getElementById('qr-list');
const statsDetailView = document.getElementById('stats-detail-view');
const statsBackBtn = document.getElementById('stats-back-btn');
const statsContent = document.getElementById('stats-content');

/**
 * Initialize tracking features
 */
function initTracking() {
    // Tracking toggle
    trackingToggleWrapper.addEventListener('click', handleTrackingToggle);

    // Stats button
    statsBtn.addEventListener('click', () => {
        if (currentTrackingData) {
            openDashboard();
            showStatsDetail(currentTrackingData.id);
        }
    });

    // Dashboard modal
    openDashboardBtn.addEventListener('click', openDashboard);
    closeModalBtn.addEventListener('click', closeDashboard);
    dashboardModal.addEventListener('click', (e) => {
        if (e.target === dashboardModal) closeDashboard();
    });

    // Stats back button
    statsBackBtn.addEventListener('click', () => {
        statsDetailView.classList.remove('visible');
        qrListView.style.display = 'block';
        // Clear URL hash
        history.pushState('', document.title, window.location.pathname);
    });

    // ESC key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && dashboardModal.classList.contains('visible')) {
            closeDashboard();
        }
    });

    // Check for deep link on page load
    checkDeepLink();

    // Handle back/forward navigation
    window.addEventListener('hashchange', checkDeepLink);
}

/**
 * Check if there's a stats ID in the URL and open it
 */
function checkDeepLink() {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#stats/')) {
        const linkId = hash.replace('#stats/', '');
        if (linkId) {
            openDashboard();
            showStatsDetail(linkId);
        }
    }
}

/**
 * Handle tracking toggle
 */
function handleTrackingToggle() {
    trackingEnabled = !trackingEnabled;
    trackingToggle.classList.toggle('active', trackingEnabled);
    trackingToggleWrapper.classList.toggle('active', trackingEnabled);
    trackingInfo.classList.toggle('visible', trackingEnabled);

    if (trackingEnabled && currentUrl && isGenerated) {
        createTrackingLink();
    } else if (!trackingEnabled && currentTrackingData) {
        // Revert to original URL
        qrCode.update(getQRCodeConfig(false));
        currentTrackingData = null;
        trackingUrlDisplay.textContent = '';
        statsBtn.style.display = 'none';
    }
}

/**
 * Create tracking link via API
 */
async function createTrackingLink() {
    if (!currentUrl) return;

    try {
        trackingUrlDisplay.textContent = 'Criando link de rastreamento...';

        const response = await fetch(`${API_BASE_URL}/api/links`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: currentUrl,
                title: new URL(currentUrl).hostname
            })
        });

        if (!response.ok) {
            throw new Error('Falha ao criar link');
        }

        const result = await response.json();
        currentTrackingData = result.data;

        // Update QR code with tracking URL
        const trackingConfig = getQRCodeConfig(false);
        trackingConfig.data = currentTrackingData.trackingUrl;
        qrCode.update(trackingConfig);

        // Show tracking URL
        trackingUrlDisplay.textContent = currentTrackingData.trackingUrl;

        // Show stats button
        statsBtn.style.display = 'flex';

        // Save to localStorage for future access
        saveQRCodeToLocalStorage(currentTrackingData);

        showToast('Link de rastreamento criado!', 'success');

    } catch (error) {
        console.error('Error creating tracking link:', error);
        trackingUrlDisplay.textContent = 'Erro ao criar link. Tente novamente.';
        showToast('Erro ao criar link de rastreamento', 'error');
    }
}

/**
 * Save QR Code to localStorage
 */
function saveQRCodeToLocalStorage(data) {
    try {
        const savedCodes = JSON.parse(localStorage.getItem('qr_codes') || '[]');

        // Check if already exists
        const exists = savedCodes.some(code => code.id === data.id);
        if (!exists) {
            savedCodes.unshift({
                id: data.id,
                shortCode: data.shortCode,
                originalUrl: data.originalUrl,
                trackingUrl: data.trackingUrl,
                title: data.title,
                createdAt: new Date().toISOString()
            });

            // Keep only last 50 codes
            if (savedCodes.length > 50) {
                savedCodes.pop();
            }

            localStorage.setItem('qr_codes', JSON.stringify(savedCodes));
        }
    } catch (e) {
        console.error('Error saving to localStorage:', e);
    }
}

/**
 * Get saved QR Codes from localStorage
 */
function getSavedQRCodes() {
    try {
        return JSON.parse(localStorage.getItem('qr_codes') || '[]');
    } catch (e) {
        return [];
    }
}

/**
 * Show tracking section when QR is generated
 */
const originalGenerateQRCode = generateQRCode;
generateQRCode = function () {
    originalGenerateQRCode.call(this);

    // Show tracking section after generation
    setTimeout(() => {
        if (isGenerated) {
            trackingSection.style.display = 'block';

            // If tracking was enabled, create new tracking link
            if (trackingEnabled) {
                createTrackingLink();
            }
        }
    }, 350);
};

/**
 * Open dashboard modal
 */
function openDashboard() {
    dashboardModal.classList.add('visible');
    document.body.style.overflow = 'hidden';
    loadQRList();
}

/**
 * Close dashboard modal
 */
function closeDashboard() {
    dashboardModal.classList.remove('visible');
    document.body.style.overflow = '';

    // Reset to list view
    statsDetailView.classList.remove('visible');
    qrListView.style.display = 'block';
}

/**
 * Load QR codes list
 */
async function loadQRList() {
    qrList.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const response = await fetch(`${API_BASE_URL}/api/links`);
        const result = await response.json();

        if (!result.success || result.data.length === 0) {
            qrList.innerHTML = `
                <div class="qr-list-empty">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
                        <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
                        <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
                        <rect x="14" y="14" width="3" height="3" fill="currentColor"/>
                        <rect x="18" y="14" width="3" height="3" fill="currentColor"/>
                        <rect x="14" y="18" width="3" height="3" fill="currentColor"/>
                        <rect x="18" y="18" width="3" height="3" fill="currentColor"/>
                    </svg>
                    <p>Nenhum QR Code rastreado ainda</p>
                    <span>Ative o rastreamento ao gerar um QR Code</span>
                </div>
            `;
            return;
        }

        qrList.innerHTML = result.data.map(link => `
            <div class="qr-card" data-id="${link.id}">
                <div class="qr-card-icon">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
                        <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
                        <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </div>
                <div class="qr-card-info">
                    <div class="qr-card-title">${link.title || 'Sem título'}</div>
                    <div class="qr-card-url">${link.original_url}</div>
                </div>
                <div class="qr-card-stats">
                    <div class="stat-badge">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" stroke-width="2"/>
                            <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        ${link.total_clicks || 0} scans
                    </div>
                    <div class="qr-card-date">${formatDate(link.created_at)}</div>
                </div>
            </div>
        `).join('');

        // Add click handlers
        qrList.querySelectorAll('.qr-card').forEach(card => {
            card.addEventListener('click', () => {
                showStatsDetail(card.dataset.id);
            });
        });

    } catch (error) {
        console.error('Error loading QR list:', error);
        qrList.innerHTML = `
            <div class="qr-list-empty">
                <p>Erro ao carregar QR Codes</p>
                <span>${error.message}</span>
            </div>
        `;
    }
}

/**
 * Show stats detail for a link
 */
async function showStatsDetail(linkId) {
    qrListView.style.display = 'none';
    statsDetailView.classList.add('visible');
    statsContent.innerHTML = '<div class="loading-spinner"></div>';

    // Update URL for bookmarking
    history.pushState(null, '', `#stats/${linkId}`);

    try {
        const response = await fetch(`${API_BASE_URL}/api/stats/${linkId}`);
        const result = await response.json();

        if (!result.success) {
            throw new Error('Falha ao carregar estatísticas');
        }

        const { link, stats } = result.data;

        // Calculate trend
        const trend = stats.todayScans - stats.yesterdayScans;
        const trendIcon = trend > 0 ? '📈' : trend < 0 ? '📉' : '➡️';
        const trendText = trend > 0 ? `+${trend}` : trend.toString();

        // Stats URL for sharing
        const statsUrl = `${window.location.origin}${window.location.pathname}#stats/${link.short_code}`;

        statsContent.innerHTML = `
            <div class="stats-header">
                <div class="stats-link-info">
                    <h3>${link.title || 'Sem título'}</h3>
                    <p>Destino: <a href="${link.original_url}" target="_blank">${link.original_url}</a></p>
                    <p>Tracking: <a href="${link.trackingUrl}" target="_blank">${link.trackingUrl}</a></p>
                    <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
                        <button onclick="copyStatsUrl('${statsUrl}')" class="action-btn secondary-btn" style="font-size: 11px; padding: 6px 12px;">
                            📋 Copiar Link do Dashboard
                        </button>
                    </div>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-card-value">${stats.totalClicks}</div>
                    <div class="stat-card-label">Total de Scans</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-value">${stats.uniqueScans || 0}</div>
                    <div class="stat-card-label">Visitantes Únicos</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-value">${stats.todayScans || 0}</div>
                    <div class="stat-card-label">Hoje ${trendIcon} ${trendText}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-value">${stats.clicksByCountry?.length || 0}</div>
                    <div class="stat-card-label">Países</div>
                </div>
            </div>

            ${stats.firstScan ? `
            <div class="chart-section" style="margin-bottom: 16px;">
                <div style="display: flex; gap: 24px; font-size: 12px; color: var(--text-tertiary);">
                    <span>📅 Primeiro scan: ${formatDateTime(stats.firstScan)}</span>
                    <span>🕐 Último scan: ${formatDateTime(stats.lastScan)}</span>
                </div>
            </div>
            ` : ''}

            ${stats.clicksByDay?.length > 0 ? `
            <div class="chart-section">
                <h4 class="chart-title">📊 Scans por Dia (últimos 7 dias)</h4>
                <div class="chart-container">
                    <div class="chart-bars">
                        ${renderDayChart(stats.clicksByDay)}
                    </div>
                </div>
            </div>
            ` : ''}

            ${stats.clicksByHour?.length > 0 ? `
            <div class="chart-section">
                <h4 class="chart-title">🕐 Scans por Hora do Dia</h4>
                <div class="chart-container">
                    <div class="chart-bars">
                        ${renderHourChart(stats.clicksByHour)}
                    </div>
                </div>
            </div>
            ` : ''}

            ${stats.clicksByCity?.length > 0 ? `
            <div class="chart-section">
                <h4 class="chart-title">🏙️ Top Cidades</h4>
                <div class="stats-list">
                    ${stats.clicksByCity.map(item => `
                        <div class="stats-list-item">
                            <span class="stats-list-label">${getCountryFlag(item.country)} ${item.city}</span>
                            <span class="stats-list-value">${item.count} scans</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            ${stats.clicksByCountry?.length > 0 ? `
            <div class="chart-section">
                <h4 class="chart-title">🌍 Por País</h4>
                <div class="stats-list">
                    ${stats.clicksByCountry.map(item => `
                        <div class="stats-list-item">
                            <span class="stats-list-label">${getCountryFlag(item.country)} ${item.country}</span>
                            <span class="stats-list-value">${item.count} scans</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            ${stats.clicksByDevice?.length > 0 ? `
            <div class="chart-section">
                <h4 class="chart-title">📱 Por Dispositivo</h4>
                <div class="stats-list">
                    ${stats.clicksByDevice.map(item => `
                        <div class="stats-list-item">
                            <span class="stats-list-label">${getDeviceIcon(item.device_type)} ${item.device_type}</span>
                            <span class="stats-list-value">${item.count} scans</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            ${stats.recentClicks?.length > 0 ? `
            <div class="chart-section">
                <h4 class="chart-title">Últimos Scans</h4>
                <div class="recent-clicks">
                    ${stats.recentClicks.map(click => `
                        <div class="click-item">
                            <div class="click-info">
                                <div class="click-device-icon">
                                    ${getDeviceIcon(click.device_type)}
                                </div>
                                <div class="click-details">
                                    <strong>${click.country}${click.city ? ', ' + click.city : ''}</strong>
                                    <span>${click.browser} • ${click.os}</span>
                                </div>
                            </div>
                            <span class="click-time">${formatDateTime(click.clicked_at)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : `
            <div class="qr-list-empty">
                <p>Nenhum scan registrado ainda</p>
                <span>Escaneie o QR Code para ver as estatísticas</span>
            </div>
            `}
        `;

    } catch (error) {
        console.error('Error loading stats:', error);
        statsContent.innerHTML = `
            <div class="qr-list-empty">
                <p>Erro ao carregar estatísticas</p>
                <span>${error.message}</span>
            </div>
        `;
    }
}

/**
 * Helper functions
 */
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
}

function formatDateTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Copy stats URL to clipboard
 */
function copyStatsUrl(url) {
    navigator.clipboard.writeText(url).then(() => {
        showToast('Link copiado! Salve para acessar as estatísticas depois.', 'success');
    }).catch(() => {
        showToast('Erro ao copiar link', 'error');
    });
}

function getMostCommon(items) {
    if (!items || items.length === 0) return '-';
    return items[0].device_type || items[0].country || '-';
}

function getCountryFlag(countryCode) {
    if (!countryCode || countryCode === 'unknown') return '🌍';
    try {
        const codePoints = countryCode
            .toUpperCase()
            .split('')
            .map(char => 127397 + char.charCodeAt());
        return String.fromCodePoint(...codePoints);
    } catch {
        return '🌍';
    }
}

function getDeviceIcon(deviceType) {
    const icons = {
        mobile: '<svg viewBox="0 0 24 24" fill="none" style="width:16px;height:16px"><rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" stroke-width="2"/><line x1="12" y1="18" x2="12" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
        tablet: '<svg viewBox="0 0 24 24" fill="none" style="width:16px;height:16px"><rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" stroke-width="2"/><line x1="12" y1="18" x2="12" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
        desktop: '<svg viewBox="0 0 24 24" fill="none" style="width:16px;height:16px"><rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" stroke-width="2"/><path d="M8 21h8M12 17v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
    };
    return icons[deviceType] || icons.desktop;
}

function renderDayChart(clicksByDay) {
    // Get last 7 days
    const last7Days = clicksByDay.slice(0, 7).reverse();
    const maxCount = Math.max(...last7Days.map(d => d.count), 1);

    return last7Days.map(day => {
        const height = (day.count / maxCount) * 100;
        const dateLabel = new Date(day.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        return `
            <div class="chart-bar" style="height: ${Math.max(height, 3)}%" title="${day.count} scans">
                <span class="chart-bar-label">${dateLabel}</span>
            </div>
        `;
    }).join('');
}

function renderHourChart(clicksByHour) {
    // Create array for all 24 hours
    const hoursData = Array(24).fill(0);
    clicksByHour.forEach(h => {
        const hour = parseInt(h.hour);
        if (!isNaN(hour) && hour >= 0 && hour < 24) {
            hoursData[hour] = h.count;
        }
    });

    const maxCount = Math.max(...hoursData, 1);

    // Show every 3rd hour for readability
    return hoursData.map((count, hour) => {
        const height = (count / maxCount) * 100;
        const showLabel = hour % 3 === 0;
        return `
            <div class="chart-bar" style="height: ${Math.max(height, 3)}%; flex: 1; max-width: 20px;" title="${hour}h: ${count} scans">
                ${showLabel ? `<span class="chart-bar-label">${hour}h</span>` : ''}
            </div>
        `;
    }).join('');
}
