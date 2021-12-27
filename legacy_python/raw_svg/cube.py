from dataclasses import dataclass
from typing import List

from .face_grid import *
from .path import *

@dataclass
class Cube:
    nx: int
    ny_in: int
    ny_out: int
    nz_in: int
    nz_out: int
    w_top_left_start: int
    h_top_left_start: int

def draw_cube_grid(face: Face, cube: Cube, options_grid: FaceDrawOptions, paths: Paths, key_pre : str = 'grid'):
    iy_start = cube.ny_out
    iz_start = cube.nz_out
    w_top_left_start_in = cube.w_top_left_start + iz_start*face.w_translate
    h_top_left_start_in = cube.h_top_left_start + iy_start*face.box_dim + iz_start*face.h_translate

    draw_face_top_grid(
        face=face,
        nx=cube.nx, 
        nz=cube.nz_in, 
        w_top_left_start=w_top_left_start_in, 
        h_top_left_start=h_top_left_start_in,
        options=options_grid,
        paths=paths,
        key_pre=key_pre,
        key_iy=None
        )

    draw_face_left_grid(
        face=face,
        ny=cube.ny_in, 
        nz=cube.nz_in, 
        w_top_left_start=w_top_left_start_in, 
        h_top_left_start=h_top_left_start_in,
        options=options_grid,
        paths=paths,
        key_pre=key_pre,
        key_ix=None
        )

    draw_face_front_grid( 
        face=face,
        nx=cube.nx, 
        ny=cube.ny_in, 
        w_top_left_start=w_top_left_start_in + cube.nz_in * face.w_translate, 
        h_top_left_start=h_top_left_start_in + cube.nz_in * face.h_translate,
        options=options_grid,
        paths=paths,
        key_pre=key_pre,
        key_iz=None
        )
    
def draw_cube_sel(face: Face, cube: Cube, options_sel: FaceDrawOptions, paths: Paths):

    # Draw all possible selections
    for ix in range(0,cube.nx):
        draw_face_left_grid(
            face=face,
            ny=cube.ny_in + 2*cube.ny_out, 
            nz=cube.nz_in + 2*cube.nz_out, 
            w_top_left_start=cube.w_top_left_start + ix*face.box_dim,
            h_top_left_start=cube.h_top_left_start,
            options=options_sel,
            paths=paths,
            key_pre='sel',
            key_ix=ix
            )

    for iy in range(0,cube.ny_in+2*cube.ny_out):
        draw_face_top_grid(
            face=face,
            nx=cube.nx, 
            nz=cube.nz_in + 2*cube.nz_out,
            w_top_left_start=cube.w_top_left_start, 
            h_top_left_start=cube.h_top_left_start + iy*face.box_dim,
            options=options_sel,
            paths=paths,
            key_pre='sel',
            key_iy=iy
            )

    for iz in range(0,cube.nz_in+2*cube.nz_out):
        draw_face_front_grid( 
            face=face, 
            nx=cube.nx, 
            ny=cube.ny_in + 2*cube.ny_out, 
            w_top_left_start=cube.w_top_left_start + (1+iz) * face.w_translate, 
            h_top_left_start=cube.h_top_left_start + (1+iz) * face.h_translate,
            options=options_sel,
            paths=paths,
            key_pre='sel',
            key_iz=iz
            )

def draw_cube(face: Face, cube: Cube, options_grid: FaceDrawOptions, options_sel: FaceDrawOptions) -> Paths:
    paths = Paths()
    draw_cube_grid(face, cube, options_grid, paths)
    draw_cube_sel(face, cube, options_sel, paths)
    return paths