import requests
from bs4 import BeautifulSoup


def print_secret_message(url):
    html = requests.get(url)
    html.raise_for_status()

    soup = BeautifulSoup(html.text, "html.parser")

    # Extract every non-empty line
    lines = [line.strip() for line in soup.get_text("\n").splitlines() if line.strip()]

    # Find where the table starts
    start = lines.index("x-coordinate")

    # Skip the three headers:
    # x-coordinate
    # Character
    # y-coordinate
    data = lines[start + 3:]

    entries = []

    # Read x, character, y in groups of three
    for i in range(0, len(data), 3):
        try:
            x = int(data[i])
            ch = data[i + 1]
            y = int(data[i + 2])
            entries.append((x, y, ch))
        except:
            break

    max_x = max(x for x, _, _ in entries)
    max_y = max(y for _, y, _ in entries)

    grid = [[" " for _ in range(max_x + 1)] for _ in range(max_y + 1)]

    for x, y, ch in entries:
        # Google docs use bottom-left origin
        grid[max_y - y][x] = ch

    for row in grid:
        print("".join(row))


print_secret_message(
    "https://docs.google.com/document/d/e/2PACX-1vSvM5gDlNvt7npYHhp_XfsJvuntUhq184By5xO_pA4b_gCWeXb6dM6ZxwN8rE6S4ghUsCj2VKR21oEP/pub"
)