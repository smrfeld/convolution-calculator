from typing import Dict, List, Union

from .face import *
from .path import *

def create_key(key_pre: str, ix: Union[int,None], iy: Union[int,None], iz: Union[int,None]) -> str:
    if ix != None and iy != None and iz != None:
        return '%s_%03d_%03d_%03d' % (key_pre, ix, iy, iz)
    elif ix == None:
        return '%s_%03d_%03d' % (key_pre, iy, iz)
    elif iy == None:
        return '%s_%03d_%03d' % (key_pre, ix, iz)
    elif iz == None:
        return '%s_%03d_%03d' % (key_pre, ix, iy)
    else:
        assert False

def draw_face_top_grid(
    face: Face,
    nx, 
    nz, 
    w_top_left_start, 
    h_top_left_start, 
    options: FaceDrawOptions, 
    paths: Paths, 
    key_pre: str, 
    key_iy: Union[int, None]
    ):

    for iz in range(0,nz):
        h_top_left = h_top_left_start + iz*face.h_translate

        for ix in range(0,nx):
            w_top_left = w_top_left_start + ix*face.box_dim + iz*face.w_translate

            path0 = draw_face_top(
                w_top_left=w_top_left, 
                h_top_left=h_top_left, 
                face=face,
                options=options
                )
            
            key = create_key('%s_top' % key_pre, ix, key_iy, iz)
            paths.add_path(key, path0)

def draw_face_left_grid(
    face: Face, 
    ny, 
    nz, 
    w_top_left_start, 
    h_top_left_start, 
    options: FaceDrawOptions, 
    paths: Paths, 
    key_pre: str,
    key_ix: Union[int, None]
    ):
    for iz in range(0,nz):
        w_top_left = w_top_left_start + iz*face.w_translate

        for iy in range(0,ny):
            h_top_left = h_top_left_start + iz*face.h_translate + iy*face.box_dim

            path0 = draw_face_left(
                w_top_left=w_top_left, 
                h_top_left=h_top_left, 
                face=face,
                options=options
                )

            key = create_key('%s_left' % key_pre, key_ix, iy, iz)
            paths.add_path(key, path0)

def draw_face_front_grid(
    face: Face, 
    nx, 
    ny, 
    w_top_left_start, 
    h_top_left_start, 
    options: FaceDrawOptions, 
    paths: Paths, 
    key_pre: str,
    key_iz: Union[int, None]
    ):
    for ix in range(0,nx):
        w_top_left = w_top_left_start + ix*face.box_dim

        for iy in range(0,ny):
            h_top_left = h_top_left_start + iy*face.box_dim

            path0 = draw_face_front(
                w_top_left=w_top_left, 
                h_top_left=h_top_left, 
                face=face,
                options=options
                )

            key = create_key('%s_front' % key_pre, ix, iy, key_iz)
            paths.add_path(key, path0)