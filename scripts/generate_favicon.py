from PIL import Image
import sys
import os

def generate_favicons(input_path):
    try:
        img = Image.open(input_path)
        
        # Save as ICO (includes multiple sizes for best compatibility)
        # 16x16, 32x32, 48x48, 64x64
        icon_sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
        img.save("favicon.ico", sizes=icon_sizes)
        print(f"Generated: favicon.ico")

        # Save as 32x32 PNG
        img_32 = img.resize((32, 32), Image.Resampling.LANCZOS)
        img_32.save("assets/icons/favicon.png")
        print(f"Generated: assets/icons/favicon.png")

    except Exception as e:
        print(f"Error generating favicons: {e}")
        sys.exit(1)

if __name__ == "__main__":
    generate_favicons("assets/icons/icon-192x192.png")
