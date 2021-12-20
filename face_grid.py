import cairo
import numpy as np
from dataclasses import dataclass
from typing import Tuple, Dict

from enum import Enum

from face import *

def draw_face_top_grid(context, face: Face, nx, nz, x_top_left_start, y_top_left_start, options: FaceDrawOptions):
    for iz in range(0,nz):
        x_offset = iz*face.x_translate
        y_top_left = y_top_left_start + iz*face.y_translate

        for ix in range(0,nx):
            x_top_left = x_offset + x_top_left_start + ix*face.box_dim

            draw_face_top(context,
                x_top_left=x_top_left, 
                y_top_left=y_top_left, 
                face=face,
                options=options
                )

def draw_face_left_grid(context, face: Face, ny, nz, x_top_left_start, y_top_left_start, options: FaceDrawOptions):
    for iz in range(0,nz):
        y_offset = iz*face.y_translate
        x_top_left = x_top_left_start + iz*face.x_translate

        for iy in range(0,ny):
            y_top_left = y_top_left_start + y_offset + iy*face.box_dim

            draw_face_left(context,
                x_top_left=x_top_left, 
                y_top_left=y_top_left, 
                face=face,
                options=options
                )

def draw_face_front_grid(context, face: Face, nx, ny, x_top_left_start, y_top_left_start, options: FaceDrawOptions):
    for ix in range(0,nx):
        x_top_left = x_top_left_start + ix*face.box_dim

        for iy in range(0,ny):
            y_top_left = y_top_left_start + iy*face.box_dim

            draw_face_front(context,
                x_top_left=x_top_left, 
                y_top_left=y_top_left, 
                face=face,
                options=options
                )