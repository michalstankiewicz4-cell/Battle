"""Headless end-to-end smoke test (Playwright + Chromium with SwiftShader WebGL, no GPU needed).

Usage (from the repo root):   py tools/e2e.py            (Linux/macOS: python3 tools/e2e.py)
Options:  --shots DIR   where to save screenshots (default: tools/out, git-ignored)
          --full        render at High graphics settings (much slower without a GPU)

What it does: copies the site to a temp folder, appends `window.__app = app;` to js/main.js, serves it on a
local port and drives the game with a fake fixed-step clock (so game time does not depend on render speed).
Checks: page loads without errors, language switch, every ship class can fight a wave, gun camera with
binoculars, submarine periscope + torpedoes + salvo camera, deep dive closes the periscope, depth charges hurt
a submerged boat, sinking shows the results screen. Prints PASS/FAIL per check; exit code 1 on any failure.
Needs: pip install playwright (Chromium is pre-installed in the Claude sandbox; locally run `playwright install chromium`).
"""
import argparse, functools, http.server, os, shutil, socketserver, sys, tempfile, threading, time
from playwright.sync_api import sync_playwright

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args): pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARGS = argparse.ArgumentParser()
ARGS.add_argument('--shots', default=os.path.join(ROOT, 'tools', 'out'))
ARGS.add_argument('--full', action='store_true')
A = ARGS.parse_args()

LIGHT = "{gfx:{scale:0.5,shadows:false,aa:false,bloom:true,fx:0.5,water:true,pip:true,bright:1.2}}"
INIT = """(()=>{%s
let T=1000;const q=[];const pn=performance.now.bind(performance);performance.now=()=>window.__fake?T:pn();
const raf0=window.requestAnimationFrame.bind(window);
window.requestAnimationFrame=cb=>{if(cb.name==='frame'){q.push(cb);return 1}return raf0(cb)};
window.__step=(n,dt=50)=>{window.__fake=1;for(let i=0;i<n;i++){T+=dt;const c=q.splice(0);c.forEach(f=>f(T));}};})()""" % (
    '' if A.full else "try{localStorage.setItem('salvo:settings:v1',JSON.stringify(%s))}catch(e){}" % LIGHT)

# Fast-forward the world directly (no rendering): n steps of 50 ms with a given control object.
SIM = """([n, ctl]) => { const w = __app.world; window.__t = (window.__t || 10);
  for (let i = 0; i < n; i++) { window.__t += .05; w.update(.05, window.__t, Object.assign({thr:0,steer:0,aim:null,fire:false,weapon:'guns',repair:false}, ctl)); } }"""
# Fight: aim at the nearest enemy (with lead) and fire for n steps.
FIGHT = """(n) => { const w = __app.world, p = w.player; let t = window.__t || 10;
  for (let i = 0; i < n; i++) { t += .05;
    let tg = null, bd = 1e9; for (const s of w.ships) if (s.side === 'enemy' && s.alive) { const d = Math.hypot(s.x-p.x, s.z-p.z); if (d < bd) { bd = d; tg = s; } }
    const aim = tg ? { x: tg.x + tg.vx * bd / p.cls.guns.speed, z: tg.z + tg.vz * bd / p.cls.guns.speed } : null;
    w.update(.05, t, { thr: 0, steer: Math.sin(t * .2) * .4, aim, fire: !!tg, weapon: (i % 120 < 10 && p.cls.torps) ? 'torps' : 'guns', repair: p.hp < p.maxHp * .4 }); }
  window.__t = t; return { shots: p.stats.shots, hits: p.stats.hits, dmg: Math.round(w.S.dmg), wave: w.S.wave, alive: p.alive }; }"""
# Bring the wave's enemies to a set distance in front of the player.
NEAR = """(d) => { const w = __app.world, p = w.player;
  w.ships.filter(s => s.side === 'enemy' && s.alive).forEach((s, i) => { const a = p.th + .15 + i * .35;
    s.x = p.x + Math.sin(a) * (d + i * 20); s.z = p.z + Math.cos(a) * (d + i * 20); s.th = p.th + 1.6; }); }"""
# Turn the gun camera toward the first enemy (simulated mouse movement).
LOOK = """() => { const A = __app, w = A.world, p = w.player; const e = w.ships.find(s => s.side === 'enemy' && s.alive);
  const a = Math.atan2(e.x - p.x, e.z - p.z), d = Math.atan2(Math.sin(a - A.rig.gunYaw), Math.cos(a - A.rig.gunYaw));
  A.input.onLook(-d / 0.0022, 0); }"""

results = []
def check(name, ok, info=''):
    results.append(ok); print(('PASS ' if ok else 'FAIL ') + name + (f'  [{info}]' if info else ''), flush=True)

