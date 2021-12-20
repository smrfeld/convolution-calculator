import cairo
import numpy as np
from dataclasses import dataclass
from typing import Tuple, Dict

from enum import Enum

from face_grid import *

@dataclass
class Cube:
    nx: int
    ny: int
    nz: int
    x_top_left_start: int
    y_top_left_start: int

def draw_cube(context, face: Face, cube: Cube, options: FaceDrawOptions):

    draw_face_top_grid(context, 
        face=face, 
        nx=cube.nx, 
        nz=cube.nz, 
        x_top_left_start=cube.x_top_left_start, 
        y_top_left_start=cube.y_top_left_start,
        options=options
        )

    draw_face_left_grid(context,
        face=face,
        ny=cube.ny, 
        nz=cube.nz, 
        x_top_left_start=cube.x_top_left_start, 
        y_top_left_start=cube.y_top_left_start,
        options=options
        )

    draw_face_front_grid(context, 
        face=face, 
        nx=cube.nx, 
        ny=cube.ny, 
        x_top_left_start=cube.x_top_left_start + cube.nz*face.x_translate, 
        y_top_left_start=cube.y_top_left_start + cube.nz*face.y_translate,
        options=options
        )