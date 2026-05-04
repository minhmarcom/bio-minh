document.addEventListener('DOMContentLoaded', () => {
    // --- DÁN URL GOOGLE APPS SCRIPT CỦA BẠN VÀO ĐÂY ---
    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx3XJUA5LuNUjN0KAFNyWkONqblzqEXAvkmhHr1oWUMoF4iunE22pTpJigMbJfnvY4y/exec"; 
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
    const displayZaloPhone = document.getElementById('display-zalo-phone');

    paymentOpen.addEventListener('click', () => {
        paymentModal.classList.add('active');
        resetPaymentUI();
    });

    let currentPhone = "";

    // --- KIỂM TRA SĐT TRỰC TIẾP KHI NHẬP ---
    const phoneError = document.getElementById('phone-error');
    zaloPhoneInput.addEventListener('input', async () => {
        const phone = zaloPhoneInput.value.trim();
        phoneError.style.display = 'none';
        confirmZaloBtn.disabled = false;

        if (phone.length >= 10) {
            try {
                const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=checkPhone&phone=${phone}`);
                const data = await res.json();
                if (data.exists) {
                    phoneError.style.display = 'block';
                    confirmZaloBtn.disabled = true;
                    confirmZaloBtn.style.opacity = '0.5';
                } else {
                    confirmZaloBtn.style.opacity = '1';
                }
            } catch (e) {}
        }
    });

    confirmZaloBtn.addEventListener('click', async () => {
        const name = document.getElementById('user-name').value.trim();
        const phone = zaloPhoneInput.value.trim();
        
        if (!name || phone.length < 10) {
            alert('Vui lòng nhập đầy đủ Họ tên và Số điện thoại hợp lệ!');
            return;
        }

        // Kiểm tra lần cuối trước khi tạo QR
        if (confirmZaloBtn.disabled) return;
        
        currentPhone = phone;
        // Tạo mã giao dịch ngẫu nhiên
        const txId = Math.floor(1000 + Math.random() * 9000);
        const fullTxId = `NM${txId}`;
        
        const cleanName = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
        const memo = `${fullTxId} ${phone} ${cleanName}`;
        
        document.getElementById('copy-text').innerText = memo;

        const qrUrl = `https://img.vietqr.io/image/MB-202159-compact.png?amount=199000&addInfo=${encodeURIComponent(memo)}&accountName=NHAT%20MINH`;
        document.getElementById('qr-code-img').src = qrUrl;
        
        zaloStep.style.display = 'none';
        paymentDetails.style.display = 'block';
        startPaymentPolling(fullTxId, currentPhone);
    });

    // ... (Giữ nguyên các hàm khác) ...

    function startPaymentPolling(txId, phone) {
        stopPaymentPolling();
        paymentCheckInterval = setInterval(async () => {
            try {
                // Gửi kèm cả SĐT để Google đối soát chính xác
                const response = await fetch(`${GOOGLE_SCRIPT_URL}?id=${txId}&phone=${phone}`);
                const data = await response.json();
                
                if (data.paid) {
                    showPaymentSuccess();
                    stopPaymentPolling();
                }
            } catch (err) {
                console.log('Checking payment status...');
            }
        }, 4000);
    }

    function stopPaymentPolling() {
        if (paymentCheckInterval) clearInterval(paymentCheckInterval);
    }

    function showPaymentSuccess() {
        document.getElementById('payment-status').style.display = 'none';
        document.getElementById('payment-success').style.display = 'block';
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