def main():
    os.makedirs(A.shots, exist_ok=True)
    tmp = tempfile.mkdtemp(prefix='salvo-e2e-')
    site = os.path.join(tmp, 'site')
    shutil.copytree(ROOT, site, ignore=shutil.ignore_patterns('.git', 'tools'))
    with open(os.path.join(site, 'js', 'main.js'), 'a') as f: f.write('\nwindow.__app = app;\n')
    handler = functools.partial(Quiet, directory=site)
    srv = socketserver.TCPServer(('127.0.0.1', 0), handler); port = srv.server_address[1]
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    errs = []
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
            pg = b.new_page(viewport={'width': 800, 'height': 450})
            pg.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
            pg.on('console', lambda m: errs.append('console: ' + m.text) if m.type == 'error' else None)
            pg.add_init_script(INIT)
            shot = lambda name: (pg.evaluate('window.__fake=0'), pg.screenshot(path=os.path.join(A.shots, name + '.png'), timeout=600000), pg.evaluate('window.__fake=1'))
            pg.goto(f'http://127.0.0.1:{port}/'); pg.wait_for_function('window.__app', timeout=60000); pg.evaluate('__step(3)')
            check('page loads', 'Steel Salvo' in pg.title() and not errs, pg.title())
            shot('01-menu')

            hrefs = pg.evaluate("[...document.querySelectorAll('.labs a')].map(a=>a.getAttribute('href'))")
            check('labs links in the main menu', hrefs == ['labs/ship.html', 'labs/water.html', 'labs.html'], str(hrefs))
            # language switch (Options > Language) and back
            pg.click('.screen:not([hidden]) .stack button >> nth=2')
            pg.click('.screen:not([hidden]) >> text=Polski'); pg.click('.screen:not([hidden]) .stack button >> nth=0')
            pl = pg.inner_text('.screen:not([hidden]) .stack button >> nth=0')
            pg.click('.screen:not([hidden]) .stack button >> nth=2'); pg.click('.screen:not([hidden]) >> text=English'); pg.click('.screen:not([hidden]) .stack button >> nth=0')
            check('language switch', pl.startswith('Wypłyń') and pg.inner_text('.screen:not([hidden]) .stack button >> nth=0').startswith('Set sail'), pl)

            # every class fights a wave
            for cls in ['dd', 'ca', 'bb', 'ss']:
                pg.evaluate(f"__app.startRun('{cls}')"); pg.evaluate(SIM, [70, {}]); pg.evaluate(NEAR, 70)
                r = pg.evaluate(FIGHT, 300)
                check(f'{cls} fights', r['shots'] > 0 and r['wave'] >= 1, str(r))

            # gun camera + binoculars (cruiser)
            pg.evaluate("__app.startRun('ca')"); pg.evaluate(SIM, [70, {}]); pg.evaluate(NEAR, 60)
            pg.keyboard.press('KeyC'); pg.evaluate(LOOK); pg.evaluate('__step(4)')
            optic = pg.evaluate("document.getElementById('scope').className")
            check('gun camera + binoculars', pg.evaluate('__app.rig.view') == 'gun' and optic == 'bino', f'zoom {pg.evaluate("__app.rig.zoom")}')
            shot('02-binoculars')
            pg.mouse.move(400, 225); pg.mouse.down(); pg.evaluate('__step(40)'); pg.mouse.up(); pg.evaluate('__step(8)')
            check('salvo camera follows shells', pg.evaluate("!document.getElementById('pip').hidden"))
            shot('03-salvo-camera')
            pg.keyboard.press('KeyC'); pg.evaluate('__step(2)')
            check('back to iso view', pg.evaluate('__app.rig.view') == 'iso')

            # submarine: periscope, torpedoes, deep dive, depth charges
            pg.evaluate("__app.startRun('ss')"); pg.evaluate(SIM, [70, {}]); pg.evaluate(NEAR, 60)
            pg.evaluate("(()=>{const s=__app.world.player.sub;s.level=1;s.y=-1.3})()")
            pg.keyboard.press('KeyC'); pg.evaluate(LOOK); pg.evaluate('__step(4)')
            check('periscope', pg.evaluate("document.getElementById('scope').className") == '' and pg.evaluate("!document.getElementById('scope').hidden"))
            pg.keyboard.press('Digit2'); pg.mouse.move(400, 225); pg.mouse.down(); pg.evaluate('__step(4)'); pg.mouse.up(); pg.evaluate('__step(10)')
            n = pg.evaluate("__app.world.combat.torps.filter(t=>t.owner===__app.world.player).length")
            check('torpedoes from periscope', n > 0, f'{n} torpedoes')
            shot('04-periscope')
            pg.evaluate("__app.world.player.sub.level=2"); pg.evaluate(SIM, [80, {}]); pg.evaluate('__step(3)')
            check('deep dive closes periscope', pg.evaluate('__app.rig.view') == 'iso' and pg.evaluate('__app.world.player.sub.ghost'))
            lost = pg.evaluate("""()=>{const w=__app.world,p=w.player;let t=window.__t;let lost=0;
              for(let k=0;k<3;k++){const dd=w.ships.find(s=>s.side==='enemy'&&s.alive&&s.cls.key==='dd');if(!dd)break;
                dd.x=p.x+15;dd.z=p.z+2;dd.th=Math.atan2(p.x-dd.x,p.z-dd.z);const h=p.hp;
                for(let i=0;i<160;i++){t+=.05;w.update(.05,t,{thr:0,steer:0,aim:null,fire:false,weapon:'guns',repair:false});}lost+=h-p.hp;}
              window.__t=t;return Math.round(lost)}""")
            check('depth charges hit a submerged boat', lost > 0, f'{lost} HP lost')
            shot('05-submerged')

            # sinking -> results screen
            pg.evaluate("__app.world.player.hp=0"); pg.evaluate(SIM, [5, {}]); pg.evaluate('__step(80)')
            check('results screen after sinking', pg.evaluate('__app.mode') == 'dead')
            shot('06-results')
            b.close()
    finally:
        srv.shutdown(); shutil.rmtree(tmp, ignore_errors=True)
    check('no page or console errors', not errs, '; '.join(errs[:5]))
    print(f'{sum(results)}/{len(results)} checks passed; screenshots in {A.shots}')
    sys.exit(0 if all(results) else 1)

if __name__ == '__main__':
    main()
