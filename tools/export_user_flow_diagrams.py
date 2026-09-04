from __future__ import annotations

import html
import math
import re
from collections import defaultdict, deque
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "docs" / "流程导图" / "User Flow_V0.1"

FONT_REGULAR_CANDIDATES = [
    Path(r"C:\Windows\Fonts\msyh.ttc"),
    Path(r"C:\Windows\Fonts\simhei.ttf"),
    Path(r"C:\Windows\Fonts\segoeui.ttf"),
]
FONT_BOLD_CANDIDATES = [
    Path(r"C:\Windows\Fonts\msyhbd.ttc"),
    Path(r"C:\Windows\Fonts\simhei.ttf"),
    Path(r"C:\Windows\Fonts\seguisb.ttf"),
]


DIAGRAMS = [
    {
        "slug": "01_核心行为模型",
        "title": "核心行为模型",
        "status": "阶段确认图；“单条替换”后来由多信号当前轮次规则补充",
        "source": '''flowchart LR
    A["任一成员现实中喝水"] --> B["点击「我喝了」"]
    B --> C["生成当前喝水信号"]
    C --> D["向关系空间内其他成员<br/>展示一次轻提示"]
    D --> E{"成员自行决定"}
    E -->|"想跟"| F["喝水并点击「跟一口」"]
    E -->|"不想跟"| G["什么都不做"]
    F --> H["发起者得到轻反馈"]
    G --> I["不记录未跟随<br/>不提醒、不追问"]
    C --> J["直到被下一条<br/>「我喝了」信号替换"]''',
    },
    {
        "slug": "02_UF01_核心喝水闭环",
        "title": "UF-01 核心喝水闭环",
        "status": "已确认的基础闭环；分发范围后来由全局信号模型补充",
        "source": '''flowchart TB
    A1["发起者现实中喝水"] --> A2["调用产品的记录入口"]
    A2 --> A3["点击「我喝了」"]
    A3 --> D1{"是否为短时间重复点击？"}

    D1 -->|"是"| A4["合并记录<br/>不重复提示其他成员"]
    D1 -->|"否"| S1["创建新的喝水信号"]
    S1 --> S2["将它设为关系空间的当前信号"]
    S2 --> S3["让其他未屏蔽该成员的人<br/>感知一次轻提示"]
    S2 --> A5["发起者得到记录成功反馈"]

    S3 --> B1{"接收者想不想跟？"}
    B1 -->|"不想跟"| B2["流程安静结束<br/>不留下未完成状态"]
    B1 -->|"想跟"| B3["接收者喝水并点击「跟一口」"]
    B3 --> S4["系统创建 Follow Response"]
    S4 --> B4["接收者得到跟随成功反馈"]
    S4 --> A6["发起者知道有人跟上了"]

    A6 --> E["本次跟随结束<br/>不产生新的喝水信号"]''',
    },
    {
        "slug": "03_UF02_创建与加入关系",
        "title": "UF-02 创建与加入关系",
        "status": "已确认基础路径；成员扩展权限见第 05 张图",
        "source": '''flowchart TB
    START["用户第一次进入产品"] --> INVITE{"是否通过邀请进入？"}

    INVITE -->|"否"| A1["创建个人身份"]
    A1 --> A2["创建一个关系空间"]
    A2 --> A3["系统生成邀请码或邀请链接"]
    A3 --> A4["用户分享给情侣、朋友或室友"]
    A4 --> A5["等待成员加入"]

    INVITE -->|"是"| B1{"是否已有个人身份？"}
    B1 -->|"没有"| B2["创建个人身份"]
    B1 -->|"已有"| B3["读取邀请信息"]
    B2 --> B3
    B3 --> B4["了解是谁邀请、将加入什么关系"]
    B4 --> B5["确认加入"]

    B5 --> C1["关系建立成功"]
    C1 --> C2["双方或小组成员知道新成员已加入"]
    C2 --> C3["进入日常喝水状态"]

    A5 --> C1''',
    },
    {
        "slug": "04_全局喝水信号分发",
        "title": "全局喝水信号分发",
        "status": "已确认；一次“我喝了”跨有效关系分发，回应保留成员与关系来源",
        "source": '''flowchart TB
    A["用户点击「我喝了」"] --> B["创建一条全局喝水信号"]
    B --> C["读取用户加入的全部关系空间"]
    C --> D["应用不发送的关系 / 成员设置"]
    D --> E["生成实际接收成员集合"]
    E --> F["向这些成员传递一次轻提示"]

    F --> G{"成员是否跟一口？"}
    G -->|"不跟"| H["安静结束"]
    G -->|"跟一口"| I["创建 Follow Response"]

    I --> J["记录跟随者身份"]
    I --> K["记录跟随者所属关系"]
    J --> L["发起者获得轻反馈"]
    K --> L''',
    },
    {
        "slug": "05_UF02_新增成员共同许可",
        "title": "UF-02 新增成员共同许可",
        "status": "已确认；不存在群主，所有现有成员同意后候选人再确认加入",
        "source": '''flowchart TB
    A["A 与 B 已组成平等关系"] --> B["B 希望 C 加入"]
    B --> C["B 提出新增成员请求"]
    C --> D["系统询问现有成员是否同意"]
    D --> E{"现有成员是否全部同意？"}

    E -->|"是"| F["B 获得邀请 C 的权限"]
    F --> G["B 向 C 发送邀请"]
    G --> H{"C 是否愿意加入？"}
    H -->|"是"| I["C 成为关系中的平等成员"]
    H -->|"否"| J["关系保持 A、B 不变"]

    E -->|"否"| K["C 不进入现有关系"]
    K --> L["B 仍可另外创建 B–C 关系"]''',
    },
    {
        "slug": "06_UF03_日常返回产品",
        "title": "UF-03 日常返回产品",
        "status": "讨论草稿；“待确定的当前信号规则”由第 07、08 张图补全",
        "source": '''flowchart TB
    A["用户再次进入产品"] --> B{"是否已有关系？"}

    B -->|"没有"| C["进入创建 / 加入关系流程"]
    B -->|"有"| D["系统读取与用户有关的喝水信号<br/>以及别人返回的跟随反馈"]

    D --> E{"是否存在相关信号？"}

    E -->|"没有"| F["保持平静状态"]
    F --> G["用户可以主动点击「我喝了」"]

    E -->|"存在"| H["按照待确定的规则<br/>确定用户当前感知的信号"]

    H --> I{"当前信号是谁发出的？"}

    I -->|"其他成员"| J{"用户是否已经跟过？"}
    J -->|"没有"| K["可以选择「跟一口」或不处理"]
    J -->|"已经跟过"| L["显示已经回应的状态"]

    I -->|"用户自己"| M["查看有哪些成员跟上了"]

    K -->|"跟一口"| N["创建 Follow Response"]
    K -->|"不处理"| O["安静结束"]

    L --> P["仍可随时点击新的「我喝了」"]
    M --> P
    N --> P
    O --> P''',
    },
    {
        "slug": "07_UF03_多信号汇总",
        "title": "UF-03 多信号汇总为当前轮次",
        "status": "已确认；最新信号突出，其他来源保留，不形成未读任务",
        "source": '''flowchart TB
    A["A 发出「我喝了」"] --> W["当前喝水轮次"]
    C["C 发出「我喝了」"] --> W
    D["D 发出「我喝了」"] --> W

    W --> P["突出最新的 D"]
    W --> S["保留 A、C 的轻量来源信息"]

    P --> F{"用户是否想跟？"}
    S --> F

    F -->|"想跟"| R["现实中喝水并点击一次「跟一口」"]
    R --> X["本轮 A、C、D 都得到轻回应"]

    F -->|"不想跟"| N["什么都不发生<br/>不形成未读或待办"]''',
    },
    {
        "slug": "08_UF03_选择性回应",
        "title": "UF-03 当前轮次的选择性回应",
        "status": "已确认；默认回应全部，次级入口可只回应部分成员",
        "source": '''flowchart TB
    W["当前一轮：A、C、D 都喝过"] --> D{"用户如何回应？"}

    D -->|"直接跟一口"| ALL["默认回应 A、C、D"]
    D -->|"进入选择模式"| SELECT["默认选中 A、C、D"]
    SELECT --> CHANGE["用户取消选择 C"]
    CHANGE --> PART["只回应 A、D"]
    D -->|"不处理"| NONE["不回应任何人"]

    ALL --> END["本轮对用户结束"]
    PART --> END
    NONE --> QUIET["保持安静"]''',
    },
]


