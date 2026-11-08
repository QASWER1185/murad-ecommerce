// Local test helper only: force every published port onto IPv4 loopback before
// forwarding container creation to the explicitly selected local Docker socket.
// No body, environment, credential or Docker log is ever printed.
import http from 'node:http';
import {chmodSync,existsSync,unlinkSync} from 'node:fs';
export function guardContainerCreate(body, name, project) {
 if (!project || !/^murad-controlled-[a-z0-9-]+$/.test(project) || !name?.endsWith('_'+project)) throw Error('Unrecognized disposable test container');
 const h=body.HostConfig ||= {};
 if(h.Privileged || ['host','container'].some(x=>(h.NetworkMode||'').startsWith(x)))throw Error('Shared host networking/privilege forbidden');
 for(const bindings of Object.values(h.PortBindings||{}))for(const b of bindings||[])b.HostIp='127.0.0.1';
 return body;
}
export function startDockerProxy(socketPath, project) {
 if(!socketPath.startsWith(process.cwd()+'/work/controlled-') || existsSync(socketPath))throw Error('Fresh ignored local socket required');
 const server=http.createServer(async(req,res)=>{
  try{
   let chunks=[];for await(const b of req)chunks.push(b);
   let body=Buffer.concat(chunks);const url=new URL(req.url,'http://docker.local');
   if(req.method==='POST' && /\/containers\/create$/.test(url.pathname))body=Buffer.from(JSON.stringify(guardContainerCreate(JSON.parse(body),url.searchParams.get('name'),project)));
   const headers={...req.headers,'content-length':String(body.length)};delete headers['transfer-encoding'];
   const upstream=http.request({socketPath:'/var/run/docker.sock',path:req.url,method:req.method,headers},r=>{res.writeHead(r.statusCode,r.headers);r.pipe(res);});
   upstream.on('upgrade',(r,socket,head)=>{const downstream=res.socket;downstream.write(`HTTP/1.1 ${r.statusCode} ${r.statusMessage}\r\n`+Object.entries(r.headers).map(([k,v])=>`${k}: ${v}`).join('\r\n')+'\r\n\r\n');if(head.length)downstream.write(head);socket.pipe(downstream);downstream.pipe(socket);});
   upstream.on('error',()=>{if(!res.headersSent)res.writeHead(502);res.end('Local Docker forwarding failed');});upstream.end(body);
  }catch{res.writeHead(403);res.end('Local isolation guard rejected request');}
 });
 return new Promise(resolve=>server.listen(socketPath,()=>{chmodSync(socketPath,0o600);resolve({server,close:()=>new Promise(done=>server.close(()=>{if(existsSync(socketPath))unlinkSync(socketPath);done();}))});}));
}
