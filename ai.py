import requests

API_URL = "https://api-inference.huggingface.co/models/gpt2"
API_TOKEN = "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"
headers = {"Authorization": f"Bearer {API_TOKEN}"}

def generate_prediction(fights):
    if not fights:
        return "[Keine Kämpfe gefunden.]"

    prompt = "Predict the winner, method and round for each UFC fight:\n"
    for f in fights:
        prompt += f"- {f['fighterA']} vs {f['fighterB']}\n"

    response = requests.post(API_URL, headers=headers, json={
        "inputs": prompt,
        "parameters": {"max_new_tokens": 200}
    })

    data = response.json()
    if isinstance(data, list) and "generated_text" in data[0]:
        return data[0]["generated_text"][len(prompt):].strip()

    return "[AI error]"
