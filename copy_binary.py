import os
import sys

src = r"C:\Users\naoto\.gemini\antigravity\brain\cefb015b-4e18-4587-9b5e-7d40eb4b3867\media__1775172338418.jpg"
dst = r"c:\Users\naoto\ai_company\projects\portfolio_web\src\static\images\profile.jpg"

try:
    print(f"Checking source: {src}")
    if not os.path.exists(src):
        print("Source missing!")
        sys.exit(1)
    
    print(f"Checking destination directory: {os.path.dirname(dst)}")
    if not os.path.exists(os.path.dirname(dst)):
        os.makedirs(os.path.dirname(dst))
        print("Made directory")

    with open(src, 'rb') as f_src:
        data = f_src.read()
        print(f"Read {len(data)} bytes")
        with open(dst, 'wb') as f_dst:
            f_dst.write(data)
            print("Wrote bytes")
    print("FINISHED SUCCESS")
except Exception as e:
    print(f"ERROR: {str(e)}")
    sys.exit(1)
