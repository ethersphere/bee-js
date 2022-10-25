module.exports = {
  launch: {
    headless: !(process.env.TEST_HEADLESS === 'false'),
    devtools: process.env.TEST_DEVTOOLS === 'true',
    args: ['--allow-file-access-from-files'],
    dumpio: true, // Forwards browser console into test console for easier debugging
  },
}
