process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

console.log('Loading server.js...');
try {
  require('./server.js');
  console.log('Server loaded successfully');
} catch (err) {
  console.error('Error loading server:', err);
  process.exit(1);
}
