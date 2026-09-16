// Native vector-layout renderer. Requires @napi-rs/canvas.
// The installed SVG engine does not draw embedded JPEG <image> nodes.
// We therefore draw the source SVG vectors, then the exact embedded JPEG at
// the SVG's declared full-frame image rectangle. No text overlaps that region.
// Original photograph pixels are never retouched, cropped, graded or replaced.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createCanvas,loadImage} from '@napi-rs/canvas';
const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(await fs.readFile(path.join(base,'manifest.json'),'utf8'));
for(const ad of manifest.layouts){
 const source=await fs.readFile(path.join(base,ad.svg),'utf8');
 const vector=await loadImage(Buffer.from(source));
 const c=createCanvas(...ad.pixels),ctx=c.getContext('2d');
 ctx.drawImage(vector,0,0,...ad.pixels);
 const rect=source.match(/<image x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"/);
 const data=source.match(/xlink:href="data:image\/jpeg;base64,([^"]+)"/);
 if(!rect||!data)throw new Error('Missing embedded photo or full-frame rectangle: '+ad.id);
 const photograph=await loadImage(Buffer.from(data[1],'base64'));
 ctx.drawImage(photograph,...rect.slice(1).map(Number));
 await fs.writeFile(path.join(base,ad.png),c.toBuffer('image/png'));
}
const board=createCanvas(1800,1900),ctx=board.getContext('2d');
ctx.fillStyle='#151B1F';ctx.fillRect(0,0,1800,1900);
for(let i=0;i<manifest.layouts.length;i++){
 const ad=manifest.layouts[i],im=await loadImage(await fs.readFile(path.join(base,ad.png)));
 const x=(i%2)*900,y=Math.floor(i/2)*950,scale=Math.min(840/im.width,820/im.height);
 ctx.fillStyle='#EDE5D5';ctx.font='22px sans-serif';ctx.fillText(`${i+1} / ${ad.title}`,x+30,y+42);
 ctx.drawImage(im,x+(900-im.width*scale)/2,y+80+(820-im.height*scale)/2,im.width*scale,im.height*scale);
}
await fs.writeFile(path.join(base,'overview.png'),board.toBuffer('image/png'));
console.log('Rendered four exact-size concept PNGs and one overview board.');
