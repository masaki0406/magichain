from PIL import Image, ImageDraw, ImageFont
import os

# Map Dimensions (Square to match the aspect ratio used in CSS)
WIDTH = 1024
HEIGHT = 1024

# Map Data (Copied from src/data/map.ts)
nodes = [
    {"id": "san_francisco", "x": 8, "y": 48},
    {"id": "arkham", "x": 28, "y": 45},
    {"id": "buenos_aires", "x": 32, "y": 82},
    {"id": "london", "x": 48, "y": 38},
    {"id": "rome", "x": 57, "y": 48},
    {"id": "istanbul", "x": 60, "y": 38},
    {"id": "tokyo", "x": 92, "y": 48},
    {"id": "shanghai", "x": 82, "y": 52},
    {"id": "sydney", "x": 92, "y": 80},
    {"id": "amazon", "x": 22, "y": 65},
    {"id": "pyramids", "x": 55, "y": 58},
    {"id": "heart_of_africa", "x": 52, "y": 72},
    {"id": "antarctica", "x": 60, "y": 95},
    {"id": "himalayas", "x": 72, "y": 48},
    {"id": "tunguska", "x": 78, "y": 28},
    {"id": "1", "x": 12, "y": 68},
    {"id": "2", "x": 20, "y": 72},
    {"id": "3", "x": 36, "y": 35},
    {"id": "4", "x": 44, "y": 35},
    {"id": "5", "x": 36, "y": 46},
    {"id": "6", "x": 38, "y": 58},
    {"id": "7", "x": 48, "y": 52},
    {"id": "8", "x": 50, "y": 44},
    {"id": "9", "x": 30, "y": 52},
    {"id": "10", "x": 78, "y": 38},
    {"id": "11", "x": 70, "y": 32},
    {"id": "12", "x": 50, "y": 85},
    {"id": "13", "x": 52, "y": 78},
    {"id": "14", "x": 66, "y": 40},
    {"id": "15", "x": 68, "y": 58},
    {"id": "16", "x": 75, "y": 58},
    {"id": "17", "x": 82, "y": 62},
    {"id": "18", "x": 82, "y": 72},
    {"id": "19", "x": 88, "y": 40},
    {"id": "20", "x": 86, "y": 90},
    {"id": "21", "x": 96, "y": 62}
]

# Define categories
major_cities = ["san_francisco", "arkham", "buenos_aires", "london", "rome", "istanbul", "tokyo", "shanghai", "sydney"]
named_wilderness = ["amazon", "pyramids", "heart_of_africa", "antarctica", "himalayas", "tunguska"]
numbered_cities = ["1", "5", "6", "7", "14", "15", "16", "17", "20"]
numbered_wilderness = ["4", "9", "10", "19", "21"]
numbered_sea = ["2", "3", "8", "11", "12", "13", "18"]

# Create a black image
img = Image.new('RGB', (WIDTH, HEIGHT), color='black')
draw = ImageDraw.Draw(img)

# Draw nodes
for node in nodes:
    # Convert percentage to pixels
    px = int((node['x'] / 100) * WIDTH)
    py = int((node['y'] / 100) * HEIGHT)
    
    nid = node['id']
    
    if nid in major_cities:
        # Major City: Large Gold Circle
        radius = 15
        draw.ellipse((px - radius, py - radius, px + radius, py + radius), fill='#FFD700', outline='#FFD700')
    elif nid in named_wilderness:
        # Named Wilderness: Large Green Circle (to be distinct)
        radius = 15
        draw.ellipse((px - radius, py - radius, px + radius, py + radius), fill='#00FF00', outline='#00FF00')
    elif nid in numbered_cities:
        # Numbered City: Small White Circle
        radius = 8
        draw.ellipse((px - radius, py - radius, px + radius, py + radius), fill='white', outline='white')
    elif nid in numbered_wilderness:
        # Numbered Wilderness: Small Green Circle
        radius = 8
        draw.ellipse((px - radius, py - radius, px + radius, py + radius), fill='#90EE90', outline='#90EE90')
    elif nid in numbered_sea:
        # Numbered Sea: Small Blue Circle
        radius = 8
        draw.ellipse((px - radius, py - radius, px + radius, py + radius), fill='#00BFFF', outline='#00BFFF')
    else:
        # Fallback
        radius = 5
        draw.ellipse((px - radius, py - radius, px + radius, py + radius), fill='gray', outline='gray')

# Save the image
output_path = "reference_map_layout.png"
img.save(output_path)
print(f"Reference map generated at {output_path}")
