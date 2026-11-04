#!/usr/bin/env python3
"""Full-picture ad images, the house format since 4 Nov 2026 (Mirza: "do this
always in this format, and never have the dots").

- The whole picture fills the frame, with the retro film look from analog.py.
- One centred text block: small white swirl (optional), a gold letter-spaced
  line, a big headline in The Seasons, optional short lines in Lato, and a
  gold letter-spaced tag such as LIMITED AVAILABILITY.
- Never the middle dot "·" anywhere in the type: use commas or plain words.
- The text sits in a calm part of the picture (sky), darkened by a soft top
  gradient when the picture is bright, never a blotchy shade over busy areas.
- The story (1080x1920) is the master. Its text sits low enough that the 4:5
  feed (1080x1350) is cut straight out of the story, so both match. Square
  (1080x1080) is rendered separately.
- Stories keep text clear of the top 220 px (Instagram's bar).

Run with ~/.local/nql-tools/bin/python fullpic.py (numpy for analog.py).
Add a set to SETS; output goes to ~/Downloads/<OUTDIR>/ and can be copied to
images/ads/ so Meta can fetch it.
"""
import sys; sys.path.insert(0,'.')
from analog import analog
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os
HERE=os.path.dirname(os.path.abspath(__file__)); os.chdir(HERE)
S=os.path.join(HERE,'fonts')+'/'
F='/Users/mirzahasecic/Downloads/The-Seasons-Font/TTF/The Seasons Light.ttf'
G='/Users/mirzahasecic/Downloads/NQL/gallery/swirl-white.png'
OUTDIR='NQL-Ski-Europe'
OUT=os.path.expanduser(f'~/Downloads/{OUTDIR}/'); os.makedirs(OUT,exist_ok=True)
WHITE=(255,255,255,255); SOFT=(242,238,230,255); GOLD=(238,210,158,255)
def font(p,s): return ImageFont.truetype(p,s)
def cover(src,W,H,ax=0.5,ay=0.5):
    iw,ih=src.size; s=max(W/iw,H/ih); im=src.resize((round(iw*s),round(ih*s)),Image.LANCZOS)
    x=int((im.width-W)*ax); y=int((im.height-H)*ay); return im.crop((x,y,x+W,y+H))
def soft_shade(im,cx,cy,rx,ry,alpha,blur):
    W,H=im.size; m=Image.new('L',(W,H),0); ImageDraw.Draw(m).ellipse([cx-rx,cy-ry,cx+rx,cy+ry],fill=alpha)
    m=m.filter(ImageFilter.GaussianBlur(blur)); return Image.composite(Image.new('RGB',(W,H),(12,10,8)),im,m)
def top_shade(im,alpha,end):
    W,H=im.size; m=Image.new('L',(W,H),0); d=ImageDraw.Draw(m); e=int(H*end)
    for yy in range(e): d.line([(0,yy),(W,yy)],fill=int(alpha*(1-yy/e)**1.6))
    return Image.composite(Image.new('RGB',(W,H),(14,14,18)),im,m)
def make(art,name,W,H,eyebrow,head,sub,tag,k=1.0,cy=0.5,ax=0.5,ay=0.5,shade=215,top=None,grad=0,gend=0.55,logo=True):
    src=Image.open(art).convert('RGB')
    im=analog(cover(src,W,H,ax,ay),grain=7.0,vignette=0.25,seed=7)
    probe=ImageDraw.Draw(Image.new('L',(10,10)))
    fe=font(S+'Lato-Bold.ttf',int(23*k)); fh=font(F,int(132*k)); fs=font(S+'Lato-Regular.ttf',int(33*k))
    sw=Image.open(G).convert('RGBA'); w=int(96*k); sw=sw.resize((w,int(w*sw.height/sw.width)))
    def bbox(t,f): b=probe.textbbox((0,0),t,font=f); return b[1],b[3]
    rows=([('img',None,None,None,0,0)] if logo else [])+[('sp',eyebrow,fe,GOLD,int(7*k),int(34*k) if logo else 0),('c',head,fh,WHITE,0,int(26*k))]
    for i,ln in enumerate(sub): rows.append(('c',ln,fs,SOFT,0,int(30*k) if i==0 else int(12*k)))
    rows.append(('sp',tag,fe,GOLD,int(7*k),int(36*k)))
    heights=[]
    for kind,t,f,_,_,gap in rows:
        if kind=='img': heights.append((gap,sw.height,0))
        else: t0,t1=bbox(t,f); heights.append((gap,t1-t0,t0))
    total=sum(g+h for g,h,_ in heights)
    if top is None:
        y=int(H*cy-total/2); im=soft_shade(im,W//2,int(H*cy),int(500*k),int(total*0.62),shade,int(120*k)).convert('RGBA')
    else:
        y=int(top*k*(1 if H>1500 else (0.55 if W!=H else 0.42)))
        im=(top_shade(im,grad,gend) if grad else im).convert('RGBA')
    sh=Image.new('RGBA',(W,H),(0,0,0,0)); txt=Image.new('RGBA',(W,H),(0,0,0,0)); ds=ImageDraw.Draw(sh); dt=ImageDraw.Draw(txt)
    for (kind,t,f,fill,sp,_),(gap,hgt,off) in zip(rows,heights):
        y+=gap
        if kind=='img': im.paste(sw,((W-w)//2,y),sw)
        else:
            for d,col in ((ds,(0,0,0,190)),(dt,fill)):
                if kind=='sp':
                    tw=sum(d.textlength(ch,font=f)+sp for ch in t)-sp; xx=(W-tw)/2
                    for ch in t: d.text((xx,y-off),ch,font=f,fill=col); xx+=d.textlength(ch,font=f)+sp
                else: d.text(((W-d.textlength(t,font=f))/2,y-off),t,font=f,fill=col)
        y+=hgt
    sh=sh.filter(ImageFilter.GaussianBlur(6*k)); im=Image.alpha_composite(im,sh); im=Image.alpha_composite(im,txt)
    im.convert('RGB').save(OUT+name,quality=93)
PLACES=["Courchevel, Méribel, Val d’Isère,","St. Moritz, Gstaad, Zermatt,","Kitzbühel, Lech, Cortina."]
SETS=[('ski-europe-01','art/ski-jet-gwagon.jpg','WINTER IN THE ALPS','Ski Season',PLACES,'LIMITED AVAILABILITY',dict(ax=0.62,top=380,grad=200,gend=0.62)),
      ('ski-europe-02','art/ski-jets-fur.jpg','FRANCE, SWITZERLAND, AUSTRIA, ITALY','The Alps',[],'LIMITED AVAILABILITY',dict(ax=0.38,ay=0.0,top=330,grad=150,gend=0.45,logo=False,fy=205))]
assert not any('·' in x for st in SETS for x in [st[2],st[3],st[5],*st[4]]), 'no middle dots in the type'
for n,art,e,h,s,t,o in SETS:
    fy=o.pop('fy',285)
    make(art,n+'-story.jpg',1080,1920,e,h,s,t,**o)
    Image.open(OUT+n+'-story.jpg').crop((0,fy,1080,fy+1350)).save(OUT+n+'-feed.jpg',quality=93); make(art,n+'-square.jpg',1080,1080,e,h,s,t,k=0.8,**o)
print('ok')
