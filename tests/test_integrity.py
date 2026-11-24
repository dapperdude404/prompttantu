"""Validate all sharded PromptTantu data without external dependencies."""
import gzip,json,pathlib,sys,unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]

class DataIntegrity(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.meta=json.loads((ROOT/'data/meta.json').read_text())
        cls.index=json.loads(gzip.decompress((ROOT/'data/catalog.json.gz').read_bytes()))
        cls.weekly=json.loads((ROOT/'data/weekly-150001.json').read_text())
    def test_counts(self):
        self.assertEqual(self.meta['count'],100000)
        self.assertEqual(len(self.meta['categories']),20)
        self.assertEqual(len(self.index),100000)
        self.assertEqual(len(self.weekly),50)
    def test_complete_numbering(self):
        ids=[int(r[0][1:]) for r in self.index]+[int(r['id'][1:]) for r in self.weekly]
        self.assertEqual(len(set(ids)),100050)
        self.assertEqual(min(ids),50001)
        self.assertEqual(max(ids),150050)
        self.assertEqual(sorted(ids),list(range(50001,150051)))
    def test_shards(self):
        for ci,category in enumerate(self.meta['categories']):
            path=ROOT/category['file']
            rows=json.loads(gzip.decompress(path.read_bytes()))
            self.assertEqual(len(rows),5000)
            self.assertEqual(rows[0]['id'],category['start'])
            self.assertEqual(rows[-1]['id'],category['end'])
            self.assertTrue(all(r.get('template') and r.get('example') for r in rows))
            self.assertEqual(sum(1 for r in self.index if r[2]==ci),len(rows))
    def test_weekly(self):
        self.assertTrue(all(r.get('template') and r.get('example') and r.get('purpose') for r in self.weekly))
        self.assertEqual(self.weekly[0]['id'],'P150001')
        self.assertEqual(self.weekly[-1]['id'],'P150050')
        self.assertTrue(all(r['category'] in {c['name'] for c in self.meta['categories']} for r in self.weekly))
    def test_dom_bindings(self):
        import re
        from html.parser import HTMLParser
        class P(HTMLParser):
            def __init__(self): super().__init__();self.ids=set()
            def handle_starttag(self,tag,attrs):
                self.ids.update(v for k,v in attrs if k=='id')
        parser=P();parser.feed((ROOT/'index.html').read_text(encoding='utf8'))
        source=(ROOT/'assets/app.js').read_text(encoding='utf8')
        referenced=set(re.findall(r"\$\('([^']+)'\)",source))
        self.assertFalse(referenced-parser.ids,f'Missing HTML hooks: {sorted(referenced-parser.ids)}')
    def test_local_files(self):
        for filename in ['index.html','assets/app.css','assets/app.js','assets/icon.svg','sw.js','manifest.webmanifest']:
            self.assertTrue((ROOT/filename).exists())

if __name__=='__main__':unittest.main()
