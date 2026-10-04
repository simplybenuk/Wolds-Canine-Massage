import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const dist = new URL('../dist/', import.meta.url);
const pages = {
  'index.html': 'home',
  'about-us.html': 'about-us',
  'canine-massage-for-owners-courses.html': 'canine-massage-for-owners-courses',
  'contact.html': 'contact',
  'cookie-policy.html': 'cookie-policy',
  'faqs.html': 'faqs',
  'information-for-veterinary-professionals.html': 'information-for-veterinary-professionals',
  'privacy-policy.html': 'privacy-policy',
  'services.html': 'services',
  'subscribe_download.html': 'subscribe-download',
  'what-is-canine-massage.html': 'what-is-canine-massage',
  '404.html': '404',
};

assert.deepEqual((await readdir(dist)).filter(name => name.endsWith('.html')).sort(), Object.keys(pages).sort());
assert.equal((await readFile(new URL('CNAME', dist), 'utf8')).trim(), 'woldscaninemassage.co.uk');
await access(new URL('.nojekyll', dist));

for (const [filename, pageId] of Object.entries(pages)) {
  const html = await readFile(new URL(filename, dist), 'utf8');
  assert.ok(html.includes(`data-analytics-page="${pageId}"`), `${filename}: analytics page id`);
  const script = html.match(/<script\b[^>]*src="\/assets\/js\/analytics\.js"[^>]*>/)?.[0];
  assert.ok(script && !script.includes('type="module"'), `${filename}: classic analytics script`);
  for (const value of ['data-cookieconsent="ignore"', 'data-enabled="true"', 'data-measurement-id="G-WSLKJ3G7QT"', `data-page-path="${filename === 'index.html' ? '/' : `/${filename}`}"`]) {
    assert.ok(script.includes(value), `${filename}: ${value}`);
  }
  assert.ok(html.includes('data-blockingmode="auto"'), `${filename}: Cookiebot`);
  assert.ok(html.includes("'GTM-W7H6FND'"), `${filename}: existing GTM container`);

  for (const [, value] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    if (value.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith('//')) continue;
    assert.ok(value.startsWith('/'), `${filename}: root-relative URL ${value}`);
    const url = new URL(value, 'https://woldscaninemassage.co.uk');
    let target = decodeURIComponent(url.pathname).slice(1);
    if (!target) target = 'index.html';
    else if (!path.extname(target)) target += '.html';
    await access(new URL(target, dist)).catch(() => assert.fail(`${filename}: missing local target ${value}`));
  }
}

for (const name of ['Gemfile', 'Gemfile.lock', 'README.md', 'package.json', 'package-lock.json', 'src', 'docs', 'tests', '_config.yml']) {
  assert.ok(!(await readdir(dist)).includes(name), `Source must not be published: ${name}`);
}
console.log(`Verified ${Object.keys(pages).length} pages, local destinations, consent scripts and deployment files.`);
