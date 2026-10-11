// Build only public static files: never copy environment secrets, private JSON backups, or GitHub config.
import {mkdir,cp,writeFile} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
for(const path of ['index.html','sw.js','manifest.webmanifest','icon.svg','src','vendor','data','docs']){
 await cp(path,'dist/'+path,{recursive:true});
}
await writeFile('dist/.nojekyll','');
console.log('Static public dashboard built: index, frontend, public research and vendor files only.');
