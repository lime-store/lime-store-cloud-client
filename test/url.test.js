const test = require('node:test')
const assert = require('node:assert')
const { DEFAULT_URL, parseStartUrl, isAllowedUrl } = require('../src/url')

const prod = new URL(DEFAULT_URL)

test('start url defaults to prod', () => {
  assert.equal(parseStartUrl(['electron', '.']).href, prod.href)
})

test('start url honours --url', () => {
  assert.equal(parseStartUrl(['electron', '.', '--url=http://localhost:3000']).href, 'http://localhost:3000/')
})

test('start url falls back on garbage', () => {
  assert.equal(parseStartUrl(['electron', '.', '--url=not a url']).href, prod.href)
})

test('own host and subdomains are allowed', () => {
  assert.equal(isAllowedUrl('https://lime-store.top/login', prod), true)
  assert.equal(isAllowedUrl('https://ehmed.lime-store.top/', prod), true)
})

test('lookalikes and foreign hosts are rejected', () => {
  assert.equal(isAllowedUrl('https://evil-lime-store.top/', prod), false)
  assert.equal(isAllowedUrl('https://lime-store.top.evil.com/', prod), false)
  assert.equal(isAllowedUrl('https://google.com/', prod), false)
})

test('non-http protocols are rejected', () => {
  assert.equal(isAllowedUrl('file:///etc/passwd', prod), false)
  assert.equal(isAllowedUrl('javascript:alert(1)', prod), false)
})