@dataclass
class Node:
    ident: str
    text: str
    shape: str = "rect"
    width: float = 190
    height: float = 64
    x: float = 0
    y: float = 0
    lines: list[str] | None = None


@dataclass
class Edge:
    source: str
    target: str
    label: str = ""


def find_font(candidates: list[Path]) -> Path:
    for path in candidates:
        if path.exists():
            return path
    raise FileNotFoundError("No suitable font found")


FONT_REGULAR = find_font(FONT_REGULAR_CANDIDATES)
FONT_BOLD = find_font(FONT_BOLD_CANDIDATES)


def pil_font(size: int, bold: bool = False):
    return ImageFont.truetype(str(FONT_BOLD if bold else FONT_REGULAR), size)


def parse_node(expr: str, nodes: dict[str, Node]) -> str:
    expr = expr.strip()
    decision = re.match(r'^([A-Za-z0-9_]+)\{"(.*)"\}$', expr)
    rectangle = re.match(r'^([A-Za-z0-9_]+)\["(.*)"\]$', expr)
    bare = re.match(r'^([A-Za-z0-9_]+)$', expr)
    if decision:
        ident, text = decision.groups()
        nodes[ident] = Node(ident, text.replace("<br/>", "\n"), "diamond")
        return ident
    if rectangle:
        ident, text = rectangle.groups()
        nodes[ident] = Node(ident, text.replace("<br/>", "\n"), "rect")
        return ident
    if bare:
        ident = bare.group(1)
        nodes.setdefault(ident, Node(ident, ident))
        return ident
    raise ValueError(f"Unsupported Mermaid node expression: {expr}")


