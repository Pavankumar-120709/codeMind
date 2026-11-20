from google import genai
from dotenv import dotenv_values
import time

vals = dotenv_values('backend/.env')
key = vals.get('GEMINI_API_KEY', '').strip('"\' ')
client = genai.Client(api_key=key)

candidates = [
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.8-flash"
]

for m in candidates:
    t0 = time.time()
    try:
        res = client.models.generate_content(
            model=m,
            contents="Say hi"
        )
        elapsed = round(time.time() - t0, 2)
        print(f"✓ Model '{m}' SUCCESS in {elapsed}s: {res.text.strip()}")
    except Exception as e:
        elapsed = round(time.time() - t0, 2)
        print(f"✗ Model '{m}' FAILED in {elapsed}s: {e}")
