// Same approved pixels, lossless format companions. Originals stay unchanged.
import sharp from 'sharp';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const results=[];
const partA=process.argv.includes("--part-a");
const sources=partA ? ["public/homepage/banner-pipes.png","public/homepage/banner-building.png","public/homepage/footer-decoration.png","public/sanitary/promotion-art.png"] : ["public/homepage/hero.png","public/homepage/hero-mobile.png","public/sanitary/hero-art.png"];
const evidence=partA ? "docs/phase8-part-a/evidence" : "docs/phase7/evidence";
for(const source of sources){
 const input=readFileSync(source),output=await sharp(input).webp({lossless:true,effort:6}).toBuffer();
 const originalPixels=await sharp(input).ensureAlpha().raw().toBuffer(),optimizedPixels=await sharp(output).ensureAlpha().raw().toBuffer();
 if(!originalPixels.equals(optimizedPixels)||output.length>=input.length)throw Error('Lossless companion must preserve every pixel and reduce bytes');
 results.push({source,target:source.replace(/\.png$/,'.webp'),originalBytes:input.length,optimizedBytes:output.length,pixelsIdentical:true,sourceSha256:createHash('sha256').update(input).digest('hex'),outputSha256:createHash('sha256').update(output).digest('hex'),output});
}
for(const result of results)writeFileSync(result.target,result.output);
mkdirSync(evidence,{recursive:true});
writeFileSync(`${evidence}/reference-assets.json`,JSON.stringify(results.map(result=>{const metadata={...result};delete metadata.output;return metadata;}),null,2)+'\n');
console.log(results.map(({source,originalBytes,optimizedBytes,pixelsIdentical})=>({source,originalBytes,optimizedBytes,pixelsIdentical})));
