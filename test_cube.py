from raw_svg import Face, Cube, draw_cube, FaceDrawOptions, Paths, create_svg

face = Face(
    w_translate=30,
    h_translate=20,
    box_dim=50
    )

cube = Cube(
    nx=3,
    ny_in=6,
    nz_in=6,
    ny_out=4,
    nz_out=4,
    w_top_left_start=100,
    h_top_left_start=100
    )

options_sel = FaceDrawOptions(
    fill=False, 
    stroke=False
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
print(paths.entries.keys())

svg = create_svg(paths, width=1200, height=1200)
with open('test_cube.svg','w') as f:
    f.write(svg)