def parse_mermaid(source: str):
    lines = [line.rstrip() for line in source.strip().splitlines()]
    header = lines.pop(0).strip().split()
    direction = header[1]
    nodes: dict[str, Node] = {}
    edges: list[Edge] = []
    edge_re = re.compile(r'^\s*(.+?)\s*-->\s*(?:\|"(.*?)"\|\s*)?(.+?)\s*$')
    for line in lines:
        if not line.strip():
            continue
        match = edge_re.match(line)
        if not match:
            continue
        left, label, right = match.groups()
        source_id = parse_node(left, nodes)
        target_id = parse_node(right, nodes)
        edges.append(Edge(source_id, target_id, label or ""))
    return direction, nodes, edges


def measure_text(text: str, font, max_width: int):
    draw = ImageDraw.Draw(Image.new("RGB", (8, 8), "white"))
    all_lines: list[str] = []
    for paragraph in text.split("\n"):
        current = ""
        for char in paragraph:
            trial = current + char
            width = draw.textbbox((0, 0), trial, font=font)[2]
            if current and width > max_width:
                all_lines.append(current)
                current = char
            else:
                current = trial
        all_lines.append(current or " ")
    widths = [draw.textbbox((0, 0), line, font=font)[2] for line in all_lines]
    bbox = draw.textbbox((0, 0), "国Ag", font=font)
    line_height = bbox[3] - bbox[1] + 8
    return all_lines, max(widths, default=0), line_height * len(all_lines)


