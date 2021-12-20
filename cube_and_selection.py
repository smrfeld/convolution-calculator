import cairo
import numpy as np
from dataclasses import dataclass
from typing import Tuple, Dict

from enum import Enum

from face_grid import *
from cube import *

@dataclass
class Selection:
    y_idx: int
    z_idx: int
    sel_size: int

def draw_cube_and_selection_interior(context, face: Face, cube: Cube, sel: Selection, options_grid: FaceDrawOptions, options_sel: FaceDrawOptions):

    face_sel = Face(
        x_translate=sel.sel_size * face.x_translate,
        y_translate=sel.sel_size * face.y_translate,
        box_dim=sel.sel_size * face.box_dim
        )

    cube_sel = Cube(
        nx=1,
        ny=1,
        nz=1,
        x_top_left_start=cube.x_top_left_start + sel.z_idx * face.x_translate, 
        y_top_left_start=cube.y_top_left_start + sel.z_idx * face.y_translate + sel.y_idx * face.box_dim
        )

    draw_cube(context, 
        face=face_sel,
        cube=cube_sel,
        options=options_sel
        )

    draw_cube(context,
        face=face,
        cube=cube,
        options=options_grid
        )

def draw_cube_and_selection_top(context, face: Face, cube: Cube, sel: Selection, 
    options_grid: FaceDrawOptions,
    options_sel: FaceDrawOptions
    ):

    # Draw back-left grid part
    if sel.sel_size + sel.z_idx > 0:
        draw_face_left_grid(context,
            face=face,
            ny=cube.ny, 
            nz=sel.z_idx+sel.sel_size, 
            x_top_left_start=cube.x_top_left_start, 
            y_top_left_start=cube.y_top_left_start,
            options=options_grid
            )

        draw_face_top_grid(context, 
            face=face,
            nx=cube.nx, 
            nz=sel.z_idx+sel.sel_size, 
            x_top_left_start=cube.x_top_left_start,
            y_top_left_start=cube.y_top_left_start,
            options=options_grid
            )

    # Draw selection
    cube_sel = Cube(
        nx=cube.nx,
        ny=sel.sel_size,
        nz=sel.sel_size,
        x_top_left_start=cube.x_top_left_start + sel.z_idx*face.x_translate, 
        y_top_left_start=cube.y_top_left_start + sel.z_idx*face.y_translate + sel.y_idx*face.box_dim
        )
    draw_cube(context, 
        face=face, 
        cube=cube_sel,
        options=options_sel
        )

    # Draw front grid part
    cube_front = Cube(
        nx=cube.nx, 
        ny=cube.ny,
        nz=cube.nz - max(sel.sel_size+sel.z_idx,0),
        x_top_left_start=cube.x_top_left_start + max((sel.z_idx + sel.sel_size),0) * face.x_translate, 
        y_top_left_start=cube.y_top_left_start + max((sel.z_idx + sel.sel_size),0) * face.y_translate
        )
    draw_cube(context, 
        face=face,
        cube=cube_front,
        options=options_grid
        )

def draw_cube_and_selection_top_and_front(context, face: Face, cube: Cube, sel: Selection,
    options_grid: FaceDrawOptions,
    options_sel: FaceDrawOptions
    ):

    draw_cube(context, 
        face=face,
        cube=cube,
        options=options_grid
        )

    cube_sel = Cube(
        nx=cube.nx,
        ny=sel.sel_size,
        nz=sel.sel_size,
        x_top_left_start=cube.x_top_left_start + sel.z_idx*face.x_translate, 
        y_top_left_start=cube.y_top_left_start + sel.z_idx*face.y_translate + sel.y_idx*face.box_dim
        )
    draw_cube(context, 
        face=face, 
        cube=cube_sel,
        options=options_sel
        )

def draw_cube_and_selection_front(context, face: Face, cube: Cube, sel: Selection,
    options_grid: FaceDrawOptions,
    options_sel: FaceDrawOptions
    ):

    # Draw bottom grid part
    if cube.ny - sel.y_idx > 0:
        bottom_x_top_left_start = cube.x_top_left_start
        bottom_y_top_left_start = cube.y_top_left_start + max(sel.y_idx,0) * face.box_dim

        draw_face_left_grid(context,
            face=face,
            ny=cube.ny-sel.y_idx, 
            nz=cube.nz, 
            x_top_left_start=bottom_x_top_left_start, 
            y_top_left_start=bottom_y_top_left_start,
            options=options_grid
            )

        draw_face_front_grid(context, 
            face=face, 
            nx=cube.nx, 
            ny=cube.ny-sel.y_idx, 
            x_top_left_start=bottom_x_top_left_start + cube.nz * face.x_translate, 
            y_top_left_start=bottom_y_top_left_start + cube.nz * face.y_translate,
            options=options_grid
            )

    # Draw selection
    cube_sel = Cube(
        nx=cube.nx,
        ny=sel.sel_size,
        nz=sel.sel_size,
        x_top_left_start=cube.x_top_left_start + sel.z_idx*face.x_translate, 
        y_top_left_start=cube.y_top_left_start + sel.z_idx*face.y_translate + sel.y_idx*face.box_dim
        )
    draw_cube(context, 
        face=face,
        cube=cube_sel,
        options=options_sel
        )

    # Draw top grid part
    cube_top = Cube(
        nx=cube.nx, 
        ny=min(sel.y_idx, cube.ny),
        nz=cube.nz, 
        x_top_left_start=cube.x_top_left_start, 
        y_top_left_start=cube.y_top_left_start
        )
    draw_cube(context, 
        face=face, 
        cube=cube_top,
        options=options_grid
        )

def draw_cube_and_selection(context, 
    face: Face, 
    cube: Cube, 
    sel: Selection,
    options_grid: FaceDrawOptions,
    options_sel: FaceDrawOptions
    ):
    if sel.z_idx + sel.sel_size >= cube.nz:
        # Front
        if sel.y_idx <= 0:
            # Front and top
            print("front and top")
            draw_cube_and_selection_top_and_front(context, 
                face=face, 
                cube=cube, 
                sel=sel,
                options_grid=options_grid,
                options_sel=options_sel
                )
        else:
            # Just front
            print("front")
            draw_cube_and_selection_front(context,
                face=face, 
                cube=cube, 
                sel=sel,
                options_grid=options_grid,
                options_sel=options_sel
                )
    elif sel.y_idx < 0:
        # Just top
        print("top")
        draw_cube_and_selection_top(context,
            face=face, 
            cube=cube, 
            sel=sel,
            options_grid=options_grid,
            options_sel=options_sel
            )
    else:
        # Interior
        print("interior")
        draw_cube_and_selection_interior(context,
            face=face, 
            cube=cube, 
            sel=sel,
            options_grid=options_grid,
            options_sel=options_sel
            )
