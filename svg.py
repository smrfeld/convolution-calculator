# importing pycairo
import cairo
import numpy as np
from dataclasses import dataclass
from typing import Tuple, Dict

from enum import Enum

class Side(Enum):
    TOP = 0
    LEFT = 1
    FRONT = 2

@dataclass
class CubeDrawOptions:
    fill : bool
    line_op : float
    fill_col_top : Tuple[float,float,float,float] = (0,0,1,1)
    fill_col_left : Tuple[float,float,float,float] = (0,0,1,1)
    fill_col_front : Tuple[float,float,float,float] = (0,0,1,1)

def draw_cube_op(context, side: Side, options : CubeDrawOptions):
    if side == Side.TOP:
        fill_col = options.fill_col_top
    elif side == Side.LEFT:
        fill_col = options.fill_col_left
    elif side == Side.FRONT:
        fill_col = options.fill_col_front
    else:
        fill_col = (0,0,1,1)

    if options.fill:
        context.set_source_rgba(fill_col[0],fill_col[1],fill_col[2],fill_col[3])
        context.fill_preserve()
        context.set_line_width(1.0)
        context.set_source_rgba(0,0,0,options.line_op)
        context.stroke()
    else:
        context.set_line_width(1.0)
        context.set_source_rgba(0,0,0,options.line_op)
        context.stroke()

def draw_cube_top(context, x_translate, y_translate, x_top_left, y_top_left, z_width, options):
    context.move_to(x_top_left, y_top_left)
    context.line_to(x_top_left + z_width, y_top_left)
    context.line_to(x_top_left + z_width + x_translate, y_top_left + y_translate)
    context.line_to(x_top_left + x_translate, y_top_left + y_translate)
    context.line_to(x_top_left, y_top_left)
    draw_cube_op(context, Side.TOP, options)

def draw_cube_left(context, x_translate, y_translate, x_top_left, y_top_left, y_width, options):
    context.move_to(x_top_left, y_top_left)
    context.line_to(x_top_left + x_translate, y_top_left + y_translate)
    context.line_to(x_top_left + x_translate, y_top_left + y_translate + y_width)
    context.line_to(x_top_left, y_top_left + y_width)
    context.line_to(x_top_left, y_top_left)
    draw_cube_op(context, Side.LEFT, options)

def draw_cube_front(context, x_top_left, y_top_left, box_dim, options):
    context.move_to(x_top_left, y_top_left)
    context.line_to(x_top_left + box_dim, y_top_left)
    context.line_to(x_top_left + box_dim, y_top_left + box_dim)
    context.line_to(x_top_left, y_top_left + box_dim)
    context.line_to(x_top_left, y_top_left)
    draw_cube_op(context, Side.FRONT, options)

def draw_cube_top_grid(context, x_translate, y_translate, box_dim, nx, nz, x_top_left_start, y_top_left_start, options):
    for iz in range(0,nz):
        x_offset = iz*x_translate
        y_top_left = y_top_left_start + iz*y_translate

        for ix in range(0,nx):
            x_top_left = x_offset + x_top_left_start + ix*box_dim

            draw_cube_top(context, 
                x_translate=x_translate, 
                y_translate=y_translate, 
                x_top_left=x_top_left, 
                y_top_left=y_top_left, 
                z_width=box_dim,
                options=options
                )

def draw_cube_left_grid(context, x_translate, y_translate, box_dim, ny, nz, x_top_left_start, y_top_left_start, options):
    for iz in range(0,nz):
        y_offset = iz*y_translate
        x_top_left = x_top_left_start + iz*x_translate

        for iy in range(0,ny):
            y_top_left = y_top_left_start + y_offset + iy*box_dim

            draw_cube_left(context, 
                x_translate=x_translate, 
                y_translate=y_translate, 
                x_top_left=x_top_left, 
                y_top_left=y_top_left, 
                y_width=box_dim,
                options=options
                )

def draw_cube_front_grid(context, box_dim, nx, ny, x_top_left_start, y_top_left_start, options):
    for ix in range(0,nx):
        x_top_left = x_top_left_start + ix*box_dim

        for iy in range(0,ny):
            y_top_left = y_top_left_start + iy*box_dim

            draw_cube_front(context,  
                x_top_left=x_top_left, 
                y_top_left=y_top_left, 
                box_dim=box_dim,
                options=options
                )

def draw_cube(context, x_translate, y_translate, box_dim, nx, ny, nz, x_top_left_start, y_top_left_start, options):

    draw_cube_top_grid(context, 
        x_translate=x_translate, 
        y_translate=y_translate, 
        box_dim=box_dim, 
        nx=nx, 
        nz=nz, 
        x_top_left_start=x_top_left_start, 
        y_top_left_start=y_top_left_start,
        options=options
        )

    draw_cube_left_grid(context,
        x_translate=x_translate,
        y_translate=y_translate, 
        box_dim=box_dim, 
        ny=ny, 
        nz=nz, 
        x_top_left_start=x_top_left_start, 
        y_top_left_start=y_top_left_start,
        options=options
        )

    draw_cube_front_grid(context, 
        box_dim=box_dim, 
        nx=nx, 
        ny=ny, 
        x_top_left_start=x_top_left_start+nz*x_translate, 
        y_top_left_start=y_top_left_start+nz*y_translate,
        options=options
        )

@dataclass
class Selection:
    y_idx: int
    z_idx: int
    sel_size: int

def draw_cube_and_selection_interior(context, x_translate, y_translate, box_dim, nx, ny, nz, x_top_left_start, y_top_left_start, sel: Selection):

    draw_cube(context, 
        x_translate=sel.sel_size*x_translate, 
        y_translate=sel.sel_size*y_translate, 
        box_dim=sel.sel_size*box_dim, 
        nx=1, 
        ny=1,
        nz=1, 
        x_top_left_start=x_top_left_start + sel.z_idx*x_translate, 
        y_top_left_start=y_top_left_start + sel.z_idx*y_translate + sel.y_idx*box_dim,
        options=CubeDrawOptions(
            fill=True, 
            line_op=1.0, 
            fill_col_top=(0,0,1,0.5),
            fill_col_left=(0,0,0.7,0.5),
            fill_col_front=(0,0,0.4,0.5)
            )
        )

    draw_cube(context, 
        x_translate=x_translate, 
        y_translate=y_translate, 
        box_dim=box_dim, 
        nx=nx, 
        ny=ny,
        nz=nz, 
        x_top_left_start=x_top_left_start, 
        y_top_left_start=y_top_left_start,
        options=CubeDrawOptions(fill=False, line_op=0.25)
        )

# creating a SVG surface
# here geek is file name & 700, 700 is dimension
with cairo.SVGSurface("svg.svg", 1200, 1200) as surface:
  
    # creating a cairo context object
    context = cairo.Context(surface)
    
    # draw_grid(context, 10, 10, 100, 100, 5, 5)
    
    '''
    draw_cube_top(context, 
        x_translate=50, 
        y_translate=50, 
        x_top_left=50, 
        y_top_left=50, 
        width=100
        )
    '''

    x_translate = 30
    y_translate = 20
    box_dim = 50
    nx = 3
    ny = 6
    nz = 6
    x_top_left_start = 100
    y_top_left_start = 100

    draw_cube_and_selection_interior(context,
        x_translate=x_translate, 
        y_translate=y_translate, 
        box_dim=box_dim, 
        nx=nx, 
        ny=ny, 
        nz=nz, 
        x_top_left_start=x_top_left_start, 
        y_top_left_start=y_top_left_start, 
        sel=Selection(
            y_idx=1,
            z_idx=3,
            sel_size=3
        ))

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