def prepare_node_sizes(nodes: dict[str, Node], direction: str):
    font = pil_font(18)
    max_text_width = 225 if direction == "TB" else 170
    for node in nodes.values():
        lines, text_width, text_height = measure_text(node.text, font, max_text_width)
        node.lines = lines
        if node.shape == "diamond":
            node.width = max(205, text_width + 100)
            node.height = max(116, text_height + 64)
        else:
            node.width = max(165, text_width + 48)
            node.height = max(64, text_height + 32)


def compute_ranks(nodes: dict[str, Node], edges: list[Edge]):
    incoming = {key: 0 for key in nodes}
    outgoing: dict[str, list[str]] = defaultdict(list)
    for edge in edges:
        incoming[edge.target] += 1
        outgoing[edge.source].append(edge.target)
    queue = deque(key for key in nodes if incoming[key] == 0)
    ranks = {key: 0 for key in nodes}
    visited = []
    while queue:
        current = queue.popleft()
        visited.append(current)
        for target in outgoing[current]:
            ranks[target] = max(ranks[target], ranks[current] + 1)
            incoming[target] -= 1
            if incoming[target] == 0:
                queue.append(target)
    if len(visited) != len(nodes):
        raise ValueError("Only acyclic flowcharts are supported")
    return ranks


def layout_graph(direction: str, nodes: dict[str, Node], edges: list[Edge]):
    prepare_node_sizes(nodes, direction)
    ranks = compute_ranks(nodes, edges)
    groups: dict[int, list[Node]] = defaultdict(list)
    for ident, node in nodes.items():
        groups[ranks[ident]].append(node)

    title_space = 150
    outer = 70
    if direction == "TB":
        horizontal_gap = 52
        vertical_gap = 105
        group_widths = {
            rank: sum(node.width for node in group) + horizontal_gap * max(0, len(group) - 1)
            for rank, group in groups.items()
        }
        canvas_width = max(980, max(group_widths.values(), default=0) + outer * 2)
        y = title_space
        for rank in sorted(groups):
            group = groups[rank]
            row_height = max(node.height for node in group)
            x = (canvas_width - group_widths[rank]) / 2
            for node in group:
                node.x = x + node.width / 2
                node.y = y + row_height / 2
                x += node.width + horizontal_gap
            y += row_height + vertical_gap
        canvas_height = y - vertical_gap + outer
    else:
        horizontal_gap = 82
        vertical_gap = 40
        group_heights = {
            rank: sum(node.height for node in group) + vertical_gap * max(0, len(group) - 1)
            for rank, group in groups.items()
        }
        canvas_height = max(620, title_space + max(group_heights.values(), default=0) + outer)
        x = outer
        for rank in sorted(groups):
            group = groups[rank]
            column_width = max(node.width for node in group)
            y = title_space + (canvas_height - title_space - outer - group_heights[rank]) / 2
            for node in group:
                node.x = x + column_width / 2
                node.y = y + node.height / 2
                y += node.height + vertical_gap
            x += column_width + horizontal_gap
        canvas_width = x - horizontal_gap + outer
    return int(math.ceil(canvas_width)), int(math.ceil(canvas_height))


def edge_points(direction: str, source: Node, target: Node):
    if direction == "TB":
        start = (source.x, source.y + source.height / 2)
        end = (target.x, target.y - target.height / 2)
        middle = (start[1] + end[1]) / 2
        return [start, (start[0], middle), (end[0], middle), end]
    start = (source.x + source.width / 2, source.y)
    end = (target.x - target.width / 2, target.y)
    middle = (start[0] + end[0]) / 2
    return [start, (middle, start[1]), (middle, end[1]), end]


def svg_path(points):
    return "M " + " L ".join(f"{x:.1f} {y:.1f}" for x, y in points)


