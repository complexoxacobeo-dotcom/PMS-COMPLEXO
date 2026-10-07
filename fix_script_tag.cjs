const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// Replace literal <\/script> in the printPlanningA4 string with <\/script> properly escaped
code = code.replace(/<\\\/script>/g, '<\\/script>'); // Wait, what is currently there?

// Let's just do a clean replace for the exact bad string:
code = code.replace("window.onload = () => {\n                            setTimeout(() => {\n                                window.print();\n                                window.close();\n                            }, 500);\n                        };\n                    <\\/script>", 
"window.onload = () => {\n                            setTimeout(() => {\n                                window.print();\n                                window.close();\n                            }, 500);\n                        };\n                    <\\/script>");

// Actually, in update_print.cjs I wrote:
// <\/script>
// which in JS is just </script>

fs.writeFileSync('index.html', code.replace("<\/script>\n                </body>\n                </html>\n            `);", "<\\/script>\n                </body>\n                </html>\n            `);"));
