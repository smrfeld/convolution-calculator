from typing import List

from .face import *
from .path import *

def draw_face_top_grid(face: Face, nx, nz, x_top_left_start, y_top_left_start, options: FaceDrawOptions) -> List[Path]:
    ret = []
    for iz in range(0,nz):
        x_offset = iz*face.x_translate
        y_top_left = y_top_left_start + iz*face.y_translate

        for ix in range(0,nx):
            x_top_left = x_offset + x_top_left_start + ix*face.box_dim

            path0 = draw_face_top(
                x_top_left=x_top_left, 
                y_top_left=y_top_left, 
                face=face,
                options=options
                )
            ret.append(path0)

    return ret

def draw_face_left_grid(face: Face, ny, nz, x_top_left_start, y_top_left_start, options: FaceDrawOptions) -> List[Path]:
    ret = []
    for iz in range(0,nz):
        y_offset = iz*face.y_translate
        x_top_left = x_top_left_start + iz*face.x_translate

        for iy in range(0,ny):
            y_top_left = y_top_left_start + y_offset + iy*face.box_dim

            path0 = draw_face_left(
                x_top_left=x_top_left, 
                y_top_left=y_top_left, 
                face=face,
                options=options
                )
            ret.append(path0)

    return ret

def draw_face_front_grid(face: Face, nx, ny, x_top_left_start, y_top_left_start, options: FaceDrawOptions) -> List[Path]:
    ret = []
    for ix in range(0,nx):
        x_top_left = x_top_left_start + ix*face.box_dim

        for iy in range(0,ny):
            y_top_left = y_top_left_start + iy*face.box_dim

            path0 = draw_face_front(
                x_top_left=x_top_left, 
                y_top_left=y_top_left, 
                face=face,
                options=options
                )
            ret.append(path0)

    return ret