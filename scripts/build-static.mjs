// Explicit allowlist: private snapshots and repository documentation never enter dist.
import {mkdir,cp,writeFile,rm,readFile} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});
await mkdir('dist/data',{recursive:true});
await mkdir('dist/docs',{recursive:true});
for(const path of ['index.html','sw.js','manifest.webmanifest','icon.svg','src','vendor','data/research.js','data/research.json','docs/OPERATIONS.md']){
 await cp(path,'dist/'+path,{recursive:true});
}
await writeFile('dist/.nojekyll','');
console.log('Static allowlist built; private snapshots, credentials and repository metadata excluded.');
