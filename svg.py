import cairo
import numpy as np
from dataclasses import dataclass
from typing import Tuple, Dict

from enum import Enum

from cube_and_selection import *

# creating a SVG surface
# here geek is file name & 700, 700 is dimension
with cairo.SVGSurface("svg.svg", 1200, 1200) as surface:
  
    # creating a cairo context object
    context = cairo.Context(surface)
    
    # draw_cube(context, 10, 10, 100, 100, 5, 5)
    
    '''
    draw_cube_top(context, 
        x_translate=50, 
        y_translate=50, 
        x_top_left=50, 
        y_top_left=50, 
        width=100
        )
    '''

    face = Face(
        x_translate=30,
        y_translate=20,
        box_dim=50
        )

    cube = Cube(
        nx=3,
        ny=4,
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
            fill_col_front=(0,0,1.0,1.0)
            )

    options_grid = FaceDrawOptions(
        fill=False, 
        stroke=True, 
        line_col=(0,0,0,0.5)
        )

    draw_cube_and_selection(context,
        face=face,
        cube=cube,
        sel=sel,
        options_sel=options_sel,
        options_grid=options_grid
        )

    '''
    draw_cube_left(context, 
        x_translate=30, 
        y_translate=20, 
        x_top_left=400, 
        y_top_left=400, 
        height=50
        )
    '''

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
