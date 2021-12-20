from dataclasses import dataclass
from typing import List

from .face_grid import *
from .path import *

@dataclass
class Cube:
    nx: int
    ny: int
    nz: int
    x_top_left_start: int
    y_top_left_start: int

def draw_cube(face: Face, cube: Cube, options: FaceDrawOptions) -> List[Path]:
    paths = []

    paths0 = draw_face_top_grid(
        face=face, 
        nx=cube.nx, 
        nz=cube.nz, 
        x_top_left_start=cube.x_top_left_start, 
        y_top_left_start=cube.y_top_left_start,
        options=options
        )
    paths += paths0

    paths0 = draw_face_left_grid(
        face=face,
        ny=cube.ny, 
        nz=cube.nz, 
        x_top_left_start=cube.x_top_left_start, 
        y_top_left_start=cube.y_top_left_start,
        options=options
        )
    paths += paths0

    paths0 = draw_face_front_grid( 
        face=face, 
        nx=cube.nx, 
        ny=cube.ny, 
        x_top_left_start=cube.x_top_left_start + cube.nz*face.x_translate, 
        y_top_left_start=cube.y_top_left_start + cube.nz*face.y_translate,
        options=options
        )
    paths += paths0

    return paths