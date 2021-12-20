import cairo
import numpy as np
from dataclasses import dataclass
from typing import Tuple, Dict

from enum import Enum

from raw_svg import *

face = Face(
    x_translate=30,
    y_translate=20,
    box_dim=50
    )

cube = Cube(
    nx=3,
    ny=6,
    nz=6,
    x_top_left_start=100,
    y_top_left_start=100
    )

sel = Selection(
    y_idx=-2,
    z_idx=4,
    sel_size=3
    )

options_sel = FaceDrawOptions(
        fill=True, 
        stroke=False,
        line_col=(0,0,0,1.0), 
        fill_col_top=(0,0,0.85,1.0),
        fill_col_left=(0,0,0.7,1.0),
        fill_col_front=(0,0,1.0,1.0),
        line_width=0.1
        )

options_grid = FaceDrawOptions(
    fill=False, 
    stroke=True, 
    line_col=(0,0,0,0.5),
    line_width=0.1
    )

paths = draw_cube_and_selection(
    face=face,
    cube=cube,
    sel=sel,
    options_sel=options_sel,
    options_grid=options_grid
    )

# creating a SVG surface
# here geek is file name & 700, 700 is dimension
with cairo.SVGSurface("test.svg", 1200, 1200) as surface:
  
    # creating a cairo context object
    context = cairo.Context(surface)

    # Draw paths
    render_cairo(context, paths)

    '''

    # creating a rectangle(square) for left eye
    context.rectangle(100, 100, 100, 100)
  
    # creating a rectangle(square) for right eye
    context.rectangle(500, 100, 100, 100)
  
    # creating position for the curves
    x, y, x1, y1 = 0.1, 0.5, 0.4, 0.9
    x2, y2, x3, y3 = 0.4, 0.1, 0.9, 0.6
  
    # setting scale of the context
    context.scale(700, 700)
  
    # setting line width of the context
    context.set_line_width(0.04)
  
    # move the context to x,y position
    context.move_to(x, y)
  
    # draw the curve for smile
    context.curve_to(x1, y1, x2, y2, x3, y3)
  
    # setting color of the context
    context.set_source_rgba(0.4, 1, 0.4, 1)
  
    # stroke out the color and width property
    context.stroke()
  
    '''

# printing message when file is saved
print("File Saved")
