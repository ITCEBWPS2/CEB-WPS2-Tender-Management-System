const { exec } = require('child_process');
const path = require('path');

const distPath = path.join(__dirname, 'dist');
const command = `serve -s "${distPath}" -l 5173`;

console.log('Starting TMS frontend with command:', command);

const child = exec(command);

child.stdout.on('data', (data) => {
  console.log(data.toString());
});

child.stderr.on('data', (data) => {
  console.error(data.toString());
});

child.on('exit', (code) => {
  console.log('Serve exited with code:', code);
  process.exit(code);
});