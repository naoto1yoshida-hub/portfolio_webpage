import re
with open('templates/index.html', encoding='utf-8') as f:
    html = f.read()
res = re.findall(r'<div class="profile-avatar">(.*?)</div>', html, re.DOTALL)
with open('debug_html.txt', 'w', encoding='utf-8') as f:
    f.write('\n---\n'.join(res))
print("DONE")
