const { spawn } = require('child_process');

console.log('Starting Ganache on port 7545...');

// Start Ganache in the background
const ganache = spawn('npx', ['ganache', '--port', '7545'], {
  detached: true,
  stdio: 'ignore'
});
ganache.unref();

// Wait for Ganache to start up
setTimeout(() => {
  console.log('Deploying contracts to local Ganache...');

  // Run Truffle migration on the ganache network
  const migrate = spawn('truffle', ['migrate', '--network', 'ganache'], {
    stdio: 'inherit'
  });

  migrate.on('close', (code) => {
    console.log(`Deployment finished with exit code ${code}`);
    if (code === 0) {
      console.log('Contracts deployed successfully!');
    } else {
      console.error('Deployment failed.');
    }
  });

  migrate.on('error', (err) => {
    console.error('Error running migration:', err);
  });
}, 5000); // Wait 5 seconds for Ganache to initialize