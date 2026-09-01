/* LEPAK — hero slideshow: WebGL liquid wipe (vanilla WebGL 1)
   Mechanism: bottom-to-top wipe, edge displaced by 2D simplex noise,
   with a thin refraction band near the edge. Two textures, one quad. */
(function () {
  'use strict';

  var DESKTOP_IMGS = [
    'assets/img/hero-1.jpg', 'assets/img/hero-2.jpg', 'assets/img/hero-3.jpg',
    'assets/img/hero-4.jpg', 'assets/img/hero-5.jpg', 'assets/img/hero-6.jpg',
    'assets/img/hero-7.jpg', 'assets/img/hero-8.jpg', 'assets/img/hero-9.jpg'
  ];
  var PHONE_IMGS = DESKTOP_IMGS.slice(0, 5);

  var CONFIG = {
    wipeDuration: 2.2,      // seconds per transition
    autoPlay: 5.5,          // seconds per slide (starts after intro)
    distortion: 0.15,       // edge turbulence 0..0.5
    noiseScale: 5.5,        // wipe detail
    introMult: 1.2          // intro wipe = duration * this
  };

  var isPhone = window.matchMedia('(max-width: 809px)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var IMGS = isPhone ? PHONE_IMGS : DESKTOP_IMGS;

  var canvas = document.getElementById('heroCanvas');
  var backdrop = document.getElementById('heroBackdrop');
  var thumbsWrap = document.getElementById('heroThumbs');
  var hero = document.getElementById('landing');
  if (!canvas || !hero) return;

  var heroInView = true;
  new IntersectionObserver(function (e) { heroInView = e[0].isIntersecting; }).observe(hero);

  backdrop.style.backgroundImage = 'url("' + IMGS[0] + '")';

  /* ---------- thumbnails ---------- */
  var thumbs = [];
  IMGS.forEach(function (src, i) {
    var b = document.createElement('button');
    b.className = 'thumb';
    b.style.backgroundImage = 'url("' + src + '")';
    b.setAttribute('aria-label', 'Photo ' + (i + 1));
    var prog = document.createElement('span');
    prog.className = 'tprog';
    prog.innerHTML = '<i></i>';
    b.appendChild(prog);
    b.addEventListener('click', function () { skipIntro(); select(i, true); });
    thumbsWrap.appendChild(b);
    thumbs.push(b);
    setTimeout(function () { b.classList.add('enter'); }, 350 + i * 65);
  });

  /* ---------- GL setup ---------- */
  var gl = null;
  try {
    // refuse software-rendered WebGL: fall back to the crossfade instead of melting the CPU
    gl = canvas.getContext('webgl', { alpha: true, antialias: false, failIfMajorPerformanceCaveat: true });
  } catch (e) { gl = null; }
  var glOK = !!gl;

  var VERT = [
    'attribute vec2 p;',
    'varying vec2 vUv;',
    'void main(){',
    '  vUv = p * 0.5 + 0.5;',
    '  vUv.y = 1.0 - vUv.y;',
    '  gl_Position = vec4(p, 0.0, 1.0);',
    '}'
  ].join('\n');

  /* snoise: standard Ashima Arts / Ian McEwan 2D simplex noise (MIT). */
  var FRAG = [
    'precision highp float;',
    'varying vec2 vUv;',
    'uniform sampler2D tA;',   // outgoing
    'uniform sampler2D tB;',   // incoming
    'uniform float uProgress;',
    'uniform vec2 uRes;',
    'uniform vec2 uImgRes;',
    'uniform float uNoise;',
    'uniform float uDist;',
    'uniform float uIntro;',
    'vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}',
    'vec2 mod289(vec2 x){return x-floor(x*(1.0/289.0))*289.0;}',
    'vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}',
    'float snoise(vec2 v){',
    '  const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);',
    '  vec2 i=floor(v+dot(v,C.yy));',
    '  vec2 x0=v-i+dot(i,C.xx);',
    '  vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);',
    '  vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1;',
    '  i=mod289(i);',
    '  vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));',
    '  vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);',
    '  m=m*m; m=m*m;',
    '  vec3 x=2.0*fract(p*C.www)-1.0;',
    '  vec3 h=abs(x)-0.5;',
    '  vec3 a0=x-floor(x+0.5);',
    '  vec3 g=a0*vec3(x0.x,x12.xz)+h*vec3(x0.y,x12.yw);',
    '  return 130.0*dot(m,g);',
    '}',
    'void main(){',
    '  vec2 ratio=vec2(',
    '    min((uRes.x/uRes.y)/(uImgRes.x/uImgRes.y),1.0),',
    '    min((uRes.y/uRes.x)/(uImgRes.y/uImgRes.x),1.0));',
    '  vec2 uv=vec2(vUv.x*ratio.x+(1.0-ratio.x)*0.5, vUv.y*ratio.y+(1.0-ratio.y)*0.5);',
    '  float n=snoise(uv*uNoise);',
    '  float mapped=uProgress*(1.0+uDist*2.0)-uDist;',
    '  float d=(1.0-uv.y)-mapped+n*uDist;',
    '  float wipe=smoothstep(0.0,0.01,d);',
    '  float band=(1.0-smoothstep(0.0,0.05,abs(d)))*0.03;',
    '  vec2 uvR=uv+band;',
    '  vec4 a=mix(texture2D(tA,uvR),vec4(0.0),uIntro);',
    '  vec4 b=texture2D(tB,uvR);',
    '  gl_FragColor=mix(b,a,wipe);',
    '}'
  ].join('\n');

  var prog = null, loc = {};
  if (glOK) {
    function sh(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(s)); glOK = false; }
      return s;
    }
    prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) glOK = false;
  }

  if (!glOK) {
    /* fallback: plain crossfade via backdrop swaps, no blur */
    backdrop.style.filter = 'none';
    backdrop.style.transform = 'none';
    canvas.style.display = 'none';
  } else {
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    var pLoc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(pLoc);
    gl.vertexAttribPointer(pLoc, 2, gl.FLOAT, false, 0, 0);
    ['tA', 'tB', 'uProgress', 'uRes', 'uImgRes', 'uNoise', 'uDist', 'uIntro'].forEach(function (n) {
      loc[n] = gl.getUniformLocation(prog, n);
    });
    gl.uniform1i(loc.tA, 0);
    gl.uniform1i(loc.tB, 1);
    gl.uniform1f(loc.uNoise, CONFIG.noiseScale);
    gl.uniform1f(loc.uDist, CONFIG.distortion);
    gl.clearColor(0, 0, 0, 0);
  }

  /* ---------- textures ---------- */
  var texs = [], dims = [], loaded = 0, firstReady = false;
  IMGS.forEach(function (src, i) {
    var img = new Image();
    img.onload = function () {
      dims[i] = [img.naturalWidth, img.naturalHeight];
      if (glOK) {
        var t = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        texs[i] = t;
      }
      loaded++;
      if (i === 0) firstReady = true;
    };
    img.src = src;
  });

  /* ---------- sizing ---------- */
  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, isPhone ? 1.25 : 1.5);
    var w = hero.clientWidth, h = hero.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    if (glOK) { gl.viewport(0, 0, canvas.width, canvas.height); gl.uniform2f(loc.uRes, canvas.width, canvas.height); }
    restUntil = performance.now() + 500;
  }
  resize();
  new ResizeObserver(resize).observe(hero);

  /* ---------- state machine ---------- */
  var outIdx = 0, inIdx = 0, progress = 1, intro = true, introDone = false;
  var queued = null, autoTimer = null, introSkipped = false;
  var barI = null;

  function startAuto() {
    clearInterval(autoTimer);
    if (reduceMotion) return;
    autoTimer = setInterval(function () {
      if (heroInView) select((inIdx + 1) % IMGS.length, false);
    }, CONFIG.autoPlay * 1000);
    restartBar();
  }
  function restartBar() {
    thumbs.forEach(function (t) { var i2 = t.querySelector('.tprog i'); i2.style.transition = 'none'; i2.style.width = '0%'; });
    var el = thumbs[inIdx].querySelector('.tprog i');
    requestAnimationFrame(function () {
      el.style.transition = 'width ' + CONFIG.autoPlay + 's linear';
      el.style.width = '100%';
    });
  }
  function skipIntro() {
    if (!introDone) { introSkipped = true; progress = 1; }
  }
  function select(i, manual) {
    if (i === inIdx) return;
    if (!introDone) { queued = i; return; }
    outIdx = inIdx; inIdx = i;
    progress = 0;
    restUntil = performance.now() + 500;
    thumbs.forEach(function (t, j) { t.classList.toggle('active', j === i); });
    backdrop.style.backgroundImage = 'url("' + IMGS[i] + '")';
    if (manual) startAuto(); else restartBar();
  }
  thumbs[0].classList.add('active');

  /* proximity hover: nearest thumb to cursor X (fine pointers only) */
  if (finePointer && !reduceMotion) {
    var centers = [], measured = 0;
    function measure() {
      centers = thumbs.map(function (t) {
        var r = t.getBoundingClientRect(); return r.left + r.width / 2;
      });
    }
    var mTimer = null;
    function requestMeasure() { clearTimeout(mTimer); mTimer = setTimeout(measure, 420); }
    requestMeasure();
    window.addEventListener('resize', requestMeasure);
    var rafPending = false;
    hero.addEventListener('pointermove', function (e) {
      if (rafPending) return; rafPending = true;
      requestAnimationFrame(function () {
        rafPending = false;
        skipIntro();
        if (!centers.length) return;
        var best = 0, bd = 1e9;
        for (var i = 0; i < centers.length; i++) {
          var d = Math.abs(e.clientX - centers[i]);
          if (d < bd) { bd = d; best = i; }
        }
        if (best !== inIdx) { select(best, true); requestMeasure(); }
      });
    });
  }

  /* ---------- render loop (draws ONLY while a wipe is running) ---------- */
  var last = performance.now();
  var restUntil = 0;
  function frame(now) {
    if (!heroInView) { last = now; requestAnimationFrame(frame); return; }
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    var dur = intro ? CONFIG.wipeDuration * CONFIG.introMult : Math.max(CONFIG.wipeDuration, 0.05);
    if (firstReady && progress < 1) { progress = Math.min(1, progress + dt / dur); restUntil = now + 400; }
    if (intro && (progress >= 1 || introSkipped)) {
      intro = false; introDone = true;
      backdrop.style.opacity = '0';
      startAuto();
      if (queued !== null) { var q = queued; queued = null; select(q, true); }
    }
    if (glOK && firstReady && now < restUntil) {
      var eased = 1 - Math.pow(1 - progress, 4);
      var dA = dims[outIdx] || [16, 9], tA = texs[outIdx], tB = texs[inIdx];
      var dB = dims[inIdx] || dA;
      if (tB) {
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tA || tB);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tB);
        gl.uniform1f(loc.uProgress, eased);
        gl.uniform2f(loc.uImgRes, dB[0], dB[1]);
        gl.uniform1f(loc.uIntro, intro ? 1 : 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
