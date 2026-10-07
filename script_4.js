
    window.onerror = function(message, source, lineno, colno, error) {
      console.error('GLOBAL ERROR:', message, 'at', source, lineno, colno);
      if (message !== 'Script error.' && !message.toString().includes('Script error')) {
         // Silently log errors instead of alerting the user
      }
    };
  