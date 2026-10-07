
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').then(reg => {
                console.log('SW registered:', reg.scope);
            }).catch(err => {
                console.log('SW registration failed:', err);
            });
        }

        window.showAppNotification = async function(title, options) {
            // Se estamos en iOS, a notificación nativa pode ocultarse ou fallar se non é PWA
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            
            let shownNative = false;
            if ("serviceWorker" in navigator && "Notification" in window && Notification.permission === "granted") {
                try {
                    const registration = await navigator.serviceWorker.ready;
                    if (registration && registration.active && "showNotification" in registration) {
                        await registration.showNotification(title, options);
                        shownNative = true;
                    }
                } catch(e) { console.error("SW notification failed:", e); }
            }
            
            if (!shownNative && "Notification" in window && Notification.permission === "granted") {
                try {
                    new Notification(title, options);
                } catch(e) { console.error("Native notification failed:", e); }
            }
            
            // Amosar un Toast na propia app para asegurarnos de que o vexa en móbiles ou se a app está aberta
            showToast("🔔 " + title + (options && options.body ? "\n" + options.body : ''));
        };

        window.playNotificationSound = function() {
            try {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                audio.play().catch(e => console.log('Audio play blocked:', e));
            } catch(e){}
        };
        window.showToast = function(msg) {
            playNotificationSound();
            const t = document.createElement('div');
            t.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl z-[999999] font-bold text-sm transition-all duration-300 translate-y-[-150%] opacity-0 max-w-[90%] whitespace-pre-wrap text-center border border-slate-700';
            t.innerText = msg;
            document.body.appendChild(t);
            setTimeout(() => { t.classList.remove('translate-y-[-150%]', 'opacity-0'); }, 50);
            setTimeout(() => { 
                t.classList.add('translate-y-[-150%]', 'opacity-0'); 
                setTimeout(() => t.remove(), 300);
            }, 6000);
        };
    
        
