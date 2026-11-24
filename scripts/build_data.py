#!/usr/bin/env python3
"""Generate deterministic, browser-friendly gzip shards from the source library ZIP."""
import argparse, gzip, io, json, pathlib, re, zipfile

ROOT=pathlib.Path(__file__).resolve().parents[1]
DEFAULT_ZIP=ROOT.parent/'Response_Mode_100000_Prompts_Gemini_Workflow.zip'


def gz_bytes(raw: bytes):
    return gzip.compress(raw,compresslevel=9,mtime=0)


def build(src: pathlib.Path):
    index=[]; categories=[]; seen=set(); total=0
    with zipfile.ZipFile(src) as z:
        filenames=sorted(n for n in z.namelist() if re.search(r'/Prompts/\d+_.*\.jsonl$',n))
        for i,filename in enumerate(filenames):
            rows=[]
            for lineno,line in enumerate(z.read(filename).splitlines(),1):
                if not line.strip(): continue
                row=json.loads(line)
                rid=row['id']
                if rid in seen: raise ValueError(f'Duplicate ID {rid}: {filename}:{lineno}')
                seen.add(rid)
                rows.append(row)
                index.append([rid,row['title'],i,row.get('modes',''),row.get('subcategory',''),row.get('purpose','')])
            key=f'{i+1:02d}'
            dest=ROOT/'data'/'categories'/f'{key}.json.gz'
            dest.write_bytes(gz_bytes(json.dumps(rows,ensure_ascii=False,separators=(',',':')).encode()))
            categories.append({'id':key,'name':rows[0]['category'] if rows else filename,'count':len(rows),'start':rows[0]['id'] if rows else None,'end':rows[-1]['id'] if rows else None,'file':f'data/categories/{key}.json.gz'})
            total+=len(rows)
            print(f'{key} {categories[-1]["name"]:30s} {len(rows):5d} prompts {dest.stat().st_size/1024:.1f} KiB')
    if total!=100000: raise ValueError(f'Expected 100000, got {total}')
    seq=sorted(int(r[1:]) for r in seen)
    if seq[0]!=50001 or seq[-1]!=150000 or len(seq)!=seq[-1]-seq[0]+1: raise ValueError('Unexpected ID range')
    (ROOT/'data'/'catalog.json.gz').write_bytes(gz_bytes(json.dumps(index,ensure_ascii=False,separators=(',',':')).encode()))
    meta={'app':'PromptTantu','version':'1.0.0','source':'Response_Mode_100000_Prompts_Gemini_Workflow.zip','count':total,'first_id':'P50001','last_id':'P150000','category_count':len(categories),'categories':categories,'index_shape':['id','title','category_index','modes','subcategory','purpose']}
    (ROOT/'data'/'meta.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2),encoding='utf8')
    print('DONE',len(index),'index compressed:',(ROOT/'data'/'catalog.json.gz').stat().st_size,'bytes')

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('zip_path',nargs='?',type=pathlib.Path,default=DEFAULT_ZIP)
    args=p.parse_args(); build(args.zip_path)
