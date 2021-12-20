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
    line_width : float = 0.1
    line_col : Tuple[float,float,float,float] = (0,0,0,1)
    fill_col_top : Tuple[float,float,float,float] = (0,0,1,1)
    fill_col_left : Tuple[float,float,float,float] = (0,0,1,1)
    fill_col_front : Tuple[float,float,float,float] = (0,0,1,1)

@dataclass
class Face:
    w_translate: int
    h_translate: int
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

def draw_face_top(w_top_left: int, h_top_left: int, face: Face, options: FaceDrawOptions) -> Path:
    return path_from_pts(
        pts=[
            (w_top_left, h_top_left),
            (w_top_left + face.box_dim, h_top_left),
            (w_top_left + face.box_dim + face.w_translate, h_top_left + face.h_translate),
            (w_top_left + face.w_translate, h_top_left + face.h_translate),
            (w_top_left, h_top_left)
            ],
        options=options,
        side=Side.TOP
        )

def draw_face_left(w_top_left: int, h_top_left: int, face: Face, options: FaceDrawOptions) -> Path:
    return path_from_pts(
        pts=[
            (w_top_left, h_top_left),
            (w_top_left + face.w_translate, h_top_left + face.h_translate),
            (w_top_left + face.w_translate, h_top_left + face.h_translate + face.box_dim),
            (w_top_left, h_top_left + face.box_dim),
            (w_top_left, h_top_left)
            ],
        options=options,
        side=Side.LEFT
        )

def draw_face_front(w_top_left: int, h_top_left: int, face: Face, options: FaceDrawOptions):
    return path_from_pts(
        pts=[
            (w_top_left, h_top_left),
            (w_top_left + face.box_dim, h_top_left),
            (w_top_left + face.box_dim, h_top_left + face.box_dim),
            (w_top_left, h_top_left + face.box_dim),
            (w_top_left, h_top_left)
            ],
        options=options,
        side=Side.FRONT
        )
