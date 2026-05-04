document.addEventListener('DOMContentLoaded', () => {
    // --- DÁN URL GOOGLE APPS SCRIPT CỦA BẠN VÀO ĐÂY ---
    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx3XJUA5LuNUjN0KAFNyWkONqblzqEXAvkmhHr1oWUMoF4iunE22pTpJigMbJfnvY4y/exec"; 
    const EXPECTED_AMOUNT = 199000;
    const GROUP_URL = "https://zalo.me/g/o6nheqcgncsmefoyxtd1";
    // ------------------------------------------------

    const qrOpen = document.getElementById('qr-open');
    const qrClose = document.getElementById('qr-close');
    const qrModal = document.getElementById('qr-modal');
    const shareBtn = document.getElementById('share-btn');

    const paymentOpen = document.getElementById('payment-open');
    const paymentClose = document.getElementById('payment-close');
    const paymentModal = document.getElementById('payment-modal');
    let paymentCheckInterval;

    // QR Modal Logic
    qrOpen.addEventListener('click', () => {
        qrModal.classList.add('active');
    });

    qrClose.addEventListener('click', () => {
        qrModal.classList.remove('active');
    });

    // Payment Modal Logic
    const confirmZaloBtn = document.getElementById('confirm-zalo-btn');
    const zaloPhoneInput = document.getElementById('user-zalo-phone');
    const zaloStep = document.getElementById('zalo-verify-step');
    const paymentDetails = document.getElementById('payment-details');
    const copyBtn = document.getElementById('copy-btn');
    const copyText = document.getElementById('copy-text');
    const qrCodeImg = document.getElementById('qr-code-img');
    const paymentStatus = document.getElementById('payment-status');
    const paymentSuccess = document.getElementById('payment-success');
    const paymentError = document.getElementById('payment-error');
    const paymentErrorText = document.getElementById('payment-error-text');
    const groupLink = document.getElementById('group-link');

    paymentOpen.addEventListener('click', () => {
        paymentModal.classList.add('active');
        resetPaymentUI();
    });

    paymentClose.addEventListener('click', () => {
        paymentModal.classList.remove('active');
        stopPaymentPolling();
    });

    groupLink.addEventListener('click', (e) => {
        if (groupLink.getAttribute('aria-disabled') === 'true') {
            e.preventDefault();
        }
    });

    let currentPhone = "";
    let phoneCheckRequest = 0;

    function normalizePhone(phone) {
        return phone.replace(/\D/g, '');
    }

    async function checkPhoneExists(phone) {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=checkPhone&phone=${encodeURIComponent(phone)}`);
        const data = await response.json();
        return Boolean(data.exists);
    }

    function setConfirmButtonDisabled(disabled) {
        confirmZaloBtn.disabled = disabled;
        confirmZaloBtn.style.opacity = disabled ? '0.5' : '1';
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
        return data.paid === true && getPaymentAmount(data) === EXPECTED_AMOUNT;
    }

    function showPaymentError(message) {
        paymentStatus.style.display = 'none';
        paymentSuccess.style.display = 'none';
        paymentErrorText.innerText = message;
        paymentError.style.display = 'block';
    }

    function resetPaymentUI() {
        stopPaymentPolling();
        currentPhone = "";
        document.getElementById('user-name').value = '';
        zaloPhoneInput.value = '';
        phoneError.style.display = 'none';
        setConfirmButtonDisabled(false);
        copyText.innerText = 'NM0000 090xxxxxxx';
        copyBtn.innerText = 'Sao chép';
        qrCodeImg.removeAttribute('src');
        paymentStatus.style.display = 'block';
        paymentSuccess.style.display = 'none';
        paymentError.style.display = 'none';
        paymentErrorText.innerText = '';
        groupLink.href = 'javascript:void(0)';
        groupLink.setAttribute('aria-disabled', 'true');
        zaloStep.style.display = 'block';
        paymentDetails.style.display = 'none';
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

    // --- KIỂM TRA SĐT TRỰC TIẾP KHI NHẬP ---
    const phoneError = document.getElementById('phone-error');
    zaloPhoneInput.addEventListener('input', async () => {
        const phone = normalizePhone(zaloPhoneInput.value);
        const requestId = ++phoneCheckRequest;
        phoneError.style.display = 'none';
        setConfirmButtonDisabled(false);

        if (phone.length >= 10) {
            try {
                const exists = await checkPhoneExists(phone);
                if (requestId !== phoneCheckRequest) return;

                if (exists) {
                    phoneError.style.display = 'block';
                    setConfirmButtonDisabled(true);
                }
            } catch (e) {}
        }
    });

    confirmZaloBtn.addEventListener('click', async () => {
        const name = document.getElementById('user-name').value.trim();
        const phone = normalizePhone(zaloPhoneInput.value);
        
        if (!name || phone.length < 10) {
            alert('Vui lòng nhập đầy đủ Họ tên và Số điện thoại hợp lệ!');
            return;
        }

        setConfirmButtonDisabled(true);

        try {
            const exists = await checkPhoneExists(phone);
            if (exists) {
                phoneError.style.display = 'block';
                return;
            }
        } catch (e) {
            alert('Chưa kiểm tra được số điện thoại. Vui lòng thử lại sau!');
            setConfirmButtonDisabled(false);
            return;
        }
        
        currentPhone = phone;
        // Tạo mã giao dịch ngẫu nhiên
        const txId = Math.floor(1000 + Math.random() * 9000);
        const fullTxId = `NM${txId}`;
        
        const cleanName = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
        const memo = `${fullTxId} ${phone} ${cleanName}`;
        
        document.getElementById('copy-text').innerText = memo;

        const qrUrl = `https://img.vietqr.io/image/MB-202159-compact.png?amount=${EXPECTED_AMOUNT}&addInfo=${encodeURIComponent(memo)}&accountName=NHAT%20MINH`;
        document.getElementById('qr-code-img').src = qrUrl;
        
        zaloStep.style.display = 'none';
        paymentDetails.style.display = 'block';
        startPaymentPolling(fullTxId, currentPhone);
    });

    copyBtn.addEventListener('click', async () => {
        const text = copyText.innerText.trim();

        if (await copyToClipboard(text)) {
            copyBtn.innerText = 'Đã sao chép';
            setTimeout(() => {
                copyBtn.innerText = 'Sao chép';
            }, 1600);
        } else {
            alert('Không thể sao chép tự động. Vui lòng sao chép thủ công nội dung chuyển khoản.');
        }
    });

    // ... (Giữ nguyên các hàm khác) ...

    function startPaymentPolling(txId, phone) {
        stopPaymentPolling();
        paymentCheckInterval = setInterval(async () => {
            try {
                // Gửi kèm cả SĐT để Google đối soát chính xác
                const params = new URLSearchParams({
                    id: txId,
                    phone,
                    amount: String(EXPECTED_AMOUNT)
                });
                const response = await fetch(`${GOOGLE_SCRIPT_URL}?${params.toString()}`);
                const data = await response.json();
                
                if (data.paid) {
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
        if (e.target === qrModal) qrModal.classList.remove('active');
        if (e.target === paymentModal) {
            paymentModal.classList.remove('active');
            stopPaymentPolling();
        }
    });

    // Share Logic
    shareBtn.addEventListener('click', async (e) => {
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

    // Save Contact (VCard) Logic
    const saveBtn = document.getElementById('save-contact-btn');
    saveBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const vcard = "BEGIN:VCARD\n" +
                      "VERSION:3.0\n" +
                      "FN:MINH marcom\n" +
                      "TEL;TYPE=CELL:0584556556\n" +
                      "END:VCARD";
        
        const blob = new Blob([vcard], { type: "text/vcard" });
        const url = window.URL.createObjectURL(blob);
        const newLink = document.createElement('a');
        newLink.href = url;
        newLink.setAttribute('download', 'MINH_marcom.vcf');
        newLink.click();
        window.URL.revokeObjectURL(url);
    });

    // Add scroll effect to header
    window.addEventListener('scroll', () => {
        const header = document.querySelector('.header');
        const scroll = window.scrollY;
        if (scroll > 50) {
            header.style.opacity = '0.8';
        } else {
            header.style.opacity = '1';
        }
    });
});
