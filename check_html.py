import urllib.request
import re

html_content = urllib.request.urlopen("http://127.0.0.1:5000/", timeout=5).read().decode('utf-8')
match = re.search(r'<div class="profile-avatar">(.*?)</div>', html_content, re.DOTALL)
if match:
    print("MATCH FOUND:")
    print(match.group(1).strip())
else:
    print("NO MATCH FOUND")
