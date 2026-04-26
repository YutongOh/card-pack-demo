from collections import deque
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "foil-booster-pack.png"
TARGET = ROOT / "assets" / "foil-booster-pack-transparent.png"


def is_background(rgb):
    r, g, b = rgb[:3]
    return min(r, g, b) > 232 and (max(r, g, b) - min(r, g, b)) < 34


def is_soft_edge(rgb):
    r, g, b = rgb[:3]
    return min(r, g, b) > 214 and (max(r, g, b) - min(r, g, b)) < 52


def main():
    image = Image.open(SOURCE).convert("RGBA")
    width, height = image.size
    pixels = image.load()
    mask = bytearray(width * height)
    queue = deque()

    def push(x, y):
        idx = y * width + x
        if mask[idx]:
            return
        if is_background(pixels[x, y]):
            mask[idx] = 1
            queue.append((x, y))

    for x in range(width):
        push(x, 0)
        push(x, height - 1)
    for y in range(height):
        push(0, y)
        push(width - 1, y)

    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < width and 0 <= ny < height:
                push(nx, ny)

    # Pull in the pale antialias fringe directly touching the white background.
    for _ in range(2):
        additions = []
        for y in range(height):
            for x in range(width):
                idx = y * width + x
                if mask[idx] or not is_soft_edge(pixels[x, y]):
                    continue
                touches_bg = False
                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if 0 <= nx < width and 0 <= ny < height and mask[ny * width + nx]:
                        touches_bg = True
                        break
                if touches_bg:
                    additions.append(idx)
        for idx in additions:
            mask[idx] = 1

    output = image.copy()
    out = output.load()
    transparent_count = 0
    for y in range(height):
        for x in range(width):
            if mask[y * width + x]:
                r, g, b, _ = out[x, y]
                out[x, y] = (r, g, b, 0)
                transparent_count += 1

    output.save(TARGET)
    print(f"saved={TARGET}")
    print(f"size={width}x{height}")
    print(f"transparent_pixels={transparent_count}")


if __name__ == "__main__":
    main()
