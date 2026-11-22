import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
const middlewareSource = fs.readFileSync(path.join(root, 'functions/_middleware.js'), 'utf8');
const {expireClosure, CLOSURE_END, onRequest} = await import('data:text/javascript;base64,' + Buffer.from(middlewareSource).toString('base64'));
assert.equal(CLOSURE_END, Date.parse('2026-12-02T22:00:00Z'));
const paths = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
    if (entry.name.startsWith('.') || ['tools', 'assets', 'functions'].includes(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {walk(file); continue;}
    if (file.endsWith('.html') && fs.readFileSync(file, 'utf8').includes('id="program-temporar"')) paths.push(file);
  }
}
walk(root);
assert.equal(paths.length, 13);
const headers = fs.readFileSync(path.join(root, '_headers'), 'utf8');
for (const file of paths) {
  const html = fs.readFileSync(file, 'utf8');
  assert.equal(expireClosure(html, CLOSURE_END - 1), html, 'keep notice until 23:59:59.999 Bucharest');
  const reopened = expireClosure(html, CLOSURE_END);
  assert.ok(!reopened.includes('id="program-temporar"'), file);
  assert.ok(!reopened.includes('closure-form-note"'), file);
  assert.ok(!reopened.includes('Program obișnuit'), file);
  assert.ok(!reopened.includes('23 noiembrie') && !reopened.includes('3 decembrie'), file);
  assert.equal(expireClosure(reopened, CLOSURE_END + 86400000), reopened, 'idempotent');
  assert.equal((reopened.match(/<input\b/g)||[]).length, (html.match(/<input\b/g)||[]).length, 'preserve form fields');
  if (html.includes('Program obișnuit')) assert.equal((reopened.match(/class="notice"/g)||[]).length,1);
  for (const match of reopened.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>|<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (match[2]?.includes('src=')) continue;
    const text = match[1] ?? match[3];
    if (text.trim()) assert.ok(headers.includes("'sha256-"+crypto.createHash('sha256').update(text).digest('base64')+"'"), 'preserve CSP');
  }
}

const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.match(expireClosure(home, CLOSURE_END), /contactăm telefonic în timpul programului/);
const clock = Date.now;
try {
  Date.now = () => CLOSURE_END;
  const response = await onRequest({request:new Request('https://sun-cris-vet.pages.dev/'),next:async()=>new Response(home,{headers:{'Content-Type':'text/html; charset=utf-8','ETag':'old','Content-Length':String(home.length),'Content-Security-Policy':'preserved'}})});
  assert.ok(!(await response.text()).includes('id="program-temporar"'));
  assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, nofollow');
  assert.equal(response.headers.get('Content-Security-Policy'), 'preserved');
  assert.equal(response.headers.get('Cache-Control'), 'no-cache, must-revalidate');
  assert.equal(response.headers.get('ETag'), null);
  assert.equal(response.headers.get('Content-Length'), null);
  const api = await onRequest({request:new Request('https://suncrisvet.ro/api/programare',{method:'POST'}),next:async()=>new Response('{"message":"unchanged"}',{status:403,headers:{'Content-Type':'application/json'}})});
  assert.equal(api.status,403);
  assert.equal(await api.text(),'{"message":"unchanged"}');
} finally { Date.now = clock; }

// Run the actual browser expiry block with a page left open at the boundary.
const clientSource = fs.readFileSync(path.join(root, 'assets/site.js'), 'utf8').split('// Also update a page')[1].split('const ANALYTICS_MEASUREMENT_ID')[0];
const elements = new Map();
const makeElement = () => ({isConnected:true,textContent:'',innerHTML:'',remove(){this.isConnected=false;},setAttribute(){},before(node){elements.set('.notice',node);}});
for (const key of ['#program-temporar','.closure-form-note','.callback-copy > p:not(.eyebrow)','.callback-notice','.header-meta .meta-label','.site-header']) elements.set(key,makeElement());
const pending = [];
let now = CLOSURE_END - 1;
const sandbox = {Date:{parse:Date.parse,now:()=>now},document:{querySelector:key=>elements.get(key)||null,createElement:makeElement,addEventListener(){}},window:{setTimeout:(fn,delay)=>pending.push({fn,delay})}};
vm.runInNewContext('// Also update a page'+clientSource,sandbox);
assert.equal(elements.get('#program-temporar').isConnected,true);
assert.equal(pending[0].delay,1);
now = CLOSURE_END;
pending[0].fn();
assert.equal(elements.get('#program-temporar').isConnected,false);
assert.equal(elements.get('.closure-form-note').isConnected,false);
assert.equal(elements.get('.header-meta .meta-label').textContent,'Program');
assert.ok(elements.get('.callback-copy > p:not(.eyebrow)').textContent.includes('în timpul programului'));
assert.ok(elements.get('.notice').innerHTML.includes('0723 603 355'));
console.log(JSON.stringify({pages:paths.length,boundary:'3 December 2026 00:00 Europe/Bucharest',server:'PASS',openPageTimer:'PASS',form:'preserved',csp:'preserved',api:'preserved'}));
