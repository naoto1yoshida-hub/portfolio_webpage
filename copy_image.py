import shutil
import os

src = r"C:\Users\naoto\.gemini\antigravity\brain\cefb015b-4e18-4587-9b5e-7d40eb4b3867\media__1775172338418.jpg"
dst = r"c:\Users\naoto\ai_company\projects\portfolio_web\src\static\images\profile.jpg"

print(f"Copying {src} to {dst}")
if os.path.exists(src):
    shutil.copy2(src, dst)
    print("Success")
else:
    print(f"Source file not found: {src}")
