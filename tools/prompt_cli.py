#!/usr/bin/env python3
"""PromptTantu local CLI. No network access, no third-party Python dependencies."""
import argparse,gzip,json,pathlib,re,sys
ROOT=pathlib.Path(__file__).resolve().parents[1]

def records(root=ROOT):
    meta=json.loads((root/'data/meta.json').read_text(encoding='utf8'))
    for category in meta['categories']:
        for row in json.loads(gzip.decompress((root/category['file']).read_bytes())):
            yield row
    for row in json.loads((root/'data/weekly-150001.json').read_text(encoding='utf8')):
        yield row

def get_by_id(id,root=ROOT):
    m=re.fullmatch(r'P(\d+)',id.upper())
    if not m: raise ValueError('Use a prompt ID such as P50001 or P150050')
    number=int(m.group(1))
    if not 50001<=number<=150050:raise ValueError('Prompt ID is outside the bundled catalog')
    if number>=150001:
        return json.loads((root/'data/weekly-150001.json').read_text(encoding='utf8'))[number-150001]
    ci=(number-50001)//5000
    meta=json.loads((root/'data/meta.json').read_text(encoding='utf8'))
    rows=json.loads(gzip.decompress((root/meta['categories'][ci]['file']).read_bytes()))
    return rows[(number-50001)%5000]

def render(template,values):
    return re.sub(r'\[\[([A-Z][A-Z0-9_]*)\]\]',lambda m:values.get(m.group(1),m.group(0)),template)

def parse_vars(items,vars_json=None):
    values={}
    if vars_json:
        data=json.loads(pathlib.Path(vars_json).read_text(encoding='utf8'))
        if not isinstance(data,dict):raise ValueError('--vars-json must contain a JSON object')
        values.update({str(k):str(v) for k,v in data.items()})
    for item in items:
        if '=' not in item:raise ValueError('--var must be KEY=value')
        k,v=item.split('=',1);values[k]=v
    return values

def main(argv=None):
    parser=argparse.ArgumentParser(description='Search, inspect and render PromptTantu prompts offline')
    cmd=parser.add_subparsers(dest='command',required=True)
    search=cmd.add_parser('search');search.add_argument('query');search.add_argument('--limit',type=int,default=20)
    show=cmd.add_parser('show');show.add_argument('id')
    compose=cmd.add_parser('render');compose.add_argument('id');compose.add_argument('--var',action='append',default=[]);compose.add_argument('--vars-json')
    args=parser.parse_args(argv)
    if args.command=='search':
        terms=args.query.lower().split();hits=0
        for r in records():
            hay=' '.join(str(r.get(k,'')) for k in ('id','title','purpose','modes','subcategory')).lower()
            if all(t in hay for t in terms):
                print(f"{r['id']} | {r['category']} | {r['title']}");hits+=1
                if hits>=max(1,args.limit):break
        if not hits:print('No matches found')
    elif args.command=='show':
        r=get_by_id(args.id);print(json.dumps(r,ensure_ascii=False,indent=2))
    elif args.command=='render':
        r=get_by_id(args.id);values=parse_vars(args.var,args.vars_json);print(render(r['template'],values))
    return 0
if __name__=='__main__':sys.exit(main())
