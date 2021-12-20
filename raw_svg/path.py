from dataclasses import dataclass
from typing import Tuple, List

@dataclass
class Path:
    pts : List[Tuple[int,int]]
    line_width : float
    fill : bool
    stroke : bool
    line_col : Tuple[float,float,float,float]
    fill_col : Tuple[float,float,float,float]
