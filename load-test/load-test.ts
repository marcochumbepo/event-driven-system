import axios from 'axios';

const API_URL = process.env.API_URL ?? 'http://localhost:3000/transactions';
const TOTAL_EVENTS = 50000;
const BATCH_SIZE = 1000;

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function sendBatch(batch: number[]) {
  const promises = batch.map((i) =>
    axios.post(API_URL, {
      idempotencyKey: generateUUID(),
      type: 'payment',
      amount: Math.random() * 1000,
      userId: `user-${Math.floor(Math.random() * 100)}`,
    }).catch(err => {
      if (err.response) {
        console.error(`Error sending event ${i}: Status ${err.response.status}`);
      } else {
        console.error(`Error sending event ${i}: ${err.message}`);
      }
    })
  );
  return Promise.all(promises);
}

async function runLoadTest() {
  console.log(`Starting load test: ${TOTAL_EVENTS} events`);
  const startTime = Date.now();

  for (let i = 0; i < TOTAL_EVENTS; i += BATCH_SIZE) {
    const batch = Array.from({ length: Math.min(BATCH_SIZE, TOTAL_EVENTS - i) }, (_, j) => i + j);
    await sendBatch(batch);
    
    if ((i + BATCH_SIZE) % 10000 === 0) {
      console.log(`Progress: ${Math.min(i + BATCH_SIZE, TOTAL_EVENTS)}/${TOTAL_EVENTS}`);
    }
  }

  const duration = (Date.now() - startTime) / 1000;
  console.log(`Load test completed in ${duration}s`);
  console.log(`Average: ${(TOTAL_EVENTS / duration).toFixed(2)} events/sec`);
}

runLoadTest().catch(console.error);
