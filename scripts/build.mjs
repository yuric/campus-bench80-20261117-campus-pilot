import { mkdir, readdir, lstat, copyFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
const roots = ['index.html','src','assets','styles'];
await rm('dist', { recursive: true, force: true });
await mkdir('dist', {recursive:true});
async function copy(src,dest) {
  const stat=await lstat(src);
  if(stat.isSymbolicLink()) throw new Error(`Refusing symlink: ${src}`);
  if(stat.isDirectory()) {
    await mkdir(dest,{recursive:true});
    for(const name of (await readdir(src)).sort()) {
      if(name.startsWith('.')) continue;
      await copy(join(src,name),join(dest,name));
    }
  } else if(stat.isFile()) await copyFile(src,dest);
}
for(const root of roots) await copy(root,join('dist',root));
console.log('Built static app in dist/');
