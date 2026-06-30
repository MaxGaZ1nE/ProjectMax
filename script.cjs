const fs = require('fs');
const path = require('path');
function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let newContent = content.replace(/'to_ship'/g, "'waiting_driver'")
                              .replace(/"to_ship"/g, '"waiting_driver"')
                              .replace(/'shipping'/g, "'in_delivery'")
                              .replace(/"shipping"/g, '"in_delivery"')
                              .replace(/to_ship:/g, 'waiting_driver:')
                              .replace(/shipping:/g, 'in_delivery:');
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent);
        console.log('Updated', fullPath);
      }
    }
  }
}
replaceInDir('d:/mongkol/qino-template-fruit-store/src');
