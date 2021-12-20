from dataclasses import dataclass
from typing import Tuple, List
from enum import Enum

from .path import *

class Side(Enum):
    TOP = 0
    LEFT = 1
    FRONT = 2

@dataclass
class FaceDrawOptions:
    fill : bool
    stroke : bool
    line_width : float
    line_col : Tuple[float,float,float,float] = (0,0,0,1)
    fill_col_top : Tuple[float,float,float,float] = (0,0,1,1)
    fill_col_left : Tuple[float,float,float,float] = (0,0,1,1)
    fill_col_front : Tuple[float,float,float,float] = (0,0,1,1)

@dataclass
class Face:
    x_translate: int
    y_translate: int
    box_dim: int

def path_from_pts(pts: List[Tuple[int,int]], options: FaceDrawOptions, side: Side) -> Path:
    if side == Side.TOP:
        fill_col = options.fill_col_top
    elif side == Side.LEFT:
        fill_col = options.fill_col_left
    elif side == Side.FRONT:
        fill_col = options.fill_col_front
    else:
        fill_col = (0,0,1,1)

    return Path(
        pts=pts,
        fill=options.fill,
        stroke=options.stroke,
        line_width=options.line_width,
        line_col=options.line_col,
        fill_col=fill_col
        )

def draw_face_top(x_top_left: int, y_top_left: int, face: Face, options: FaceDrawOptions) -> Path:
    return path_from_pts(
        pts=[
            (x_top_left, y_top_left),
            (x_top_left + face.box_dim, y_top_left),
            (x_top_left + face.box_dim + face.x_translate, y_top_left + face.y_translate),
            (x_top_left + face.x_translate, y_top_left + face.y_translate),
            (x_top_left, y_top_left)
            ],
        options=options,
        side=Side.TOP
        )

def draw_face_left(x_top_left: int, y_top_left: int, face: Face, options: FaceDrawOptions) -> Path:
    return path_from_pts(
        pts=[
            (x_top_left, y_top_left),
            (x_top_left + face.x_translate, y_top_left + face.y_translate),
            (x_top_left + face.x_translate, y_top_left + face.y_translate + face.box_dim),
            (x_top_left, y_top_left + face.box_dim),
            (x_top_left, y_top_left)
            ],
        options=options,
        side=Side.LEFT
        )

def draw_face_front(x_top_left: int, y_top_left: int, face: Face, options: FaceDrawOptions):
    return path_from_pts(
        pts=[
            (x_top_left, y_top_left),
            (x_top_left + face.box_dim, y_top_left),
            (x_top_left + face.box_dim, y_top_left + face.box_dim),
            (x_top_left, y_top_left + face.box_dim),
            (x_top_left, y_top_left)
            ],
        options=options,
        side=Side.FRONT
        )
