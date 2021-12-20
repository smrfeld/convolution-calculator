from dataclasses import dataclass
from typing import Tuple, List, Dict

def p_str(val: float) -> str:
    return str(max(min(int(100*val),100),0)) + "%"

@dataclass
class Path:
    pts : List[Tuple[int,int]]
    line_width : float
    fill : bool
    stroke : bool
    line_col : Tuple[float,float,float,float]
    fill_col : Tuple[float,float,float,float]

    def svg_style_str(self) -> str:
        s = ""

        if self.fill or self.stroke:
            s += 'style="'

        if self.fill:
            s += 'fill-rule:nonzero;'
            s += 'fill:rgb(%s,%s,%s);' % (
                p_str(self.fill_col[0]),
                p_str(self.fill_col[1]),
                p_str(self.fill_col[2])
                )
            s += 'fill-opacity:%d;' % self.fill_col[3]

        if self.stroke:
            s += 'stroke-width:%f;' % self.line_width
            s += 'stroke-linecap:butt;'
            s += 'stroke-linejoin:miter;'            

            s += 'stroke:rgb(%s,%s,%s);' % (
                p_str(self.line_col[0]),
                p_str(self.line_col[1]),
                p_str(self.line_col[2])
                )
            s += 'stroke-opacity:%f;' % self.line_col[3]
            
            s += 'stroke-miterlimit:10;'
        
        if self.fill or self.stroke:
            s += '"'
        
        return s

    def svg_str(self, id0: str) -> str:
        s = ''
        s += '<path id="%s" ' % id0

        s += self.svg_style_str()

        if len(self.pts) > 0:
            s += ' d="'
            s += 'M %d %d ' % (self.pts[0][0], self.pts[0][1])

            for ipt in range(0,len(self.pts)):
                s += 'L %d %d ' % (self.pts[ipt][0], self.pts[ipt][1])

            s += '"'

        s += '/>'

        return s

class Paths:
    entries: Dict[str,List[Path]] = {}

    def add_path(self, key: str, path: Path):
        if not key in self.entries:
            self.entries[key] = []
        self.entries[key].append(path)