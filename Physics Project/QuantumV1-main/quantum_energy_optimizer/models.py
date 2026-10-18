from dataclasses import dataclass
from typing import Literal

@dataclass
class PowerSource:
    name: str
    type: str
    capacity_kw: float

@dataclass
class Load:
    name: str
    demand_kw: float
    priority: Literal["Critical", "High", "Medium", "Low"]
