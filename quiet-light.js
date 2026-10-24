/* Illumination-only motion adapted from the user's Elephant reference.
   The sharp photo is fixed; only its low-frequency light field moves. */
(() => {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const vertex='attribute vec2 position;varying vec2 uv;void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}';
 const fragment=`precision mediump float;
 varying vec2 uv;uniform sampler2D photo;uniform sampler2D light;
 uniform float time;uniform float aspect;uniform float imageAspect;uniform float positionX;uniform float wallEnd;
 float luma(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
 void main(){
  vec2 cover=aspect<imageAspect?vec2(aspect/imageAspect,1.):vec2(1.,imageAspect/aspect);
  vec2 p=(uv-.5)*cover+.5;p.x+=(1.-cover.x)*(positionX-.5);
  vec2 drift=vec2(.045*sin(time*.52),.015*sin(time*.43));
  float wall=smoothstep(.01,.12,p.x)*(1.-smoothstep(wallEnd-.08,wallEnd,p.x))*smoothstep(.08,.15,p.y);
  float original=luma(texture2D(light,p).rgb);
  float moved=luma(texture2D(light,clamp(p+drift,vec2(0.),vec2(1.))).rgb);
  float ratio=clamp(moved/max(original,.08),.72,1.35);
  vec3 detail=texture2D(photo,p).rgb;
  gl_FragColor=vec4(detail*mix(1.,ratio,wall),1.);
 }`;
 const compile=(gl,type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error('shader');return shader;};
 const create=async host=>{
  const source=host.querySelector(':scope > img');if(!source)return;
  const img=new Image();img.src=source.currentSrc||source.src;
  try{await img.decode();}catch{return;}
  const canvas=document.createElement('canvas');canvas.className='quiet-light-canvas';canvas.setAttribute('aria-hidden','true');
  const gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'});if(!gl)return;
  let frame=0,visible=false,last=0,seconds=0,drawn=0,observer,resize;
  const dispose=()=>{cancelAnimationFrame(frame);observer?.disconnect();resize?.disconnect();canvas.remove();host.classList.remove('quiet-light-ready');};
  try{
   const program=gl.createProgram();gl.attachShader(program,compile(gl,gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl,gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('program');gl.useProgram(program);
   const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
   const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
   const illumination=document.createElement('canvas');illumination.width=1086;illumination.height=Math.round(1086*img.height/img.width);const ctx=illumination.getContext('2d');ctx.filter='blur(5px)';ctx.drawImage(img,0,0,illumination.width,illumination.height);
   [img,illumination].forEach((texture,i)=>{gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,gl.createTexture());gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,texture);gl.uniform1i(gl.getUniformLocation(program,i?'light':'photo'),i);});
   const uTime=gl.getUniformLocation(program,'time'),uAspect=gl.getUniformLocation(program,'aspect'),uPosition=gl.getUniformLocation(program,'positionX');
   gl.uniform1f(gl.getUniformLocation(program,'imageAspect'),img.width/img.height);gl.uniform1f(gl.getUniformLocation(program,'wallEnd'),img.src.includes('console')?.67:.53);
   const render=()=>{const r=host.getBoundingClientRect();if(!r.width||!r.height)return;const dpr=Math.min(devicePixelRatio,1.5),w=Math.round(r.width*dpr),h=Math.round(r.height*dpr);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}gl.uniform1f(uAspect,r.width/r.height);gl.uniform1f(uPosition,parseFloat(getComputedStyle(source).objectPosition)/100||.5);gl.uniform1f(uTime,seconds);gl.drawArrays(gl.TRIANGLES,0,6);};
   const tick=now=>{if(last)seconds+=(now-last)/1000;last=now;if(now-drawn>=33){render();drawn=now;}frame=requestAnimationFrame(tick);};
   const update=()=>{cancelAnimationFrame(frame);frame=0;last=0;const paused=reduced.matches||document.documentElement.classList.contains('light-paused');canvas.hidden=paused;host.classList.toggle('quiet-light-ready',!paused);if(visible&&!document.hidden&&!paused){render();frame=requestAnimationFrame(tick);}};
   observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;update();},{rootMargin:'40px 0px',threshold:0});
   resize=new ResizeObserver(()=>{if(visible&&!canvas.hidden)render();});
   host.append(canvas);observer.observe(host);resize.observe(host);
   new MutationObserver(update).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
   reduced.addEventListener('change',update);document.addEventListener('visibilitychange',update);
   canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();dispose();},{once:true});
  }catch{dispose();}
 };
 const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){observer.unobserve(entry.target);create(entry.target);}});},{rootMargin:'200px 0px'});
 document.querySelectorAll('.light-break:not(.light-break--editorial)').forEach(host=>observer.observe(host));
})();
