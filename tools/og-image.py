"""Regenerates the social/search thumbnail assets/og-image.jpg (1200×630) from the live start screen.

Usage (from the repo root):   py tools/og-image.py [--cls bb]
Renders the menu at High graphics settings with a fake clock (about 8 s of showcase orbit), hides the
best-score line, saves a JPEG (quality 86). Headless WebGL is slow without a GPU: expect a few minutes.
Needs: pip install playwright pillow.
"""
import argparse, functools, http.server, io, os, shutil, socketserver, tempfile, threading
from playwright.sync_api import sync_playwright
from PIL import Image

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args): pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser(); ap.add_argument('--cls', default='bb', choices=['dd', 'ca', 'bb', 'ss']); a = ap.parse_args()
INIT = """(()=>{try{localStorage.setItem('salvo:save:v1',JSON.stringify({best:0,bestWave:0,cls:'%s'}))}catch(e){}
let T=1000;const q=[];const pn=performance.now.bind(performance);performance.now=()=>window.__fake?T:pn();
const raf0=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>{if(cb.name==='frame'){q.push(cb);return 1}return raf0(cb)};
window.__step=(n,dt=50)=>{window.__fake=1;for(let i=0;i<n;i++){T+=dt;const c=q.splice(0);c.forEach(f=>f(T));}};})()""" % a.cls

tmp = tempfile.mkdtemp(prefix='salvo-og-')
site = os.path.join(tmp, 'site'); shutil.copytree(ROOT, site, ignore=shutil.ignore_patterns('.git', 'tools'))
handler = functools.partial(Quiet, directory=site)
srv = socketserver.TCPServer(('127.0.0.1', 0), handler); threading.Thread(target=srv.serve_forever, daemon=True).start()
try:
    with sync_playwright() as pw:
        b = pw.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = b.new_page(viewport={'width': 1200, 'height': 630}); pg.add_init_script(INIT)
        pg.goto(f'http://127.0.0.1:{srv.server_address[1]}/'); pg.wait_for_selector('.logo')
        pg.evaluate('__step(160)'); pg.evaluate("document.querySelectorAll('.info').forEach(e=>e.hidden=true)")
        pg.evaluate('window.__fake=0'); png = pg.screenshot(timeout=600000); b.close()
    out = os.path.join(ROOT, 'assets', 'og-image.jpg')
    Image.open(io.BytesIO(png)).convert('RGB').save(out, quality=86, optimize=True, progressive=True)
    print('saved', out)
finally:
    srv.shutdown(); shutil.rmtree(tmp, ignore_errors=True)
