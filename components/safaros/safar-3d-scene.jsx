'use client';

import { useEffect, useRef } from 'react';

const vertexShader = [
'attribute vec3 aPosition;',
'attribute vec3 aNormal;',
'uniform mat4 uMvp;',
'uniform mat4 uModel;',
'varying vec3 vNormal;',
'void main(){ vec4 world=uModel*vec4(aPosition,1.0); vNormal=mat3(uModel)*aNormal; gl_Position=uMvp*vec4(aPosition,1.0); }'
].join('\n');
const fragmentShader = [
'precision mediump float;',
'uniform vec3 uColor;',
'uniform vec3 uLight;',
'varying vec3 vNormal;',
'void main(){ vec3 n=normalize(vNormal); float d=max(dot(n,normalize(uLight)),0.0); float glow=0.12+d*0.88; gl_FragColor=vec4(uColor*glow,1.0); }'
].join('\n');

function compile(gl,type,source){
 const shader=gl.createShader(type); gl.shaderSource(shader,source); gl.compileShader(shader);
 if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const message=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw new Error(message||'3D shader compilation failed');}
 return shader;
}
function programFor(gl){
 const program=gl.createProgram();gl.attachShader(program,compile(gl,gl.VERTEX_SHADER,vertexShader));gl.attachShader(program,compile(gl,gl.FRAGMENT_SHADER,fragmentShader));gl.linkProgram(program);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program)||'3D program link failed');
 return program;
}
function cubeGeometry(){
 const faces=[
 [[1,0,0],[[.5,-.5,-.5],[.5,.5,-.5],[.5,.5,.5],[.5,-.5,.5]]],
 [[-1,0,0],[[-.5,-.5,.5],[-.5,.5,.5],[-.5,.5,-.5],[-.5,-.5,-.5]]],
 [[0,1,0],[[-.5,.5,-.5],[-.5,.5,.5],[.5,.5,.5],[.5,.5,-.5]]],
 [[0,-1,0],[[-.5,-.5,.5],[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5]]],
 [[0,0,1],[[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5]]],
 [[0,0,-1],[[.5,-.5,-.5],[-.5,-.5,-.5],[-.5,.5,-.5],[.5,.5,-.5]]]
 ];
 const positions=[],normals=[];
 faces.forEach(([normal,corners])=>[0,1,2,0,2,3].forEach(index=>{positions.push(...corners[index]);normals.push(...normal);}));
 return {positions:new Float32Array(positions),normals:new Float32Array(normals),count:36};
}
function multiply(a,b){
 const out=new Float32Array(16);
 for(let c=0;c<4;c++)for(let r=0;r<4;r++)out[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];
 return out;
}
function perspective(fov,aspect,near,far){
 const f=1/Math.tan(fov/2),nf=1/(near-far);
 return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0]);
}
function lookAt(eye,target,up){
 const norm=v=>{const l=Math.hypot(...v)||1;return v.map(x=>x/l);};
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const dot=(a,b)=>a.reduce((sum,x,i)=>sum+x*b[i],0);
 const z=norm(eye.map((x,i)=>x-target[i])),x=norm(cross(up,z)),y=cross(z,x);
 return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);
}
function modelMatrix(position,scale,rotation=0){
 const c=Math.cos(rotation),s=Math.sin(rotation);
 return new Float32Array([c*scale[0],0,-s*scale[0],0,0,scale[1],0,0,s*scale[2],0,c*scale[2],0,position[0],position[1],position[2],1]);
}

