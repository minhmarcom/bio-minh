document.addEventListener('DOMContentLoaded', () => {
    // --- DÁN URL GOOGLE APPS SCRIPT CỦA BẠN VÀO ĐÂY ---
    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxCPhsQnHi0c2ACQzCAzbhIGKQ2jliUOiBmcrvQ1Daox9I1-5P_4dICGDY1LixRgbp9/exec"; 
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
    paymentOpen.addEventListener('click', () => {
        // Tạo mã giao dịch ngẫu nhiên
        const txId = Math.floor(1000 + Math.random() * 9000);
        const fullTxId = `PMT${txId}`;
        document.getElementById('tx-code').innerText = txId;
        
        paymentModal.classList.add('active');
        resetPaymentUI();
        startPaymentPolling(fullTxId);
    });

    paymentClose.addEventListener('click', () => {
        paymentModal.classList.remove('active');
        stopPaymentPolling();
    });

    function resetPaymentUI() {
        document.getElementById('payment-status').style.display = 'block';
        document.getElementById('payment-success').style.display = 'none';
    }

    function startPaymentPolling(txId) {
        stopPaymentPolling();
        paymentCheckInterval = setInterval(async () => {
            try {
                // Gọi Google Apps Script để kiểm tra thanh toán
                const response = await fetch(`${GOOGLE_SCRIPT_URL}?id=${txId}`);
                const data = await response.json();
                
                if (data.paid) {
                    showPaymentSuccess();
                    stopPaymentPolling();
                }
            } catch (err) {
                console.log('Checking payment status...');
            }
        }, 4000); // Check mỗi 4 giây để tránh quá tải Google
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
