import os
from html.parser import HTMLParser

class Parser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links=[]
        self.scripts=[]
        self.images=[]
        self.head_seen=False
        self.in_head=False
        self.head_closed=True
    def handle_starttag(self, tag, attrs):
        attrs=dict(attrs)
        if tag=='head':
            self.head_seen=True
            self.in_head=True
            self.head_closed=False
        elif tag=='body' and self.in_head:
            self.head_closed=True
            self.in_head=False
        if tag=='a' and 'href' in attrs:
            self.links.append(attrs['href'])
        if tag=='script' and 'src' in attrs:
            self.scripts.append(attrs['src'])
        if tag=='img' and 'src' in attrs:
            self.images.append(attrs['src'])
        if tag=='link' and 'href' in attrs:
            self.links.append(attrs['href'])

files = [f for f in os.listdir('.') if f.endswith('.html')]
files += [os.path.join('pages', f) for f in os.listdir('pages') if f.endswith('.html')]

for path in files:
    if not os.path.exists(path):
        continue
    with open(path, encoding='utf-8') as fh:
        text=fh.read()
    p=Parser(); p.feed(text)
    if not p.head_seen or not p.head_closed:
        print('HEAD ISSUE', path)
    for href in p.links + p.scripts + p.images:
        if href.startswith(('http://','https://','mailto:','tel:','javascript:','#')):
            continue
        if href.startswith('/'):
            target = href[1:]
            if not os.path.exists(target):
                print('BROKEN PATH', path, '->', href)
            continue
        target = os.path.normpath(os.path.join(os.path.dirname(path), href))
        if not os.path.exists(target):
            print('BROKEN PATH', path, '->', href, '=>', target)
