from raw_svg import Face, Cube, draw_cube, FaceDrawOptions, create_svg, draw_cube_grid, Paths

def add_invisible_grid(cube: Cube, paths: Paths):
    options_grid0 = FaceDrawOptions(
        fill=True, 
        stroke=True,
        line_col=(1,0,0,1),
        fill_col_top=(0,0,0,0),
        fill_col_left=(0,0,0,0),
        fill_col_front=(0,0,0,0)
        )
    cube0 = Cube(
        nx=cube.nx,
        ny_in=cube.ny_in+cube.ny_out,
        nz_in=cube.nz_in+cube.nz_out,
        ny_out=0,
        nz_out=0,
        w_top_left_start=cube.w_top_left_start,
        h_top_left_start=cube.h_top_left_start
        )
    paths0 = Paths()
    draw_cube_grid(
        face=face, 
        cube=cube0, 
        options_grid=options_grid0,
        key_pre='grid0',
        paths=paths0
        )

    for key,val in paths0.entries.items():
        paths.entries[key] = val

face = Face(
    w_translate=30,
    h_translate=20,
    box_dim=50
    )

cube = Cube(
    nx=3,
    ny_in=6,
    nz_in=6,
    ny_out=0,
    nz_out=0,
    w_top_left_start=100,
    h_top_left_start=100
    )

options_sel = FaceDrawOptions(
    fill=True, 
    stroke=False,
    fill_col_top=(0,0,1,0),
    fill_col_left=(0,0,1,0),
    fill_col_front=(0,0,1,0)
    )

options_grid = FaceDrawOptions(
    fill=True, 
    stroke=True,
    line_col=(0,0,0,1),
    fill_col_top=(0,0,0,0),
    fill_col_left=(0,0,0,0),
    fill_col_front=(0,0,0,0)
    )

paths = draw_cube(
    face=face, 
    cube=cube, 
    options_grid=options_grid,
    options_sel=options_sel
    )

# Add invisible grid
# add_invisible_grid(cube, paths)

print(paths.entries.keys())

iy_top_left = 3
iz_top_left = 0
filter_size = 3
for iy in range(iy_top_left,iy_top_left+filter_size):
    for iz in range(iz_top_left,iz_top_left+filter_size):
        for ix in range(0,cube.nx):
            idxs = "%03d_%03d_%03d" % (ix,iy,iz)
            paths.entries["sel_front_%s" % idxs].fill_col = (0,0,1,1)
            paths.entries["sel_top_%s" % idxs].fill_col = (0,0,1,1)
            paths.entries["sel_left_%s" % idxs].fill_col = (0,0,1,1)

svg = create_svg(paths, width=1200, height=1200)
with open('test_grid_and_sel.svg','w') as f:
    f.write(svg)