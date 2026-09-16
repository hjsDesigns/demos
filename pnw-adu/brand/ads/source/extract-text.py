#!/usr/bin/env python3
"""Optional macOS regeneration when ad text changes; does not touch raster assets."""
from pathlib import Path
import subprocess,json,os,tempfile
base=Path(__file__).resolve().parent.parent
brand=base.parent
strings=['A second home','in your backyard.','in your','backyard.','Set up a consultation','[PHONE TO COME]','CONCEPT']
env=dict(os.environ,CLANG_MODULE_CACHE_PATH='/private/tmp/pnw-clang-cache')
with tempfile.TemporaryDirectory(prefix='pnw-ad-outlines-') as td:
 executable=Path(td)/'outline'
 subprocess.run(['swiftc',str(brand/'logos/source/outline.swift'),'-o',str(executable)],check=True,env=env)
 result={}
 for i,t in enumerate(strings):
  out=Path(td)/f'{i}.json'
  subprocess.run([str(executable),str(brand/'fonts/Archivo-Variable.ttf'),str(out),t,'0'],check=True)
  result[t]=json.loads(out.read_text())
 (base/'source/text-paths.json').write_text(json.dumps(result,indent=2)+'\n')
