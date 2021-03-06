from dataclasses import dataclass
from typing import List, Dict

from .face_grid import *
from .cube import *
from .path import *

@dataclass
class SelectionGoal:
    y_idx_top_left: int
    z_idx_top_left: int
    sel_size: int

@dataclass
class Selection0:
    ids : List[str] = []

    def add_id(self, id0: str):
        if not id0 in self.ids:
            self.ids.append(id0)

    # def add_selection(self, goal: SelectionGoal, cube_show: CubeShow):
        

@dataclass
class CubeShow:
    nx: int
    ny: int
    nz: int
    y_idx_top_left: int
    z_idx_top_left: int

def get_paths_to_draw_interior(
    cube_show: CubeShow,
    sel_goal: SelectionGoal,
    sel0: Selection0
    ):

    # Selection first
    for ix in range(0,cube_show.nx):
        for iy in range(0,cube_show.nx):

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


    draw_cube( 
        face=face_sel,
        cube=cube_sel,
        options=options_sel,
        paths=paths
        )

    ids_to_paths['cube'] += draw_cube(
        face=face,
        cube=cube,
        options=options_grid
        )

    return ids_to_paths

def draw_cube_and_selection_top(
    face: Face, 
    cube: Cube, 
    sel: Selection, 
    options_grid: FaceDrawOptions,
    options_sel: FaceDrawOptions
    ) -> Dict[str,List[Path]]:

    ids_to_paths = {'sel': [], 'cube': []}

    # Draw back-left grid part
    if sel.sel_size + sel.z_idx > 0:
        ids_to_paths['cube'] += draw_face_left_grid(
            face=face,
            ny=cube.ny, 
            nz=sel.z_idx+sel.sel_size, 
            x_top_left_start=cube.x_top_left_start, 
            y_top_left_start=cube.y_top_left_start,
            options=options_grid
            )

        ids_to_paths['cube'] += draw_face_top_grid( 
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
    ids_to_paths['sel'] += draw_cube( 
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
    ids_to_paths['cube'] += draw_cube( 
        face=face,
        cube=cube_front,
        options=options_grid
        )

    return ids_to_paths

def draw_cube_and_selection_top_and_front(
    face: Face, 
    cube: Cube, 
    sel: Selection,
    options_grid: FaceDrawOptions,
    options_sel: FaceDrawOptions
    ) -> Dict[str,List[Path]]:

    ids_to_paths = {'sel': [], 'cube': []}

    ids_to_paths['cube'] += draw_cube( 
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
    ids_to_paths['sel'] += draw_cube( 
        face=face, 
        cube=cube_sel,
        options=options_sel
        )

    return ids_to_paths

def draw_cube_and_selection_front(
    face: Face, 
    cube: Cube, 
    sel: Selection,
    options_grid: FaceDrawOptions,
    options_sel: FaceDrawOptions
    ) -> Dict[str,List[Path]]:

    ids_to_paths = {'sel': [], 'cube': []}

    # Draw bottom grid part
    if cube.ny - sel.y_idx > 0:
        bottom_x_top_left_start = cube.x_top_left_start
        bottom_y_top_left_start = cube.y_top_left_start + max(sel.y_idx,0) * face.box_dim

        ids_to_paths['cube'] += draw_face_left_grid(
            face=face,
            ny=cube.ny-sel.y_idx, 
            nz=cube.nz, 
            x_top_left_start=bottom_x_top_left_start, 
            y_top_left_start=bottom_y_top_left_start,
            options=options_grid
            )

        ids_to_paths['cube'] += draw_face_front_grid( 
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
    ids_to_paths['sel'] += draw_cube( 
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
    ids_to_paths['cube'] += draw_cube( 
        face=face, 
        cube=cube_top,
        options=options_grid
        )

    return ids_to_paths

def draw_cube_and_selection( 
    face: Face, 
    cube: Cube, 
    sel: Selection,
    options_grid: FaceDrawOptions,
    options_sel: FaceDrawOptions
    ) -> Dict[str,List[Path]]:

    if sel.z_idx + sel.sel_size >= cube.nz:
        # Front
        if sel.y_idx <= 0:
            # Front and top
            print("front and top")
            return draw_cube_and_selection_top_and_front( 
                face=face, 
                cube=cube, 
                sel=sel,
                options_grid=options_grid,
                options_sel=options_sel
                )
        else:
            # Just front
            print("front")
            return draw_cube_and_selection_front(
                face=face, 
                cube=cube, 
                sel=sel,
                options_grid=options_grid,
                options_sel=options_sel
                )
    elif sel.y_idx < 0:
        # Just top
        print("top")
        return draw_cube_and_selection_top(
            face=face, 
            cube=cube, 
            sel=sel,
            options_grid=options_grid,
            options_sel=options_sel
            )
    else:
        # Interior
        print("interior")
        return draw_cube_and_selection_interior(
            face=face, 
            cube=cube, 
            sel=sel,
            options_grid=options_grid,
            options_sel=options_sel
            )
