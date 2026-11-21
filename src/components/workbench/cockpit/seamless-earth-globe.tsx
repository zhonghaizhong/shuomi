"use client";
import { useEffect, useRef } from "react";

// NASA Blue Marble public-domain equirectangular texture. An orthographic
// photograph covers only one hemisphere; 3D rotation needs the hidden side.
const EARTH_TEXTURE = "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg";
const CLOUD_TEXTURE = "https://threejs.org/examples/textures/planets/earth_clouds_1024.png";
const TURN_DURATION_MS = 90_000;

const VERTEX = `
attribute vec2 aPosition;
varying vec2 vUv;
void main(){vUv=(aPosition+1.0)*0.5;gl_Position=vec4(aPosition,0.0,1.0);}
`;
const FRAGMENT = `
precision highp float;
uniform sampler2D uEarth;
uniform sampler2D uClouds;
uniform float uCloudOpacity;
uniform float uRotation;
varying vec2 vUv;
const float PI=3.141592653589793;
// Equirectangular atlases occasionally have mismatched first/last columns.
// Cross-fade only within the narrow longitude join to prevent a rotating seam.
vec4 sampleWrapped(sampler2D atlas,vec2 uv){
  const float seam=0.009;
  vec4 base=texture2D(atlas,uv);
  if(uv.x<seam){
    vec4 left=texture2D(atlas,vec2(1.0-seam+uv.x,uv.y));
    return mix(left,base,smoothstep(0.0,seam,uv.x));
  }
  if(uv.x>1.0-seam){
    vec4 right=texture2D(atlas,vec2(uv.x-1.0+seam,uv.y));
    return mix(base,right,smoothstep(1.0-seam,1.0,uv.x));
  }
  return base;
}
void main(){
  vec2 p=(vUv-0.5)*2.0;
  float r2=dot(p,p);
  if(r2>=0.985) discard;
  vec3 normal=vec3(p.x,p.y,sqrt(max(0.0,1.0-r2)));
  float s=sin(uRotation),c=cos(uRotation);
  vec3 world=vec3(normal.x*c+normal.z*s,normal.y,-normal.x*s+normal.z*c);
  float lon=atan(world.z,world.x),lat=asin(clamp(world.y,-1.0,1.0));
  vec2 uv=vec2(fract(0.5+lon/(2.0*PI)),0.5+lat/PI);
  vec3 earth=sampleWrapped(uEarth,uv).rgb;
  // Genuine cloud imagery follows the rotating sphere continuously.
  float ocean=clamp((earth.b-earth.r)*3.0+(earth.b-earth.g)*2.0,0.0,1.0);
  earth=mix(earth,max(earth,vec3(0.06,0.23,0.47)),ocean*0.58);
  vec4 cloudTexel=sampleWrapped(uClouds,uv);
  // Transparent-white pixels in the cloud PNG must never render as white streaks.
  float cloud=smoothstep(0.035,0.94,min(cloudTexel.r,cloudTexel.a))*uCloudOpacity;
  earth=mix(earth,vec3(0.91,0.96,1.0),cloud);
  float sun=max(dot(normal,normalize(vec3(-0.38,0.48,0.80))),0.0);
  float rim=pow(1.0-normal.z,5.0);
  vec3 color=earth*(0.80+0.23*sun)+vec3(0.06,0.22,0.46)*rim;
  float alpha=1.0-smoothstep(0.968,0.993,sqrt(r2));
  gl_FragColor=vec4(color,alpha);
}
`;

function compile(gl:WebGLRenderingContext,type:number,code:string){
 const shader=gl.createShader(type);
 if(!shader)return null;
 gl.shaderSource(shader,code);gl.compileShader(shader);
 if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){gl.deleteShader(shader);return null;}
 return shader;
}

