from raw_svg import Face, Cube, draw_cube, FaceDrawOptions, Paths, create_svg

face = Face(
    x_translate=30,
    y_translate=20,
    box_dim=50
    )

cube = Cube(
    nx=3,
    ny_in=6,
    nz_in=6,
    ny_out=4,
    nz_out=4,
    x_top_left_start=100,
    y_top_left_start=100
    )

options_sel = FaceDrawOptions(
        fill=False, 
        stroke=False
        )

options_grid = FaceDrawOptions(
    fill=False, 
    stroke=False
    )

paths = Paths()
draw_cube(
    face=face, 
    cube=cube, 
    options_grid=options_grid, 
    options_sel=options_sel, 
    paths=paths
    )
print(paths.entries.keys())

svg = create_svg(paths, width=1200, height=1200)
with open('test_svg.svg','w') as f:
    f.write(svg)