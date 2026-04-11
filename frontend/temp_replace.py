import glob
import os

replacements = {
    # Settings updates
    "    localStorage.setItem('neurovia_user', JSON.stringify(updatedUser));\n": "",
    "    localStorage.setItem('neurovia_user', JSON.stringify(updatedUser));\r\n": "",
    # login/register sets
    "      localStorage.setItem('neurovia_token', data.access_token);\n": "",
    "      localStorage.setItem('neurovia_user', JSON.stringify(data.user));\n": "",
    "      localStorage.setItem('neurovia_token', data.access_token);\r\n": "",
    "      localStorage.setItem('neurovia_user', JSON.stringify(data.user));\r\n": "",
    "      // Generic key kept for backward compat (consult module, screening, etc.)\n": "",
    "      // Generic key kept for backward compat (consult module, screening, etc.)\r\n": "",
    # Removals
    "            localStorage.removeItem('neurovia_token');\n": "",
    "            localStorage.removeItem('neurovia_user');\n": "",
    "            localStorage.removeItem('neurovia_token');\r\n": "",
    "            localStorage.removeItem('neurovia_user');\r\n": "",
    "      localStorage.removeItem(\"neurovia_token\");\n": "",
    "      localStorage.removeItem(\"neurovia_token\");\r\n": "",
    # Fallback gets
    " || localStorage.getItem('neurovia_user')": "",
    " || localStorage.getItem(\"neurovia_user\")": "",
    " || localStorage.getItem('neurovia_token')": "",
    " || localStorage.getItem(\"neurovia_token\")": "",
}

count = 0
for filepath in glob.glob(r'c:\Users\91974\Desktop\Projects\Neurovia\frontend-2\src\**\*.*', recursive=True):
    if not (filepath.endswith('.tsx') or filepath.endswith('.ts') or filepath.endswith('.js') or filepath.endswith('.jsx')):
        continue
    if "AppRoutes" in filepath:
        continue # skip approutes
    with open(filepath, 'r+', encoding='utf-8') as f:
        content = f.read()
        new_content = content
        for old, new in replacements.items():
            new_content = new_content.replace(old, new)
        
        if content != new_content:
            f.seek(0)
            f.write(new_content)
            f.truncate()
            print(f"Updated {filepath}")
            count += 1
print(f"Total updated: {count}")
