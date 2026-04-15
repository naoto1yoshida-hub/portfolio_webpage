import os

path = r"C:\Users\naoto\.gemini\antigravity\brain\cefb015b-4e18-4587-9b5e-7d40eb4b3867\media__1775172338418.jpg"
print(f"Checking path: {path}")
print(f"Exists: {os.path.exists(path)}")
if os.path.exists(path):
    print(f"Size: {os.path.getsize(path)}")
    try:
        with open(path, 'rb') as f:
            f.read(10)
            print("Successfully read header")
    except Exception as e:
        print(f"Read error: {e}")

dst_dir = r"c:\Users\naoto\ai_company\projects\portfolio_web\src\static\images"
print(f"Checking dest dir: {dst_dir}")
print(f"Exists: {os.path.exists(dst_dir)}")
if os.path.exists(dst_dir):
    print(f"Contents: {os.listdir(dst_dir)}")
