from typing import List
from .path import *

def render_cairo(context, paths: List[Path]):

    # Draw paths
    for path in paths:
        # Draw
        context.move_to(path.pts[0][0], path.pts[0][1])
        for ipt in range(1,len(path.pts)):
            context.line_to(path.pts[ipt][0], path.pts[ipt][1])

        # Stroke and fill
        if path.fill:
            context.set_source_rgba(path.fill_col[0],path.fill_col[1],path.fill_col[2],path.fill_col[3])
            if path.stroke:
                context.fill_preserve()
            else:
                context.fill()
        if path.stroke:
            context.set_line_width(path.line_width)
            context.set_source_rgba(path.line_col[0],path.line_col[1],path.line_col[2],path.line_col[3])
            context.stroke()
