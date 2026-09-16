// Run from a Node environment with @napi-rs/canvas installed.
// This renders vectors; it does not alter generated raster imagery.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas, loadImage } from '@napi-rs/canvas';
const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(await fs.readFile(path.join(base,'manifest.json'),'utf8'));
for(const file of (await fs.readdir(base)).filter(x=>/^\d.*-(dark|cream)\.svg$/.test(x))){
 const im=await loadImage(await fs.readFile(path.join(base,file)));
 const c=createCanvas(im.width,im.height);c.getContext('2d').drawImage(im,0,0);
 await fs.writeFile(path.join(base,file.replace('.svg','.png')),c.toBuffer('image/png'));
}
for(const tone of ['dark','cream']){
 const c=createCanvas(1800,1080),ctx=c.getContext('2d');
 ctx.fillStyle=tone==='dark'?'#151B1F':'#EDE5D5';ctx.fillRect(0,0,1800,1080);
 for(let i=0;i<manifest.concepts.length;i++){
  const x=i%3*600,y=Math.floor(i/3)*540,item=manifest.concepts[i];
  ctx.drawImage(await loadImage(await fs.readFile(path.join(base,`${item.id}-${tone}.png`))),x,y,600,450);
  ctx.font='22px sans-serif';ctx.fillStyle=tone==='dark'?'#EDE5D5':'#1B2226';
  ctx.fillText(`${String(i+1).padStart(2,'0')} / ${item.name}`,x+26,y+484);
 }
 await fs.writeFile(path.join(base,`overview-${tone}.png`),c.toBuffer('image/png'));
}
const c=createCanvas(1200,400),ctx=c.getContext('2d');ctx.fillStyle='#1B2226';ctx.fillRect(0,0,1200,400);
ctx.font='20px sans-serif';ctx.fillStyle='#EDE5D5';ctx.fillText('SMALL-SIZE CHECK / 64 px · 32 px · 24 px',30,40);
for(let i=0;i<manifest.concepts.length;i++){
 const im=await loadImage(await fs.readFile(path.join(base,manifest.concepts[i].id+'-mark-dark.svg')));
 for(const [j,size] of [64,32,24].entries())ctx.drawImage(im,i*200+(200-size)/2,82+j*84,size,size);
 ctx.fillText(String(i+1).padStart(2,'0'),i*200+84,370);
}
await fs.writeFile(path.join(base,'small-size-check.png'),c.toBuffer('image/png'));
console.log('Rendered 36 PNG assets, two overview boards and small-size board.');
