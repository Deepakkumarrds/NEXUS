const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(file));
        } else {
            if (file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walkDir('src');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    content = content.replace(/'http:\/\/localhost:5000\/api/g, "(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api");
    content = content.replace(/`http:\/\/localhost:5000\/api/g, "`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api");
    
    fs.writeFileSync(file, content, 'utf8');
});
console.log('Replaced localhost:5000 in ' + files.length + ' files');