export function SeamlessEarthGlobe(){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const canvas=ref.current;
  if(!canvas)return;
  const gl=canvas.getContext("webgl",{alpha:true,antialias:true,premultipliedAlpha:false,preserveDrawingBuffer:true});
  if(!gl){canvas.dataset.globeStatus="unsupported";return;}
  const vs=compile(gl,gl.VERTEX_SHADER,VERTEX);
  const fs=compile(gl,gl.FRAGMENT_SHADER,FRAGMENT);
  if(!vs||!fs){if(vs)gl.deleteShader(vs);if(fs)gl.deleteShader(fs);canvas.dataset.globeStatus="unsupported";return;}
  const program=gl.createProgram(),buffer=gl.createBuffer(),texture=gl.createTexture(),cloudTexture=gl.createTexture();
  if(!program||!buffer||!texture||!cloudTexture){canvas.dataset.globeStatus="unsupported";return;}
  gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)){canvas.dataset.globeStatus="unsupported";return;}
  gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,"aPosition");
  const rotation=gl.getUniformLocation(program,"uRotation");
  const sampler=gl.getUniformLocation(program,"uEarth");
  const cloudSampler=gl.getUniformLocation(program,"uClouds");
  const cloudOpacity=gl.getUniformLocation(program,"uCloudOpacity");
  gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,cloudTexture);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,255]));
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  let disposed=false,loaded=false,cloudLoaded=false,visible=false,frame=0;
  const started=performance.now();
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
  function draw(now:number){
   if(!gl||!canvas||disposed||!loaded)return;
   const size=Math.min(400,Math.max(140,Math.round(canvas.clientWidth*Math.min(window.devicePixelRatio||1,2))));
   if(canvas.width!==size||canvas.height!==size){canvas.width=size;canvas.height=size;}
   gl.viewport(0,0,canvas.width,canvas.height);
   gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
   gl.useProgram(program);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
   gl.uniform1i(sampler,0);
   gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,cloudTexture);
   gl.uniform1i(cloudSampler,1);gl.uniform1f(cloudOpacity,cloudLoaded?0.55:0);
   // Constant angular velocity, and exactly identical at 0 and 2π.
   const phase=reduced.matches?0:((now-started)%TURN_DURATION_MS)/TURN_DURATION_MS;
   const angle=1.21+phase*2*Math.PI;
   canvas.dataset.globeAngle=angle.toFixed(6);
   canvas.dataset.globeMotion=reduced.matches?"reduced":"rotating";
   gl.uniform1f(rotation,angle);
   gl.drawArrays(gl.TRIANGLES,0,6);
  }
  function tick(now:number){draw(now);if(!disposed&&visible&&!document.hidden&&!reduced.matches)frame=requestAnimationFrame(tick);}
  function update(){cancelAnimationFrame(frame);if(disposed||!loaded||!visible||document.hidden)return;
   if(reduced.matches)draw(started);else frame=requestAnimationFrame(tick);}
  const image=new Image();image.crossOrigin="anonymous";
  image.onload=()=>{
   if(disposed)return;
   const atlas=document.createElement("canvas");atlas.width=1024;atlas.height=512;
   const ctx=atlas.getContext("2d");if(!ctx)return;
   ctx.drawImage(image,0,0,atlas.width,atlas.height);
   gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
   gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,atlas);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
   gl.generateMipmap(gl.TEXTURE_2D);
   loaded=true;draw(performance.now());canvas.dataset.globeStatus="ready";update();
  };
  let remoteFallbackUsed = false;
  image.onerror=()=>{
   if (disposed) return;
   if (!remoteFallbackUsed) {
    remoteFallbackUsed = true;
    image.src = EARTH_TEXTURE;
   } else {
    canvas.dataset.globeStatus = "unavailable";
   }
  };
  const cloudImage=new Image();cloudImage.crossOrigin="anonymous";
  cloudImage.onload=()=>{
   if(disposed)return;
   const atlas=document.createElement("canvas");atlas.width=1024;atlas.height=512;
   const ctx=atlas.getContext("2d");if(!ctx)return;
   ctx.drawImage(cloudImage,0,0,1024,512);
   gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,cloudTexture);
   gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
   gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,atlas);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
   gl.generateMipmap(gl.TEXTURE_2D);
   cloudLoaded=true;canvas.dataset.globeClouds="ready";draw(performance.now());
  };
  let cloudRemoteFallback=false;
  cloudImage.onerror=()=>{
   if(disposed)return;
   if(!cloudRemoteFallback){cloudRemoteFallback=true;cloudImage.src=CLOUD_TEXTURE;}
   else canvas.dataset.globeClouds="unavailable";
  };
  const observer=new IntersectionObserver(entries=>{visible=!!entries[0]?.isIntersecting;update();});
  observer.observe(canvas);
  document.addEventListener("visibilitychange",update);reduced.addEventListener("change",update);
  const basePath=window.location.pathname.startsWith("/shuomi")?"/shuomi":"";
  image.src=basePath+"/assets/cockpit/earth-blue-marble.jpg";
  cloudImage.src=basePath+"/assets/cockpit/earth-clouds.png";
  return ()=>{
   disposed=true;cancelAnimationFrame(frame);image.onload=null;image.onerror=null;
   cloudImage.onload=null;cloudImage.onerror=null;
   observer.disconnect();document.removeEventListener("visibilitychange",update);reduced.removeEventListener("change",update);
   gl.deleteTexture(texture);gl.deleteTexture(cloudTexture);gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);
  };
 },[]);
 return <canvas ref={ref} width={170} height={170} aria-hidden="true" data-globe-status="loading"/>;
}
