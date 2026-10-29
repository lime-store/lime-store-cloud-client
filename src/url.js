const DEFAULT_URL = 'https://lime-store.top'

/** Стартовый адрес: `--url=<адрес>` для теста, иначе прод. */
function parseStartUrl (argv) {
  const arg = argv.find((value) => value.startsWith('--url='))
  try {
    return new URL(arg ? arg.slice('--url='.length) : DEFAULT_URL)
  } catch {
    return new URL(DEFAULT_URL)
  }
}

/** Свой домен и его поддомены (lime-store.top, ehmed.lime-store.top), только http(s). */
function isAllowedUrl (rawUrl, startUrl) {
  let url
  try {
    url = new URL(rawUrl)
  } catch {
    return false
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
  const base = startUrl.hostname.toLowerCase()
  const host = url.hostname.toLowerCase()
  return host === base || host.endsWith(`.${base}`)
}

module.exports = { DEFAULT_URL, parseStartUrl, isAllowedUrl }
