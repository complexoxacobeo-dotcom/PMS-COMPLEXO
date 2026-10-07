
        // IF QR MODE, PREVENT UI FLASH
        const initParams = new URLSearchParams(window.location.search);
        if (initParams.get('qr')) {
            window.isQrMode = true;
            document.write('<style>#loginOverlay, #loadingOverlay, #mainHeader, #roomGrid, .floating-fab, #draggableEmailsWidget { display: none !important; opacity: 0 !important; visibility: hidden !important; } body { background: #0f172a !important; }</style>');
        }
    