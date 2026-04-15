import requests
try:
    res = requests.post("http://127.0.0.1:5000/contact", json={"name": "test", "email": "test@example.com", "inquiry_type": "test", "message": "hello"})
    print("Status:", res.status_code)
    print("Response:", res.text)
except Exception as e:
    print("Error:", repr(e))
