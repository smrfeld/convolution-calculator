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
class FaceDrawOptions:
    fill : bool
    stroke : bool
    line_col : Tuple[float,float,float,float] = (0,0,0,1)
    fill_col_top : Tuple[float,float,float,float] = (0,0,1,1)
    fill_col_left : Tuple[float,float,float,float] = (0,0,1,1)
    fill_col_front : Tuple[float,float,float,float] = (0,0,1,1)

@dataclass
class Face:
    x_translate: int
    y_translate: int
    box_dim: int

def draw_face_op(context, side: Side, options : FaceDrawOptions):
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
        if options.stroke:
            context.fill_preserve()
        else:
            context.fill()
    if options.stroke:
        context.set_line_width(1.0)
        context.set_source_rgba(options.line_col[0],options.line_col[1],options.line_col[2],options.line_col[3])
        context.stroke()

def draw_face_top(context, x_top_left: int, y_top_left: int, face: Face, options: FaceDrawOptions):
    context.move_to(x_top_left, y_top_left)
    context.line_to(x_top_left + face.box_dim, y_top_left)
    context.line_to(x_top_left + face.box_dim + face.x_translate, y_top_left + face.y_translate)
    context.line_to(x_top_left + face.x_translate, y_top_left + face.y_translate)
    context.line_to(x_top_left, y_top_left)
    draw_face_op(context, Side.TOP, options)

def draw_face_left(context, x_top_left: int, y_top_left: int, face: Face, options: FaceDrawOptions):
    context.move_to(x_top_left, y_top_left)
    context.line_to(x_top_left + face.x_translate, y_top_left + face.y_translate)
    context.line_to(x_top_left + face.x_translate, y_top_left + face.y_translate + face.box_dim)
    context.line_to(x_top_left, y_top_left + face.box_dim)
    context.line_to(x_top_left, y_top_left)
    draw_face_op(context, Side.LEFT, options)

def draw_face_front(context, x_top_left: int, y_top_left: int, face: Face, options: FaceDrawOptions):
    context.move_to(x_top_left, y_top_left)
    context.line_to(x_top_left + face.box_dim, y_top_left)
    context.line_to(x_top_left + face.box_dim, y_top_left + face.box_dim)
    context.line_to(x_top_left, y_top_left + face.box_dim)
    context.line_to(x_top_left, y_top_left)
    draw_face_op(context, Side.FRONT, options)