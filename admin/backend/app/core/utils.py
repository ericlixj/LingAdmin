from datetime import datetime
from collections import defaultdict

def try_parse_datetime(val: str):
    try:
        return datetime.fromisoformat(val.replace("Z", "+00:00"))
    except Exception:
        return val  # 如果不是合法日期，就原样返回

def parse_refine_filters(query_params: dict) -> list[dict]:
    from collections import defaultdict

    filters_grouped = defaultdict(dict)

    for key, value in query_params.items():
        if not key.startswith("filters["):
            continue
        # 拆分 key，例如 filters[0][value][1] -> ['filters', '0', 'value', '1']
        parts = key.replace("]", "").split("[")
        _, idx, *path = parts

        current = filters_grouped[idx]
        ref = current
        for p in path[:-1]:
            if p not in ref or not isinstance(ref[p], dict):
                ref[p] = {}
            ref = ref[p]
        ref[path[-1]] = value

    # 后处理：把 'value' 下的多层索引字典转为 list
    filters = []
    for f in filters_grouped.values():
        val = f.get("value")
        if isinstance(val, dict) and all(k.isdigit() for k in val.keys()):
            value = [try_parse_datetime(val[k]) for k in sorted(val.keys(), key=int)]
        else:
            value = try_parse_datetime(val)
        filters.append({
            "field": f.get("field"),
            "operator": f.get("operator"),
            "value": value,
        })

    return filters