export default function Safar3DScene(){
 const canvasRef=useRef(null);
 useEffect(()=>{
  const canvas=canvasRef.current;if(!canvas)return undefined;
  const gl=canvas.getContext('webgl',{alpha:true,antialias:true,powerPreference:'low-power'});if(!gl)return undefined;
  let program,raf=0,disposed=false,scroll=0;const buffers=[];
  const resize=()=>{const rect=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,1.5);const w=Math.max(1,Math.floor(rect.width*dpr)),h=Math.max(1,Math.floor(rect.height*dpr));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}};
  const onScroll=()=>{const max=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);scroll=Math.min(1,Math.max(0,window.scrollY/max));};
  try{
   program=programFor(gl);gl.useProgram(program);const geometry=cubeGeometry();
   const pos=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,pos);gl.bufferData(gl.ARRAY_BUFFER,geometry.positions,gl.STATIC_DRAW);buffers.push(pos);
   const normal=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,normal);gl.bufferData(gl.ARRAY_BUFFER,geometry.normals,gl.STATIC_DRAW);buffers.push(normal);
   const aPosition=gl.getAttribLocation(program,'aPosition'),aNormal=gl.getAttribLocation(program,'aNormal');
   const uMvp=gl.getUniformLocation(program,'uMvp'),uModel=gl.getUniformLocation(program,'uModel'),uColor=gl.getUniformLocation(program,'uColor'),uLight=gl.getUniformLocation(program,'uLight');
   gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
   gl.enableVertexAttribArray(aPosition);gl.bindBuffer(gl.ARRAY_BUFFER,pos);gl.vertexAttribPointer(aPosition,3,gl.FLOAT,false,0,0);
   gl.enableVertexAttribArray(aNormal);gl.bindBuffer(gl.ARRAY_BUFFER,normal);gl.vertexAttribPointer(aNormal,3,gl.FLOAT,false,0,0);
   const draw=(projection,view,position,scale,color,rotation=0)=>{const model=modelMatrix(position,scale,rotation),mvp=multiply(projection,multiply(view,model));gl.uniformMatrix4fv(uModel,false,model);gl.uniformMatrix4fv(uMvp,false,mvp);gl.uniform3fv(uColor,color);gl.drawArrays(gl.TRIANGLES,0,geometry.count);};
   const render=now=>{
    if(disposed)return;resize();onScroll();const t=now*.001,aspect=canvas.width/Math.max(1,canvas.height),orbit=scroll*.8;
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    const projection=perspective(Math.PI/3.2,aspect,.1,100),view=lookAt([Math.sin(orbit)*8,4.5+scroll*1.1,12-Math.cos(orbit)*1.2],[0,0,0],[0,1,0]);
    gl.uniform3f(uLight,-.45,.9,.55);
    draw(projection,view,[0,-2.3,-3],[12,.5,2],[.12,.2,.42]);
    for(let i=0;i<7;i++){const x=-8+i*2.7,h=2.5+(i%3)*.9;draw(projection,view,[x,-.8,-5],[1.9,h,1.4],[.22,.32,.58],(i%2)*.12);}
    const planeX=-4.6+((t*.62+scroll*3.5)%10),planeY=2.5+Math.sin(t*1.2)*.22+scroll*.7,planeRot=-.08+Math.sin(t*.7)*.035;
    draw(projection,view,[planeX,planeY,-1.5],[2.25,.22,.28],[.82,.9,1],planeRot);
    draw(projection,view,[planeX-.05,planeY+.02,-1.5],[.65,.055,3],[.34,.78,1],planeRot);
    draw(projection,view,[planeX-.88,planeY+.18,-1.5],[.42,.34,.48],[.68,.82,1],planeRot);
    draw(projection,view,[planeX-1.02,planeY+.22,-1.5],[.6,.06,.95],[.55,.7,.95],planeRot);
    const trainX=5.8-((t*.42+scroll*2.1)%12);
    for(let i=0;i<4;i++){const x=trainX+i*.88;draw(projection,view,[x,-.65,-.3],[.82,.48,.65],i===0?[.15,.72,.91]:[.68,.82,.96]);draw(projection,view,[x,-.36,-.3],[.58,.08,.68],[.12,.3,.55]);draw(projection,view,[x-.25,-.94,-.3],[.2,.2,.2],[.035,.055,.11],t*2);draw(projection,view,[x+.25,-.94,-.3],[.2,.2,.2],[.035,.055,.11],t*2);}
    const carX=-2.4+Math.sin(t*.42+scroll*2)*2.2;
    draw(projection,view,[carX,-1.2,2.3],[1.65,.48,.82],[.27,.43,.84],Math.sin(t*.42)*.08);
    draw(projection,view,[carX-.12,-.82,2.3],[.88,.38,.68],[.48,.76,.94],Math.sin(t*.42)*.08);
    [-.52,.52].forEach(x=>[-.43,.43].forEach(z=>draw(projection,view,[carX+x,-1.55,2.3+z],[.28,.34,.18],[.035,.055,.1],t*2)));
    raf=window.requestAnimationFrame(render);
   };
   resize();onScroll();raf=window.requestAnimationFrame(render);
  }catch(error){console.error('SafarOS 3D scene unavailable:',error);}
  window.addEventListener('resize',resize);window.addEventListener('scroll',onScroll,{passive:true});
  return()=>{disposed=true;cancelAnimationFrame(raf);window.removeEventListener('resize',resize);window.removeEventListener('scroll',onScroll);buffers.forEach(buffer=>gl.deleteBuffer(buffer));if(program)gl.deleteProgram(program);};
 },[]);
 return <canvas ref={canvasRef} className="safar-3d-canvas" aria-label="Real-time 3D scene showing an aeroplane, train and touring car moving through a mountain valley"/>;
}
