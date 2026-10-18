from typing import List, Dict, Any
from quantum_energy_optimizer.models import PowerSource, Load

class SmartGrid:
    def __init__(self):
        self.sources: List[PowerSource] = []
        self.loads: List[Load] = []

    def add_source(self, source: PowerSource):
        if source.capacity_kw < 0:
            raise ValueError(f"Source capacity cannot be negative: {source.name}")
        self.sources.append(source)

    def add_load(self, load: Load):
        if load.demand_kw < 0:
            raise ValueError(f"Load demand cannot be negative: {load.name}")
        self.loads.append(load)
        
    def get_total_supply(self) -> float:
        return sum(source.capacity_kw for source in self.sources)
        
    def get_total_demand(self) -> float:
        return sum(load.demand_kw for load in self.loads)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "sources": [{"name": s.name, "type": s.type, "capacity_kw": s.capacity_kw} for s in self.sources],
            "loads": [{"name": l.name, "demand_kw": l.demand_kw, "priority": l.priority} for l in self.loads],
            "total_supply": self.get_total_supply(),
            "total_demand": self.get_total_demand()
        }
        
    def clear(self):
        self.sources = []
        self.loads = []
