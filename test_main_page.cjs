const http = require('http');

http.get('http://localhost:3000', (res) => {
    console.log("Status:", res.statusCode);
}).on('error', (e) => {
    console.error("Error:", e);
});
