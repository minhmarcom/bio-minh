let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    document.getElementById('install-app')?.removeAttribute('hidden');
});

window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    document.getElementById('install-app')?.setAttribute('hidden', '');
});

document.addEventListener('DOMContentLoaded', () => {
    // --- DÁN URL GOOGLE APPS SCRIPT CỦA BẠN VÀO ĐÂY ---
    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxfwoEyv7tM-RFSuw9zuOcwYaLuqT-3SALStRkEMom7_sLPNnrstCUrI5NF5tBOHrly/exec";
    const SHEET_GVIZ_URL = "https://docs.google.com/spreadsheets/d/1Vy7Qjc5M4x7y6p89L81OuTsUGsRPAEywI_8_2nmRzsQ/gviz/tq?gid=0";
    const EXPECTED_AMOUNT = 199000;
    const GROUP_URL = "https://zalo.me/g/o6nheqcgncsmefoyxtd1";
    const ADMIN_URL = "https://zalo.me/0584556556";
    const PAYMENT_SUPPORT_DELAY_MS = 3 * 60 * 1000;
    // ------------------------------------------------

    const qrOpen = document.getElementById('qr-open');
    const shareBtn = document.getElementById('share-btn');

    const paymentOpen = document.getElementById('payment-open');
    const paymentClose = document.getElementById('payment-close');
    const paymentModal = document.getElementById('payment-modal');
    const enterpriseModal = document.getElementById('enterprise-modal');
    const certificateModal = document.getElementById('certificate-modal');
    const certificatePreview = document.getElementById('certificate-preview');
    const certificateModalTitle = document.getElementById('certificate-modal-title');
    const certificateClose = document.getElementById('certificate-close');
    const cartOpen = document.getElementById('cart-open');
    const cartClose = document.getElementById('cart-close');
    const cartModal = document.getElementById('cart-modal');
    const cartItems = document.getElementById('cart-items');
    const cartEmpty = document.getElementById('cart-empty');
    const cartTotal = document.getElementById('cart-total');
    const cartTotalValue = document.getElementById('cart-total-value');
    const cartCount = document.getElementById('cart-count');
    
    // Steps containers
    const benefitsStep = document.getElementById('benefits-step');
    const zaloStep = document.getElementById('zalo-verify-step');
    const paymentDetails = document.getElementById('payment-details');
    const modalTitle = document.getElementById('modal-title');
    
    // Buttons
    const startRegisterBtn = document.getElementById('start-register-btn');
    const backToBenefitsBtn = document.getElementById('back-to-benefits');
    const confirmZaloBtn = document.getElementById('confirm-zalo-btn');
    const retryPaymentBtn = document.getElementById('retry-payment-btn');
    const editInfoBtn = document.getElementById('edit-info-btn');
    const copyBtn = document.getElementById('copy-btn');
    
    // Other elements
    const zaloPhoneInput = document.getElementById('user-zalo-phone');
    const copyText = document.getElementById('copy-text');
    const qrCodeImg = document.getElementById('qr-code-img');
    const qrLoader = document.getElementById('qr-loader');
    const paymentStatus = document.getElementById('payment-status');
    const paymentStatusText = document.getElementById('payment-status-text');
    const paymentWaitHelp = document.getElementById('payment-wait-help');
    const paymentAdminLink = document.getElementById('payment-admin-link');
    const paymentSuccess = document.getElementById('payment-success');
    const paymentError = document.getElementById('payment-error');
    const paymentErrorText = document.getElementById('payment-error-text');
    const groupLink = document.getElementById('group-link');
    
    let paymentCheckInterval;
    let paymentSupportTimer;

    const enterpriseOpen = document.getElementById('enterprise-open');
    const enterpriseClose = document.getElementById('enterprise-close');
    const installAppBtn = document.getElementById('install-app');
    const appToast = document.getElementById('app-toast');
    let toastTimer;
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

    if (isIos && !isStandalone) installAppBtn?.removeAttribute('hidden');

    function showAppToast(message) {
        if (!appToast) return;
        appToast.textContent = message;
        appToast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => appToast.classList.remove('show'), 2600);
    }

    installAppBtn?.addEventListener('click', async () => {
        if (!deferredInstallPrompt) {
            showAppToast(isIos
                ? 'Chạm Chia sẻ, sau đó chọn “Thêm vào MH chính”.'
                : 'Mở menu trình duyệt và chọn “Cài đặt ứng dụng”.');
            return;
        }

        deferredInstallPrompt.prompt();
        await deferredInstallPrompt.userChoice;
        deferredInstallPrompt = null;
        installAppBtn.setAttribute('hidden', '');
    });

    const appContainer = document.querySelector('.container');
    const appViews = [...document.querySelectorAll('[data-view]')];
    const validViews = new Set(appViews.map((view) => view.dataset.view));

    // Support legacy hash redirection
    const currentHash = (window.location.hash || '').toLowerCase();
    if (currentHash === '#projects') {
        window.location.replace('/du-an/');
        return;
    } else if (currentHash === '#services') {
        window.location.replace('/dich-vu/');
        return;
    } else if (currentHash === '#certificates') {
        window.location.replace('/chung-nhan/');
        return;
    } else if (currentHash === '#home') {
        if (window.history.replaceState) {
            window.history.replaceState(null, '', window.location.pathname);
        }
    }

    if (appViews.length > 1) {
        function showAppView(requestedView, updateHistory = false) {
            const viewName = validViews.has(requestedView) ? requestedView : 'home';

            appViews.forEach((view) => {
                const isActive = view.dataset.view === viewName;
                view.classList.toggle('is-active', isActive);
                view.setAttribute('aria-hidden', String(!isActive));
            });

            document.body.dataset.currentView = viewName;
            document.querySelectorAll('[data-nav-view]').forEach((item) => {
                item.classList.toggle('active', item.dataset.navView === viewName);
            });

            if (updateHistory && window.location.hash !== `#${viewName}`) {
                window.history.pushState({ view: viewName }, '', `#${viewName}`);
            }

            appContainer?.scrollTo({ top: 0, behavior: 'auto' });
        }

        document.querySelectorAll('a[href^="#"]').forEach((link) => {
            link.addEventListener('click', (event) => {
                const targetHash = link.getAttribute('href');
                if (targetHash === '#projects') {
                    window.location.href = '/du-an/';
                    return;
                }
                if (targetHash === '#services') {
                    window.location.href = '/dich-vu/';
                    return;
                }
                if (targetHash === '#certificates') {
                    window.location.href = '/chung-nhan/';
                    return;
                }
                if (targetHash === '#home') {
                    window.location.href = '/';
                    return;
                }
                const viewName = targetHash.slice(1);
                if (!validViews.has(viewName)) return;
                event.preventDefault();
                showAppView(viewName, true);
            });
        });

        window.addEventListener('popstate', () => {
            showAppView(window.location.hash.slice(1) || 'home');
        });

        showAppView(window.location.hash.slice(1) || 'home');
    } else if (appViews.length === 1) {
        appViews[0].classList.add('is-active');
        appViews[0].setAttribute('aria-hidden', 'false');
    }

    window.addEventListener('offline', () => showAppToast('Bạn đang ngoại tuyến. Nội dung đã lưu vẫn có thể xem.'));
    window.addEventListener('online', () => showAppToast('Đã kết nối lại Internet.'));

    function openPaymentModal() {
        paymentModal?.classList.add('active');
        resetPaymentUI();
    }

    paymentOpen?.addEventListener('click', openPaymentModal);

    paymentClose?.addEventListener('click', () => {
        paymentModal?.classList.remove('active');
        stopPaymentPolling();
    });

    function openEnterpriseModal() {
        enterpriseModal?.classList.add('active');
    }

    enterpriseOpen?.addEventListener('click', openEnterpriseModal);

    enterpriseClose?.addEventListener('click', () => {
        enterpriseModal?.classList.remove('active');
    });

    const serviceProducts = {
        prompt: {
            name: 'Cộng đồng Prompt AI',
            price: 199000,
            action: 'Thanh toán',
            open: openPaymentModal
        },
        enterprise: {
            name: 'Tư vấn ứng dụng AI',
            price: 4999000,
            action: 'Đặt tư vấn',
            open: openEnterpriseModal
        }
    };

    function loadCart() {
        try {
            const saved = JSON.parse(window.sessionStorage.getItem('minhMarcomCart') || '[]');
            return new Set(saved.filter((id) => serviceProducts[id]));
        } catch (error) {
            return new Set();
        }
    }

    const selectedServices = loadCart();

    function saveCart() {
        try {
            window.sessionStorage.setItem('minhMarcomCart', JSON.stringify([...selectedServices]));
        } catch (error) {
            console.log('Cart storage is unavailable.');
        }
    }

    function closeCartModal() {
        cartModal?.classList.remove('active');
        cartModal?.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
    }

    function runServiceAction(productId) {
        closeCartModal();
        serviceProducts[productId]?.open();
    }

    function renderCart() {
        cartItems?.replaceChildren();
        const selectedIds = [...selectedServices];

        document.querySelectorAll('[data-cart-add]').forEach((button) => {
            const isSelected = selectedServices.has(button.dataset.cartAdd);
            button.classList.toggle('is-added', isSelected);
            button.setAttribute('aria-pressed', String(isSelected));
            const label = button.querySelector('span');
            if (label) label.textContent = isSelected ? 'Đã thêm vào giỏ' : 'Thêm vào giỏ';
        });

        if (cartCount) {
            cartCount.textContent = String(selectedIds.length);
            cartCount.hidden = selectedIds.length === 0;
        }
        if (cartEmpty) cartEmpty.hidden = selectedIds.length > 0;
        if (cartTotal) cartTotal.hidden = selectedIds.length === 0;

        const total = selectedIds.reduce((sum, id) => sum + serviceProducts[id].price, 0);
        if (cartTotalValue) cartTotalValue.textContent = `${total.toLocaleString('vi-VN')}đ`;

        selectedIds.forEach((productId) => {
            const product = serviceProducts[productId];
            const item = document.createElement('div');
            item.className = 'cart-item';

            const info = document.createElement('div');
            info.className = 'cart-item-info';
            const name = document.createElement('strong');
            name.textContent = product.name;
            const price = document.createElement('small');
            price.textContent = `${product.price.toLocaleString('vi-VN')}đ`;
            info.append(name, price);

            const controls = document.createElement('div');
            controls.className = 'cart-item-controls';
            const action = document.createElement('button');
            action.type = 'button';
            action.className = 'cart-item-action';
            action.textContent = product.action;
            action.addEventListener('click', () => runServiceAction(productId));

            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'cart-item-remove';
            remove.setAttribute('aria-label', `Xóa ${product.name} khỏi giỏ`);
            const removeIcon = document.createElement('i');
            removeIcon.setAttribute('data-lucide', 'trash-2');
            remove.append(removeIcon);
            remove.addEventListener('click', () => {
                selectedServices.delete(productId);
                saveCart();
                renderCart();
            });

            controls.append(action, remove);
            item.append(info, controls);
            cartItems?.append(item);
        });

        window.lucide?.createIcons();
    }

    document.querySelectorAll('[data-cart-add]').forEach((button) => {
        button.addEventListener('click', () => {
            const productId = button.dataset.cartAdd;
            if (selectedServices.has(productId)) {
                selectedServices.delete(productId);
                showAppToast('Đã bỏ dịch vụ khỏi giỏ hàng.');
            } else {
                selectedServices.add(productId);
                showAppToast('Đã thêm dịch vụ vào giỏ hàng.');
            }
            saveCart();
            renderCart();
        });
    });

    cartOpen?.addEventListener('click', () => {
        appToast?.classList.remove('show');
        renderCart();
        cartModal?.classList.add('active');
        cartModal?.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        cartClose?.focus();
    });

    cartClose?.addEventListener('click', closeCartModal);
    renderCart();

    function closeCertificateModal() {
        certificateModal?.classList.remove('active');
        certificateModal?.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
    }

    document.querySelectorAll('.certificate-card').forEach((card) => {
        card.addEventListener('click', () => {
            const image = card.dataset.certificateImage;
            const title = card.dataset.certificateTitle || 'Chứng nhận';
            certificatePreview.src = image;
            certificatePreview.alt = `Chứng nhận ${title} của Lâm Nhật Minh`;
            certificateModalTitle.textContent = title;
            certificateModal.classList.add('active');
            certificateModal.setAttribute('aria-hidden', 'false');
            document.body.classList.add('modal-open');
            certificateClose.focus();
        });
    });

    certificateClose?.addEventListener('click', closeCertificateModal);

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && certificateModal?.classList.contains('active')) {
            closeCertificateModal();
        }
        if (event.key === 'Escape' && cartModal?.classList.contains('active')) {
            closeCartModal();
        }
    });

    startRegisterBtn?.addEventListener('click', () => {
        showStep(2);
    });

    backToBenefitsBtn?.addEventListener('click', () => {
        showStep(1);
    });

    groupLink?.addEventListener('click', (e) => {
        if (groupLink.getAttribute('aria-disabled') === 'true') {
            e.preventDefault();
        }
    });

    let currentPhone = "";
    let currentName = "";
    let currentTxId = "";
    let currentMemo = "";
    let phoneCheckRequest = 0;
    const phoneCache = {}; // Cache kết quả kiểm tra SĐT

    function normalizePhone(phone) {
        return phone.replace(/\D/g, '');
    }

    async function fetchJson(url) {
        const response = await fetch(url, { cache: 'no-store' });
        const text = await response.text();

        try {
            return JSON.parse(text);
        } catch (e) {
            throw new Error(text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || 'Invalid JSON response');
        }
    }

    function normalizeText(value) {
        return String(value || '').trim().toLowerCase();
    }

    function normalizeMemo(value) {
        return normalizeText(value).replace(/\s+/g, ' ');
    }

    async function checkPhoneExists(phone) {
        if (phoneCache[phone] !== undefined) return phoneCache[phone];
        
        try {
            const data = await fetchJson(`${GOOGLE_SCRIPT_URL}?action=checkPhone&phone=${encodeURIComponent(phone)}`);
            const exists = Boolean(data.exists);
            phoneCache[phone] = exists;
            return exists;
        } catch (e) {
            return false;
        }
    }

    function setConfirmButtonDisabled(disabled, loading = false) {
        confirmZaloBtn.disabled = disabled;
        confirmZaloBtn.style.opacity = disabled ? '0.5' : '1';
        if (loading) {
            confirmZaloBtn.innerHTML = '<span class="loader" style="width: 16px; height: 16px; border-width: 2px; border-top-color: white; margin-right: 8px;"></span> Đang xử lý...';
        } else {
            confirmZaloBtn.innerHTML = 'Tiếp tục';
        }
    }

    function getPaymentAmount(data) {
        const source = data.payment ?? data.transaction ?? data;
        const amountValue = source.amount ??
            source.paidAmount ??
            source.transferAmount ??
            source.transfer_amount ??
            source.transactionAmount ??
            source.transaction_amount ??
            source.money ??
            source.value ??
            source.creditAmount ??
            source.credit_amount ??
            source["Số tiền"] ??
            source["So tien"];

        if (amountValue === undefined || amountValue === null || amountValue === '') return null;
        const amount = Number(String(amountValue).replace(/[^\d]/g, ''));
        return Number.isFinite(amount) ? amount : null;
    }

    function isExactPayment(data) {
        const status = getPaymentStatus(data);
        return (data.paid === true || status === 'paid') && getPaymentAmount(data) === EXPECTED_AMOUNT;
    }

    function getPaymentStatus(data) {
        const source = data.payment ?? data.transaction ?? data;
        return String(source.status || data.status || '').toLowerCase();
    }

    function hasPaymentResult(data) {
        const status = getPaymentStatus(data);
        return data.paid === true ||
            status === 'paid' ||
            status === 'wrong_amount' ||
            data.correctAmount === false;
    }

    function showPaymentError(message) {
        paymentStatus.style.display = 'none';
        paymentSuccess.style.display = 'none';
        paymentErrorText.innerText = message;
        paymentError.style.display = 'block';
    }

    function setWaitingPaymentState() {
        paymentStatus.style.display = 'block';
        paymentSuccess.style.display = 'none';
        paymentError.style.display = 'none';
        paymentErrorText.innerText = '';
        paymentStatusText.innerText = 'Hệ thống đang chờ tiền vào tài khoản...';
        paymentWaitHelp.style.display = 'none';
        paymentAdminLink.href = ADMIN_URL;
        groupLink.href = 'javascript:void(0)';
        groupLink.setAttribute('aria-disabled', 'true');
    }

    function showDelayedSupport() {
        paymentStatusText.innerText = 'Hệ thống vẫn đang đối soát giao dịch của bạn...';
        paymentWaitHelp.style.display = 'block';
    }

    function showStep(step) {
        benefitsStep.style.display = (step === 1) ? 'block' : 'none';
        zaloStep.style.display = (step === 2) ? 'block' : 'none';
        paymentDetails.style.display = (step === 3) ? 'block' : 'none';
        
        if (step === 1) modalTitle.innerText = "Tham gia cộng đồng Prompt AI";
        if (step === 2) modalTitle.innerText = "Thông tin đăng ký";
        if (step === 3) modalTitle.innerText = "Thanh toán dịch vụ";
    }

    function resetPaymentUI() {
        stopPaymentPolling();
        currentPhone = "";
        currentName = "";
        currentTxId = "";
        currentMemo = "";
        document.getElementById('user-name').value = '';
        zaloPhoneInput.value = '';
        phoneError.style.display = 'none';
        setConfirmButtonDisabled(false);
        copyText.innerText = 'NM0000 090xxxxxxx';
        copyBtn.innerText = 'Sao chép nội dung';
        qrCodeImg.style.display = 'none';
        qrLoader.style.display = 'block';
        qrCodeImg.removeAttribute('src');
        setWaitingPaymentState();
        showStep(1);
    }

    function showInfoStep() {
        stopPaymentPolling();
        currentTxId = "";
        currentMemo = "";
        copyText.innerText = 'NM0000 090xxxxxxx';
        copyBtn.innerText = 'Sao chép nội dung';
        qrCodeImg.style.display = 'none';
        qrLoader.style.display = 'block';
        qrCodeImg.removeAttribute('src');
        setWaitingPaymentState();
        showStep(2);
        setConfirmButtonDisabled(false);
    }

    function copySelectedText() {
        let copied = false;
        try {
            copied = document.execCommand('copy');
        } catch (e) {
            copied = false;
        }
        return copied;
    }

    function copyFromVisibleMemo() {
        const range = document.createRange();
        const selection = window.getSelection();

        range.selectNodeContents(copyText);
        selection.removeAllRanges();
        selection.addRange(range);

        const copied = copySelectedText();
        selection.removeAllRanges();
        return copied;
    }

    async function copyToClipboard(text) {
        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (e) {}
        }

        const dummy = document.createElement('textarea');
        dummy.value = text;
        dummy.setAttribute('readonly', '');
        dummy.style.position = 'fixed';
        dummy.style.top = '0';
        dummy.style.left = '0';
        dummy.style.width = '1px';
        dummy.style.height = '1px';
        dummy.style.opacity = '0';
        document.body.appendChild(dummy);
        dummy.focus();
        dummy.select();
        dummy.setSelectionRange(0, dummy.value.length);

        let copied = copySelectedText();

        document.body.removeChild(dummy);
        return copied || copyFromVisibleMemo();
    }

    async function saveCustomerToSheet(payload) {
        const params = new URLSearchParams({
            action: 'saveCustomer',
            name: payload.name,
            phone: payload.phone,
            txId: payload.txId,
            amount: String(EXPECTED_AMOUNT),
            memo: payload.memo,
            status: payload.status
        });

        try {
            await fetch(`${GOOGLE_SCRIPT_URL}?${params.toString()}`);
        } catch (e) {
            console.log('Saving customer info failed.');
        }
    }

    function loadSheetRowsViaJsonp() {
        return new Promise((resolve, reject) => {
            const callbackName = `sheetPaymentCallback_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
            const script = document.createElement('script');
            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error('Sheet fallback timed out'));
            }, 10000);

            function cleanup() {
                clearTimeout(timeout);
                delete window[callbackName];
                script.remove();
            }

            window[callbackName] = payload => {
                cleanup();

                if (!payload || payload.status !== 'ok' || !payload.table) {
                    reject(new Error('Sheet fallback returned no table'));
                    return;
                }

                const headers = payload.table.cols.map(col => col.label || col.id);
                const rows = payload.table.rows.map(row => {
                    return headers.reduce((record, header, index) => {
                        const cell = row.c && row.c[index];
                        record[header] = cell ? (cell.f ?? cell.v ?? '') : '';
                        return record;
                    }, {});
                });

                resolve(rows);
            };

            script.onerror = () => {
                cleanup();
                reject(new Error('Sheet fallback failed to load'));
            };
            script.src = `${SHEET_GVIZ_URL}&tqx=responseHandler:${callbackName};out:json&cacheBust=${Date.now()}`;
            document.body.appendChild(script);
        });
    }

    async function findPaymentInSheet(txId, phone, memo) {
        const rows = await loadSheetRowsViaJsonp();
        const cleanPhone = normalizePhone(phone);
        const cleanMemo = normalizeMemo(memo);

        const matches = rows.filter(row => {
            const rowTxId = String(row.txId || '').trim().toUpperCase();
            const rowPhone = normalizePhone(row.phone || row.memo || row.paidMemo || '');
            const rowMemo = normalizeMemo(`${row.memo || ''} ${row.paidMemo || ''}`);

            return rowTxId === txId.toUpperCase() ||
                (cleanMemo && rowMemo.includes(cleanMemo)) ||
                (rowTxId && cleanPhone && rowPhone.includes(cleanPhone) && cleanMemo.includes(rowTxId.toLowerCase()));
        });

        if (!matches.length) return null;

        const exactPaid = matches.find(row =>
            normalizeText(row.status) === 'paid' &&
            Number(String(row.paidAmount || row.amount || '').replace(/[^\d]/g, '')) === EXPECTED_AMOUNT
        );
        const wrongAmount = matches.find(row =>
            normalizeText(row.status) === 'wrong_amount' ||
            (row.paidAmount && Number(String(row.paidAmount).replace(/[^\d]/g, '')) !== EXPECTED_AMOUNT)
        );

        return exactPaid || wrongAmount || matches[matches.length - 1];
    }

    async function checkPaymentStatus(txId, phone) {
        const params = new URLSearchParams({
            id: txId,
            phone,
            name: currentName,
            amount: String(EXPECTED_AMOUNT),
            memo: currentMemo
        });

        try {
            return await fetchJson(`${GOOGLE_SCRIPT_URL}?${params.toString()}`);
        } catch (err) {
            console.log('Payment API failed, checking sheet fallback:', err.message);
            return findPaymentInSheet(txId, phone, currentMemo);
        }
    }

    function createPaymentSession(name, phone) {
        currentName = name;
        currentPhone = phone;

        const txId = Math.floor(1000 + Math.random() * 9000);
        const fullTxId = `NM${txId}`;
        const cleanName = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
        const memo = `${fullTxId} ${phone} ${cleanName}`;

        currentTxId = fullTxId;
        currentMemo = memo;
        copyText.innerText = memo;
        
        // QR Optimization: Show loader, set src, then show image when loaded
        qrCodeImg.style.display = 'none';
        qrLoader.style.display = 'block';
        
        const qrUrl = `https://img.vietqr.io/image/MB-202159-compact.png?amount=${EXPECTED_AMOUNT}&addInfo=${encodeURIComponent(memo)}&accountName=NHAT%20MINH`;
        
        // Pre-load image to ensure it appears "instantly" once ready
        const tempImg = new Image();
        tempImg.onload = () => {
            qrCodeImg.src = qrUrl;
            qrCodeImg.style.display = 'inline-block';
            qrLoader.style.display = 'none';
        };
        tempImg.src = qrUrl;

        setWaitingPaymentState();
        showStep(3);

        saveCustomerToSheet({
            name,
            phone,
            txId: fullTxId,
            memo,
            status: 'pending'
        });

        startPaymentPolling(fullTxId, phone);
    }

    // --- KIỂM TRA SĐT TRỰC TIẾP KHI NHẬP ---
    const phoneError = document.getElementById('phone-error');
    zaloPhoneInput?.addEventListener('input', async () => {
        const phone = normalizePhone(zaloPhoneInput.value);
        const requestId = ++phoneCheckRequest;
        if (phoneError) phoneError.style.display = 'none';
        setConfirmButtonDisabled(false);

        if (phone.length >= 10) {
            try {
                const exists = await checkPhoneExists(phone);
                if (requestId !== phoneCheckRequest) return;

                if (exists) {
                    if (phoneError) phoneError.style.display = 'block';
                    setConfirmButtonDisabled(true);
                }
            } catch (e) {}
        }
    });

    confirmZaloBtn?.addEventListener('click', async () => {
        const name = document.getElementById('user-name')?.value.trim();
        const phone = normalizePhone(zaloPhoneInput?.value || '');
        
        if (!name || phone.length < 10) {
            alert('Vui lòng nhập đầy đủ Họ tên và Số điện thoại hợp lệ!');
            return;
        }

        setConfirmButtonDisabled(true, true);

        try {
            // Kiểm tra số điện thoại
            const exists = await checkPhoneExists(phone);
            if (exists) {
                if (phoneError) phoneError.style.display = 'block';
                setConfirmButtonDisabled(true, false);
                return;
            }
        } catch (e) {
            // Nếu lỗi mạng, vẫn cho phép đi tiếp để không chặn người dùng
            console.log('Phone check failed, proceeding anyway.');
        }
        
        createPaymentSession(name, phone);
        // Reset button state after transition
        setTimeout(() => setConfirmButtonDisabled(false, false), 1000);
    });

    retryPaymentBtn?.addEventListener('click', () => {
        if (!currentName || !currentPhone) {
            showInfoStep();
            return;
        }

        createPaymentSession(currentName, currentPhone);
    });

    editInfoBtn?.addEventListener('click', () => {
        showInfoStep();
    });

    copyBtn?.addEventListener('click', async () => {
        const text = copyText.innerText.trim();

        if (await copyToClipboard(text)) {
            copyBtn.innerText = 'Đã sao chép';
            setTimeout(() => {
                copyBtn.innerText = 'Sao chép nội dung';
            }, 1600);
        } else {
            alert('Không thể sao chép tự động. Vui lòng sao chép thủ công nội dung chuyển khoản.');
        }
    });

    // ... (Giữ nguyên các hàm khác) ...

    function startPaymentPolling(txId, phone) {
        stopPaymentPolling();
        paymentSupportTimer = setTimeout(showDelayedSupport, PAYMENT_SUPPORT_DELAY_MS);
        paymentCheckInterval = setInterval(async () => {
            try {
                // Gửi kèm cả SĐT để Google đối soát chính xác
                const data = await checkPaymentStatus(txId, phone);
                if (!data) return;
                
                if (hasPaymentResult(data)) {
                    if (data.duplicatePhone || data.phoneExists) {
                        showPaymentError('Số điện thoại này đã được đăng ký trước đó nên chưa thể duyệt vào group.');
                        stopPaymentPolling();
                        return;
                    }

                    if (!isExactPayment(data)) {
                        showPaymentError('Số tiền chuyển khoản chưa đúng 199.000đ nên chưa thể mở link vào group.');
                        stopPaymentPolling();
                        return;
                    }

                    showPaymentSuccess();
                    stopPaymentPolling();
                }
            } catch (err) {
                console.log('Checking payment status...');
            }
        }, 4000);
    }

    function stopPaymentPolling() {
        if (paymentCheckInterval) {
            clearInterval(paymentCheckInterval);
            paymentCheckInterval = null;
        }
        if (paymentSupportTimer) {
            clearTimeout(paymentSupportTimer);
            paymentSupportTimer = null;
        }
    }

    function showPaymentSuccess() {
        paymentStatus.style.display = 'none';
        paymentError.style.display = 'none';
        groupLink.href = GROUP_URL;
        groupLink.removeAttribute('aria-disabled');
        paymentSuccess.style.display = 'block';
    }

    // Close on click outside
    window.addEventListener('click', (e) => {
        if (paymentModal && e.target === paymentModal) {
            paymentModal.classList.remove('active');
            stopPaymentPolling();
        }
        if (enterpriseModal && e.target === enterpriseModal) enterpriseModal.classList.remove('active');
        if (certificateModal && e.target === certificateModal) closeCertificateModal();
        if (cartModal && e.target === cartModal) closeCartModal();
    });

    // Share Logic
    shareBtn?.addEventListener('click', async (e) => {
        e.preventDefault();
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'NHẬT MINH marcom',
                    text: 'Kết nối với NHẬT MINH marcom - Chuyên gia Marketing & AI',
                    url: window.location.href
                });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            // Fallback: Copy to clipboard
            const dummy = document.createElement('input');
            document.body.appendChild(dummy);
            dummy.value = window.location.href;
            dummy.select();
            document.execCommand('copy');
            document.body.removeChild(dummy);
            alert('Đã sao chép liên kết vào bộ nhớ tạm!');
        }
    });

    // Save a complete vCard so mobile browsers can open the native contact flow.
    const saveBtn = document.getElementById('save-contact-btn');
    function saveContact(e) {
        e.preventDefault();
        const vcard = [
            'BEGIN:VCARD',
            'VERSION:3.0',
            'N:Minh;Lam Nhat;;;',
            'FN:Lâm Nhật Minh (MINH marcom)',
            'ORG:NHẬT MINH marcom',
            'TITLE:Marketing & AI Consultant',
            'TEL;TYPE=CELL:+84584556556',
            'EMAIL;TYPE=INTERNET:hi@lnm.vn',
            'URL:https://lnm.vn/',
            'X-SOCIALPROFILE;TYPE=facebook:https://www.facebook.com/nhatminh1911/',
            'X-SOCIALPROFILE;TYPE=zalo:https://zalo.me/0584556556',
            'NOTE:Marketing\, AI\, tự động hóa và phát triển sản phẩm số.',
            'END:VCARD'
        ].join('\r\n');

        const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const newLink = document.createElement('a');
        newLink.href = url;
        newLink.setAttribute('download', 'MINH-marcom.vcf');
        document.body.appendChild(newLink);
        newLink.click();
        newLink.remove();
        window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        showAppToast('Đang mở danh thiếp để lưu vào điện thoại.');
    }

    saveBtn?.addEventListener('click', saveContact);
    qrOpen?.addEventListener('click', saveContact);

    // Keep the mobile app bar visually separated as content scrolls underneath.
    appContainer?.addEventListener('scroll', () => {
        document.querySelector('.app-bar')?.classList.toggle('is-scrolled', appContainer.scrollTop > 16);
    });

    // ==========================================
    // CHATBOT WIDGET LOGIC (DRAGGABLE & INTERACTIVE)
    // ==========================================
    const chatbotWidget = document.getElementById('chatbot-widget');
    const chatbotPanel = document.getElementById('chatbot-panel');
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbotClose = document.getElementById('chatbot-close');
    const chatbotDismiss = document.getElementById('chatbot-dismiss');
    const chatbotForm = document.getElementById('chatbot-form');
    const chatbotInput = document.getElementById('chatbot-input');
    const chatbotMessages = document.getElementById('chatbot-messages');
    const chatbotTypeBubble = document.getElementById('chatbot-type-bubble');
    const chatbotTypeText = document.getElementById('chatbot-type-text');

    if (chatbotWidget && chatbotToggle) {
        let isChatbotDismissed = false;
        try {
            isChatbotDismissed = window.sessionStorage.getItem('minhChatbotDismissed') === '1';
        } catch (error) {
            isChatbotDismissed = false;
        }
        chatbotWidget.hidden = isChatbotDismissed;

        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let initialLeft = 0;
        let initialTop = 0;
        let dragDistance = 0;
        let isWidgetLeft = false;

        // --- TYPEWRITER CALLOUT BUBBLE ---
        const calloutMessages = [
            'Hỏi Minh về Prompt AI...',
            'Tư vấn thiết lập tự động hóa...',
            'Cần mẫu Prompt theo ngành?',
            'Xem bộ chứng nhận & dự án...'
        ];
        let currentCalloutIndex = 0;
        let typewriterTimer = null;
        let isTypewriting = false;

        function typeText(text, onComplete) {
            if (!chatbotTypeText) return;
            isTypewriting = true;
            chatbotTypeText.textContent = '';
            let charIndex = 0;

            function nextChar() {
                if (charIndex < text.length) {
                    chatbotTypeText.textContent += text.charAt(charIndex);
                    charIndex++;
                    typewriterTimer = setTimeout(nextChar, 50);
                } else {
                    isTypewriting = false;
                    if (onComplete) typewriterTimer = setTimeout(onComplete, 3500);
                }
            }
            nextChar();
        }

        function eraseText(onComplete) {
            if (!chatbotTypeText) return;
            isTypewriting = true;

            function prevChar() {
                const current = chatbotTypeText.textContent;
                if (current.length > 0) {
                    chatbotTypeText.textContent = current.slice(0, -1);
                    typewriterTimer = setTimeout(prevChar, 30);
                } else {
                    isTypewriting = false;
                    if (onComplete) typewriterTimer = setTimeout(onComplete, 400);
                }
            }
            prevChar();
        }

        function cycleTypewriter() {
            if (isChatbotDismissed || chatbotWidget.classList.contains('is-open') || isDragging) return;
            const message = calloutMessages[currentCalloutIndex];
            typeText(message, () => {
                eraseText(() => {
                    currentCalloutIndex = (currentCalloutIndex + 1) % calloutMessages.length;
                    cycleTypewriter();
                });
            });
        }

        // Start typewriter callout after 1.5s
        setTimeout(cycleTypewriter, 1500);

        // --- DRAGGABLE & MAGNETIC SNAP ---
        function onPointerDown(e) {
            if (e.target.closest('#chatbot-panel') || e.target.closest('#chatbot-close')) return;
            isDragging = false;
            dragDistance = 0;
            startX = e.clientX;
            startY = e.clientY;

            const rect = chatbotWidget.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;

            chatbotWidget.setPointerCapture?.(e.pointerId);
            window.addEventListener('pointermove', onPointerMove);
            window.addEventListener('pointerup', onPointerUp);
            window.addEventListener('pointercancel', onPointerUp);
        }

        function onPointerMove(e) {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            dragDistance = Math.hypot(dx, dy);

            if (dragDistance > 6) {
                if (!isDragging) {
                    isDragging = true;
                    chatbotWidget.classList.add('is-dragging');
                    clearTimeout(typewriterTimer);
                    if (chatbotTypeBubble) chatbotTypeBubble.setAttribute('aria-hidden', 'true');
                }

                let newLeft = initialLeft + dx;
                let newTop = initialTop + dy;

                const maxLeft = window.innerWidth - chatbotWidget.offsetWidth - 12;
                const maxTop = window.innerHeight - chatbotWidget.offsetHeight - 12;
                newLeft = Math.max(12, Math.min(newLeft, maxLeft));
                newTop = Math.max(12, Math.min(newTop, maxTop));

                chatbotWidget.style.left = `${newLeft}px`;
                chatbotWidget.style.top = `${newTop}px`;
                chatbotWidget.style.right = 'auto';
                chatbotWidget.style.bottom = 'auto';
            }
        }

        function onPointerUp(e) {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('pointercancel', onPointerUp);

            if (isDragging) {
                chatbotWidget.classList.remove('is-dragging');

                const rect = chatbotWidget.getBoundingClientRect();
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;

                // Snap magnetically to left or right edge
                isWidgetLeft = rect.left + rect.width / 2 < windowWidth / 2;
                const targetLeft = isWidgetLeft ? 16 : windowWidth - rect.width - 16;
                const targetTop = Math.max(16, Math.min(rect.top, windowHeight - rect.height - 80));

                chatbotWidget.style.transition = 'all 240ms cubic-bezier(0.16, 1, 0.3, 1)';
                chatbotWidget.style.left = `${targetLeft}px`;
                chatbotWidget.style.top = `${targetTop}px`;

                if (isWidgetLeft) {
                    chatbotWidget.classList.add('is-left');
                } else {
                    chatbotWidget.classList.remove('is-left');
                }

                setTimeout(() => {
                    chatbotWidget.style.transition = '';
                    isDragging = false;
                }, 260);
            }
        }

        chatbotToggle.addEventListener('pointerdown', onPointerDown);

        // --- OPEN / CLOSE PANEL ---
        function openChatPanel() {
            chatbotWidget.classList.add('is-open');
            chatbotPanel?.classList.add('is-open');
            chatbotPanel?.setAttribute('aria-hidden', 'false');
            chatbotToggle.setAttribute('aria-expanded', 'true');

            if (chatbotTypeBubble) chatbotTypeBubble.setAttribute('aria-hidden', 'true');
            clearTimeout(typewriterTimer);

            if (chatbotMessages) {
                chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
            }
            setTimeout(() => chatbotInput?.focus(), 150);
        }

        function closeChatPanel() {
            chatbotWidget.classList.remove('is-open');
            chatbotPanel?.classList.remove('is-open');
            chatbotPanel?.setAttribute('aria-hidden', 'true');
            chatbotToggle.setAttribute('aria-expanded', 'false');

            if (!isTypewriting) cycleTypewriter();
        }

        chatbotToggle.addEventListener('click', (e) => {
            if (dragDistance > 6) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }

            if (chatbotWidget.classList.contains('is-open')) {
                closeChatPanel();
            } else {
                openChatPanel();
            }
        });

        chatbotClose?.addEventListener('click', closeChatPanel);

        chatbotDismiss?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            isChatbotDismissed = true;
            clearTimeout(typewriterTimer);
            closeChatPanel();
            chatbotWidget.hidden = true;
            try {
                window.sessionStorage.setItem('minhChatbotDismissed', '1');
            } catch (error) {
                // The widget still stays hidden for the current page view.
            }
        });

        // Close on click outside widget
        document.addEventListener('click', (e) => {
            if (chatbotWidget.classList.contains('is-open') && !chatbotWidget.contains(e.target)) {
                closeChatPanel();
            }
        });

        // --- CHAT MESSAGES & BOT LOGIC ---
        function addChatMessage(content, sender = 'bot') {
            if (!chatbotMessages) return;
            const messageElem = document.createElement('p');
            messageElem.className = `chat-message ${sender}`;
            messageElem.textContent = content;
            chatbotMessages.appendChild(messageElem);
            chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        }

        function generateBotReply(userText) {
            const text = userText.toLowerCase();

            if (text.includes('giá') || text.includes('chi phí') || text.includes('bao nhiêu') || text.includes('199') || text.includes('500') || text.includes('prompt')) {
                return 'Gói "Cộng đồng Prompt AI" có mức phí 199.000đ (sử dụng trọn đời). Bạn có thể bấm "Thêm vào giỏ" ở mục Dịch vụ để đăng ký ngay!';
            }
            if (text.includes('tư vấn') || text.includes('doanh nghiệp') || text.includes('tự động') || text.includes('automation') || text.includes('quy trình')) {
                return 'Minh hỗ trợ Tư vấn & Xây dựng hệ thống AI / Tự động hóa công việc cho cá nhân & doanh nghiệp. Bạn có thể mở mục Dịch vụ và chọn "Đặt tư vấn" nhé!';
            }
            if (text.includes('chứng nhận') || text.includes('bằng cấp') || text.includes('certificate') || text.includes('học')) {
                return 'Minh sở hữu các chứng nhận chuyên sâu về Marketing, Prompt Engineering & AI. Bạn có thể chuyển sang trang "Chứng nhận" để xem chi tiết ảnh phóng to!';
            }
            if (text.includes('dự án') || text.includes('sản phẩm') || text.includes('portfolio') || text.includes('website')) {
                return 'Bạn có thể xem các dự án thực tế Minh đã thực hiện tại mục "Dự án". Minh chuyên phát triển landing page, web app và giải pháp AI.';
            }
            if (text.includes('zalo') || text.includes('sđt') || text.includes('điện thoại') || text.includes('liên hệ') || text.includes('gặp') || text.includes('gọi')) {
                return 'Bạn có thể trao đổi trực tiếp với Minh qua Zalo: 0584556556 hoặc quét mã QR ở trang chủ để lưu danh thiếp điện thoại!';
            }
            return 'Cảm ơn bạn đã nhắn tin! Bạn có thể xem các mục Dịch vụ, Dự án hoặc nhắn Zalo trực tiếp với Minh (0584556556) để được hỗ trợ nhanh nhất nhé!';
        }

        // Handle quick action buttons
        document.querySelectorAll('[data-chat-view]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const targetView = btn.dataset.chatView;

                if (targetView === 'services') {
                    showAppView('services', true);
                    addChatMessage('Đã chuyển tới mục Dịch vụ. Bạn có thể tham khảo gói Prompt AI hoặc Đặt tư vấn doanh nghiệp!', 'bot');
                } else if (targetView === 'projects') {
                    showAppView('projects', true);
                    addChatMessage('Đã chuyển tới danh mục Dự án nổi bật của Minh!', 'bot');
                } else if (targetView === 'certificates') {
                    showAppView('certificates', true);
                    addChatMessage('Đã mở danh sách Chứng nhận & Bằng cấp của Minh!', 'bot');
                }
            });
        });

        // Form submit message
        chatbotForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            const message = chatbotInput?.value.trim();
            if (!message) return;

            addChatMessage(message, 'user');
            chatbotInput.value = '';

            setTimeout(() => {
                const reply = generateBotReply(message);
                addChatMessage(reply, 'bot');
            }, 450);
        });
    }

    if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
        navigator.serviceWorker.register('./service-worker.js').catch((error) => {
            console.log('Service worker registration failed:', error);
        });
    }
});
