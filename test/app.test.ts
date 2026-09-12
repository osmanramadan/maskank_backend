import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { after, before, test } from 'node:test';
import { app } from '../src/app.js';

let server;
let baseUrl;

before(async () => {
  server = createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test('GET / returns the API welcome contract and security headers', async () => {
  const response = await fetch(`${baseUrl}/`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body, { success: true, message: 'Welcome to the Maskank API' });
  assert.ok(response.headers.get('x-content-type-options'));
  assert.ok(response.headers.get('content-security-policy'));
});

test('unknown routes return the API error contract', async () => {
  const response = await fetch(`${baseUrl}/api/does-not-exist`);
  const body = await response.json();

  assert.equal(response.status, 404);
  assert.deepEqual(body, { success: false, message: 'Route not found: GET /api/does-not-exist' });
});