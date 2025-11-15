import requests

API_URL = "https://api-inference.huggingface.co/models/gpt2"
API_TOKEN = "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"
headers = {"Authorization": f"Bearer {API_TOKEN}"}

def generate_prediction(fights):
    if not fights:
        return "[Keine Kämpfe gefunden.]"

    prompt = "Predict each fight outcome with method and round:\n"
    for f in fights:
        prompt += f"- {f['fighterA']} vs {f['fighterB']}\n"

    try:
        resp = requests.post(API_URL, headers=headers, json={
            "inputs": prompt,
            "parameters": {"max_new_tokens": 200}
        })
        data = resp.json()
        if isinstance(data, list) and "generated_text" in data[0]:
            return data[0]["generated_text"][len(prompt):].strip()
    except Exception as e:
        print("AI ERROR:", e)

    return "[AI error]"
