import cairo
import numpy as np
from dataclasses import dataclass
from typing import Tuple, Dict

from enum import Enum

from cube_and_selection import *
import os
from PIL import Image

face = Face(
    x_translate=30,
    y_translate=20,
    box_dim=50
    )

cube = Cube(
    nx=3,
    ny=6,
    nz=6,
    x_top_left_start=100,
    y_top_left_start=100
    )

if not os.path.isdir("tmp"):
    os.makedirs("tmp")

fnames = []

ctr = 0

# creating a SVG surface
# here geek is file name & 700, 700 is dimension
fname = "tmp/svg_%03d.svg" % ctr
with cairo.SVGSurface(fname, 1200, 1200) as surface:

    # creating a cairo context object
    context = cairo.Context(surface)

    for z_idx in range(0,cube.nz):
        for y_idx in range(0,cube.ny):

            sel = Selection(
                y_idx=y_idx,
                z_idx=z_idx,
                sel_size=3
                )

            options_sel = FaceDrawOptions(
                    fill=True, 
                    stroke=False,
                    line_col=(0,0,0,1.0), 
                    fill_col_top=(0,0,0.85,1.0),
                    fill_col_left=(0,0,0.7,1.0),
                    fill_col_front=(0,0,1.0,1.0)
                    )

            options_grid = FaceDrawOptions(
                fill=False, 
                stroke=True, 
                line_col=(0,0,0,0.5)
                )

            draw_cube_and_selection(context,
                face=face,
                cube=cube,
                sel=sel,
                options_sel=options_sel,
                options_grid=options_grid
                )

            # Png
            # fname = "tmp/svg_%03d.png" % ctr
            # fnames.append(fname)
            # surface.write_to_png(fname)

            ctr += 1

        # printing message when file is saved
        print("File %s saved" % fname)

# https://pillow.readthedocs.io/en/stable/handbook/image-file-formats.html#gif
# print(fnames)
# img, *imgs = [Image.open(f) for f in fnames]
# img.save(fp="multiple.gif", format='GIF', append_images=imgs,
#         save_all=True, duration=150, loop=0, optimizer=True)