from PIL import Image, ImageDraw
def create_circular_image(source_path, output_path, size=(1000, 1000)):
    img = Image.open(source_path).convert("RGBA")
    img = img.resize(size)
    mask = Image.new('L', size, 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0) + size, fill=255)
    result = Image.new('RGBA', size)
    result.paste(img, mask=mask)
    result.save(output_path)
create_circular_image('logo.png', 'logo_circle.png')