fetch('http://localhost:3000/api/oracle/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'What happened to TIPS industries?' }],
    selectedPitchIds: ["tips"]
  })
}).then(async res => {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let firstChunkTime = null;
  const startTime = Date.now();
  console.log("Started at:", new Date().toISOString());
  
  while (true) {
    const { done, value } = await reader.read();
    if (value && !firstChunkTime) {
      firstChunkTime = Date.now();
      console.log(`First chunk received after ${firstChunkTime - startTime}ms`);
    }
    if (value) {
        process.stdout.write(decoder.decode(value));
    }
    if (done) break;
  }
  console.log(`\n\nFinished in ${Date.now() - startTime}ms`);
}).catch(console.error);

