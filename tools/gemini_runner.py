#!/usr/bin/env python3
"""Opt-in Gemini SDK runner for PromptTantu. Dry-run by default; API calls require --send."""
import argparse,base64,json,mimetypes,os,pathlib,sys,time
from prompt_cli import get_by_id,parse_vars,render


def main():
    p=argparse.ArgumentParser(description='Render or send a PromptTantu prompt to Gemini (explicit --send required)')
    p.add_argument('id',help='P50001 through P150050')
    p.add_argument('--var',action='append',default=[],help='Repeat NAME=value')
    p.add_argument('--vars-json',help='JSON object containing variable values')
    p.add_argument('--image',action='append',default=[],help='Optional local image, repeatable, max 4')
    p.add_argument('--model',default=os.environ.get('GEMINI_MODEL'),help='Current valid Gemini model ID')
    p.add_argument('--image-output',action='store_true',help='Request TEXT and IMAGE output (model-dependent)')
    p.add_argument('--send',action='store_true',help='Makes a real API call that may incur usage charges')
    p.add_argument('--out',default='gemini_outputs',help='Local output directory')
    args=p.parse_args()
    try:
        item=get_by_id(args.id)
        prompt=render(item['template'],parse_vars(args.var,args.vars_json))
    except (ValueError,KeyError,json.JSONDecodeError,OSError) as e:p.error(str(e))
    if not args.send:
        print(prompt)
        print('\nDRY RUN: no API call, no upload. Add --send and set GEMINI_API_KEY only when ready.')
        return 0
    if '[[' in prompt:p.error('Unfilled placeholders remain. Set --var or --vars-json first.')
    if not args.model:p.error('Specify --model or GEMINI_MODEL; supported models change over time.')
    if not (os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY')):p.error('Set GEMINI_API_KEY or GOOGLE_API_KEY in your local environment. Never commit it.')
    if len(args.image)>4:p.error('This example limits attachments to four images.')
    try:
        from google import genai
        from google.genai import types
    except ImportError:p.error('Optional dependency missing. Install with pip install -U google-genai')
    contents=[prompt]
    for x in args.image:
        path=pathlib.Path(x).expanduser()
        if not path.is_file():p.error('Missing image: '+str(path))
        if path.stat().st_size>20_000_000:p.error('Image must be under 20 MB in this example: '+str(path))
        mime,_=mimetypes.guess_type(path.name)
        if not mime or not mime.startswith('image/'):p.error('File is not a recognized image: '+str(path))
        contents.append(types.Part.from_bytes(data=path.read_bytes(),mime_type=mime))
    config=types.GenerateContentConfig(response_modalities=['TEXT','IMAGE']) if args.image_output else None
    try:
        with genai.Client() as client:
            response=client.models.generate_content(model=args.model,contents=contents,config=config)
    except Exception:
        print('Gemini call failed. Check model ID, credentials, quota, policy, and image support.',file=sys.stderr)
        return 1
    out=pathlib.Path(args.out);out.mkdir(parents=True,exist_ok=True)
    texts=[];files=[]
    parts=getattr(response,'parts',None)
    if parts is None:
        candidates=getattr(response,'candidates',None) or []
        parts=getattr(getattr(candidates[0],'content',None),'parts',[]) if candidates else []
    for part in parts or []:
        text=getattr(part,'text',None)
        if text:texts.append(text)
        inline=getattr(part,'inline_data',None)
        if inline and getattr(inline,'data',None):
            mime=getattr(inline,'mime_type','image/png') or 'image/png'
            ext='.png' if 'png' in mime else '.jpg' if 'jpeg' in mime else '.bin'
            dest=out/f'{args.id}_image_{len(files)+1}{ext}'
            data=inline.data
            if isinstance(data,str):data=base64.b64decode(data)
            dest.write_bytes(data);files.append(dest)
    if not texts and getattr(response,'text',None):texts.append(response.text)
    if texts:
        dest=out/f'{args.id}_gemini.txt';dest.write_text('\n\n'.join(texts),encoding='utf8');files.append(dest)
    for file in files:print('Saved:',file)
    if not files:print('No printable output returned. Inspect response safety/model compatibility.',file=sys.stderr)
    return 0
if __name__=='__main__':sys.exit(main())