def render_svg(title: str, status: str, direction: str, nodes: dict[str, Node], edges: list[Edge], size):
    width, height = size
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-label="{html.escape(title)}">',
        '<defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#6C7C82"/></marker><filter id="shadow" x="-15%" y="-15%" width="130%" height="140%"><feDropShadow dx="0" dy="5" stdDeviation="7" flood-color="#173F3B" flood-opacity="0.08"/></filter></defs>',
        '<rect width="100%" height="100%" fill="#F8FAF7"/>',
        f'<text x="{width/2:.1f}" y="54" text-anchor="middle" font-family="Microsoft YaHei, Segoe UI, sans-serif" font-size="28" font-weight="700" fill="#1B2A30">{html.escape(title)}</text>',
        f'<text x="{width/2:.1f}" y="88" text-anchor="middle" font-family="Microsoft YaHei, Segoe UI, sans-serif" font-size="14" fill="#68767C">{html.escape(status)}</text>',
    ]
    for edge in edges:
        points = edge_points(direction, nodes[edge.source], nodes[edge.target])
        parts.append(f'<path d="{svg_path(points)}" fill="none" stroke="#6C7C82" stroke-width="2" stroke-linejoin="round" marker-end="url(#arrow)"/>')
        if edge.label:
            p1, p2 = points[1], points[2]
            lx, ly = (p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2
            label_width = max(48, len(edge.label) * 17 + 18)
            parts.append(f'<rect x="{lx-label_width/2:.1f}" y="{ly-15:.1f}" width="{label_width}" height="30" rx="10" fill="#F8FAF7" stroke="#D4DFDC"/>')
            parts.append(f'<text x="{lx:.1f}" y="{ly+6:.1f}" text-anchor="middle" font-family="Microsoft YaHei, Segoe UI, sans-serif" font-size="15" fill="#4F6066">{html.escape(edge.label)}</text>')

    for node in nodes.values():
        if node.shape == "diamond":
            pts = [
                (node.x, node.y - node.height / 2),
                (node.x + node.width / 2, node.y),
                (node.x, node.y + node.height / 2),
                (node.x - node.width / 2, node.y),
            ]
            point_string = " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)
            parts.append(f'<polygon points="{point_string}" fill="#EAF4F2" stroke="#5F9E98" stroke-width="2" filter="url(#shadow)"/>')
        else:
            parts.append(f'<rect x="{node.x-node.width/2:.1f}" y="{node.y-node.height/2:.1f}" width="{node.width:.1f}" height="{node.height:.1f}" rx="18" fill="#FFFFFF" stroke="#BFD1CD" stroke-width="2" filter="url(#shadow)"/>')
        lines = node.lines or [node.text]
        line_height = 27
        start_y = node.y - (len(lines) - 1) * line_height / 2 + 6
        for idx, line in enumerate(lines):
            parts.append(f'<text x="{node.x:.1f}" y="{start_y+idx*line_height:.1f}" text-anchor="middle" font-family="Microsoft YaHei, Segoe UI, sans-serif" font-size="18" fill="#1B2A30">{html.escape(line)}</text>')
    parts.append('</svg>')
    return "\n".join(parts)


def scaled_points(points, scale):
    return [(round(x * scale), round(y * scale)) for x, y in points]


def draw_arrow(draw, points, scale, color):
    pts = scaled_points(points, scale)
    draw.line(pts, fill=color, width=4 * scale, joint="curve")
    (x1, y1), (x2, y2) = pts[-2], pts[-1]
    angle = math.atan2(y2 - y1, x2 - x1)
    length = 12 * scale
    spread = 0.55
    arrow = [
        (x2, y2),
        (x2 - length * math.cos(angle - spread), y2 - length * math.sin(angle - spread)),
        (x2 - length * math.cos(angle + spread), y2 - length * math.sin(angle + spread)),
    ]
    draw.polygon(arrow, fill=color)


def rounded_polygon(draw, points, fill, outline, width):
    draw.polygon(points, fill=fill)
    draw.line(points + [points[0]], fill=outline, width=width, joint="curve")


def render_png(title: str, status: str, direction: str, nodes: dict[str, Node], edges: list[Edge], size, output: Path):
    scale = 2
    width, height = size
    image = Image.new("RGB", (width * scale, height * scale), "#F8FAF7")
    draw = ImageDraw.Draw(image)
    title_font = pil_font(28 * scale, bold=True)
    status_font = pil_font(14 * scale)
    node_font = pil_font(18 * scale)
    edge_font = pil_font(15 * scale)
    draw.text((width * scale / 2, 50 * scale), title, font=title_font, fill="#1B2A30", anchor="mm")
    draw.text((width * scale / 2, 86 * scale), status, font=status_font, fill="#68767C", anchor="mm")

    for edge in edges:
        points = edge_points(direction, nodes[edge.source], nodes[edge.target])
        draw_arrow(draw, points, scale, "#6C7C82")
        if edge.label:
            p1, p2 = points[1], points[2]
            lx, ly = (p1[0] + p2[0]) / 2 * scale, (p1[1] + p2[1]) / 2 * scale
            bbox = draw.textbbox((0, 0), edge.label, font=edge_font)
            bw = bbox[2] - bbox[0] + 24 * scale
            bh = 30 * scale
            draw.rounded_rectangle((lx - bw / 2, ly - bh / 2, lx + bw / 2, ly + bh / 2), radius=10 * scale, fill="#F8FAF7", outline="#D4DFDC", width=2 * scale)
            draw.text((lx, ly), edge.label, font=edge_font, fill="#4F6066", anchor="mm")

    for node in nodes.values():
        cx, cy = node.x * scale, node.y * scale
        nw, nh = node.width * scale, node.height * scale
        if node.shape == "diamond":
            pts = [(cx, cy - nh / 2), (cx + nw / 2, cy), (cx, cy + nh / 2), (cx - nw / 2, cy)]
            rounded_polygon(draw, pts, "#EAF4F2", "#5F9E98", 2 * scale)
        else:
            draw.rounded_rectangle((cx - nw / 2, cy - nh / 2, cx + nw / 2, cy + nh / 2), radius=18 * scale, fill="#FFFFFF", outline="#BFD1CD", width=2 * scale)
        lines = node.lines or [node.text]
        line_height = 27 * scale
        y = cy - (len(lines) - 1) * line_height / 2
        for line in lines:
            draw.text((cx, y), line, font=node_font, fill="#1B2A30", anchor="mm")
            y += line_height
    image.save(output, quality=95)


def write_index():
    rows = []
    for index, diagram in enumerate(DIAGRAMS, 1):
        rows.append(f"| {index:02d} | {diagram['title']} | {diagram['status']} | `{diagram['slug']}.png` / `.svg` / `.mmd` |")
    content = """# 跟一口 · User Flow 流程导图索引

本文件夹保存了截至 User Flow V0.1 阶段，讨论中实际出现过的全部 8 张 Mermaid 流程图。

- `.png`：方便直接查看、放入汇报或作品集草稿。
- `.svg`：矢量版本，适合继续排版或导入设计工具。
- `.mmd`：原始 Mermaid 源码，完整保留当时讨论内容。

部分图是形成最终决策之前的过程稿。应以 `跟一口_User Flow_V0.1.docx` 的文字规则作为当前版本依据，不要单独用历史图替代最终流程说明。

| 编号 | 图名 | 当前状态 | 文件 |
|---:|---|---|---|
""" + "\n".join(rows) + "\n"
    (OUTPUT_DIR / "README_导图索引.md").write_text(content, encoding="utf-8")


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for diagram in DIAGRAMS:
        source = diagram["source"].strip() + "\n"
        (OUTPUT_DIR / f"{diagram['slug']}.mmd").write_text(source, encoding="utf-8")
        direction, nodes, edges = parse_mermaid(source)
        size = layout_graph(direction, nodes, edges)
        svg = render_svg(diagram["title"], diagram["status"], direction, nodes, edges, size)
        (OUTPUT_DIR / f"{diagram['slug']}.svg").write_text(svg, encoding="utf-8")
        render_png(diagram["title"], diagram["status"], direction, nodes, edges, size, OUTPUT_DIR / f"{diagram['slug']}.png")
    write_index()
    print(f"Exported {len(DIAGRAMS)} diagrams to {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
