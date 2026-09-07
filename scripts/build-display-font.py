"""Original uppercase display lettering with a narrow vertical, broad horizontal pen.
Built for A Clearing; no external font outlines or GSAPP font files are used.
Requires fonttools and brotli; regenerates the checked-in TTF / WOFF2 assets.
"""
from pathlib import Path
import math
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

ROOT = Path(__file__).resolve().parents[1]
glyphs = {}
widths = {}

def line(*points): return list(points)
def bezier(a,b,c,d,n=48):
    return [tuple((1-t)**3*a[j]+3*(1-t)**2*t*b[j]+3*(1-t)*t*t*c[j]+t**3*d[j] for j in range(2)) for t in [i/n for i in range(n+1)]]
def arc(cx,cy,rx,ry,start,end,n=96):
    return [(cx+rx*math.cos(t),cy+ry*math.sin(t)) for t in [math.radians(start+(end-start)*i/n) for i in range(n+1)]]
def stroke(pen, points, close=False, rx=4.5, ry=25):
    if close and points[-1] == points[0]: points = points[:-1]
    left=[];right=[]
    for i,(x,y) in enumerate(points):
        prev=points[(i-1)%len(points)] if close else points[max(0,i-1)]
        nxt=points[(i+1)%len(points)] if close else points[min(len(points)-1,i+1)]
        dx=nxt[0]-prev[0];dy=nxt[1]-prev[1]
        nx=-dy;ny=dx; den=math.hypot(rx*nx,ry*ny) or 1
        ox=rx*rx*nx/den;oy=ry*ry*ny/den
        left.append((x+ox+45,y+oy));right.append((x-ox+45,y-oy))
    if close:
        for contour in [left,right[::-1]]:
            pen.moveTo(contour[0])
            for pt in contour[1:]:pen.lineTo(pt)
            pen.closePath()
    else:
        pts=left+right[::-1];pen.moveTo(pts[0])
        for pt in pts[1:]:pen.lineTo(pt)
        pen.closePath()

def letter(name,width,paths):
    pen=TTGlyphPen(None)
    for points,closed in paths: stroke(pen,points,closed)
    glyphs[name]=pen.glyph();widths[name]=(width+90,35)
def P(*pts):return (line(*pts),False)
def B(a,b,c,d):return (bezier(a,b,c,d),False)
def A(cx,cy,rx,ry,start,end):return (arc(cx,cy,rx,ry,start,end),False)
# Caps use a 700-unit construction, with modest round overshoot.
letter('A',550,[P((0,0),(275,675),(550,0)),P((110,270),(440,270))])
letter('B',505,[P((0,0),(0,675)),P((0,675),(225,675)),B((225,675),(575,675),(575,355),(225,355)),P((225,355),(0,355)),B((225,355),(600,355),(600,25),(225,25)),P((225,25),(0,25))])
letter('C',560,[A(280,350,275,330,42,318)])
letter('D',560,[P((0,0),(0,675)),P((0,675),(180,675)),B((180,675),(675,675),(675,25),(180,25)),P((180,25),(0,25))])
letter('E',480,[P((0,0),(0,675)),P((0,675),(480,675)),P((0,355),(420,355)),P((0,25),(480,25))])
letter('F',460,[P((0,0),(0,675)),P((0,675),(460,675)),P((0,365),(400,365))])
letter('G',570,[A(280,350,275,330,42,318),P((560,350),(560,90)),P((560,350),(355,350))])
letter('H',540,[P((0,0),(0,700)),P((540,0),(540,700)),P((0,350),(540,350))])
letter('I',55,[P((27,0),(27,700))])
letter('J',370,[P((365,700),(365,180)),B((365,180),(365,-55),(0,-35),(0,160))])
letter('K',525,[P((0,0),(0,700)),P((0,335),(500,680)),P((135,430),(525,20))])
letter('L',460,[P((0,700),(0,25)),P((0,25),(460,25))])
letter('M',710,[P((0,0),(0,675),(355,20),(710,675),(710,0))])
letter('N',560,[P((0,0),(0,675),(560,25),(560,700))])
letter('O',570,[(arc(285,350,280,330,0,360),True)])
letter('P',500,[P((0,0),(0,675)),P((0,675),(220,675)),B((220,675),(575,675),(575,330),(220,330)),P((220,330),(0,330))])
letter('Q',570,[(arc(285,350,280,330,0,360),True),P((330,150),(550,-35))])
letter('R',545,[P((0,0),(0,675)),P((0,675),(220,675)),B((220,675),(575,675),(575,345),(220,345)),P((220,345),(0,345)),B((220,345),(385,345),(495,85),(545,5))])
letter('S',510,[B((500,565),(465,760),(5,735),(5,520)),B((5,520),(5,370),(510,380),(510,175)),B((510,175),(510,-45),(15,-55),(0,155))])
letter('T',560,[P((0,675),(560,675)),P((280,675),(280,0))])
letter('U',550,[P((0,700),(0,230)),B((0,230),(0,-55),(550,-55),(550,230)),P((550,230),(550,700))])
letter('V',550,[P((0,675),(275,25),(550,675))])
letter('W',800,[P((0,675),(200,25),(400,675),(600,25),(800,675))])
letter('X',530,[P((0,680),(530,20)),P((530,680),(0,20))])
letter('Y',540,[P((0,680),(270,350),(540,680)),P((270,350),(270,0))])
letter('Z',530,[P((0,675),(530,675)),P((530,650),(0,50)),P((0,25),(530,25))])
letter('space',200,[]);letter('.notdef',500,[])
fb=FontBuilder(1000,isTTF=True)
fb.setupGlyphOrder(['.notdef','space']+list('ABCDEFGHIJKLMNOPQRSTUVWXYZ'))
fb.setupCharacterMap({**{ord(c):c for c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'},**{ord(c.lower()):c for c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'},32:'space'})
fb.setupGlyf(glyphs);fb.setupHorizontalMetrics(widths)
fb.setupHorizontalHeader(ascent=850,descent=-150)
fb.setupNameTable({'familyName':'Clearing Display','styleName':'Regular','uniqueFontIdentifier':'Clearing Display Regular 1.0','fullName':'Clearing Display Regular','psName':'ClearingDisplay-Regular','version':'Version 1.0','copyright':'Original lettering created for Xinyi (Sydnie) Zhang, 2026.'})
fb.setupOS2(sTypoAscender=850,sTypoDescender=-150,usWinAscent=850,usWinDescent=150,sCapHeight=700,sxHeight=700)
fb.setupPost();fb.setupMaxp()
folder=ROOT/'public/fonts';folder.mkdir(exist_ok=True)
fb.save(folder/'ClearingDisplay.ttf')
fb.font.flavor='woff2';fb.font.save(folder/'ClearingDisplay.woff2')
print('Built original Clearing Display font.')
