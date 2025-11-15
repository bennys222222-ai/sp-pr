from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
import os
from dotenv import load_dotenv

# === Setup ===
load_dotenv()  # liest OPENAI_API_KEY aus .env
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# === Models ===
class Fight(BaseModel):
    fighterA: str
    fighterB: str
    flagA: str | None = None
    flagB: str | None = None

class Event(BaseModel):
    name: str
    location: str
    date: str
    fights: List[Fight]

# === Manual event ===
events = [
    Event(
        name="UFC 321 Aspinall vs Gane",
        location="Manchester Arena, England",
        date="2025-11-15",
        fights=[
            Fight(fighterA="Tom Aspinall 🇬🇧", fighterB="Ciryl Gane 🇫🇷"),
            Fight(fighterA="Virna Jandiroba 🇧🇷", fighterB="Mackenzie Dern 🇧🇷"),
            Fight(fighterA="Umar Nurmagomedov 🇷🇺", fighterB="Mario Bautista 🇺🇸"),
            Fight(fighterA="Alexander Volkov 🇷🇺", fighterB="Jailton Almeida 🇧🇷"),
            Fight(fighterA="Aleksandar Rakic 🇷🇸", fighterB="Azamat Murzakanov 🇷🇺"),
            Fight(fighterA="Nasrat Haqparast 🇲🇦", fighterB="Quillan Salkilld 🇦🇺"),
            Fight(fighterA="Ikram Aliskerov 🇷🇺", fighterB="Jun Yong Park 🇰🇷"),
            Fight(fighterA="Ludovit Klein 🇸🇰", fighterB="Mateusz Rebecki 🇵🇱"),
            Fight(fighterA="Valter Walker 🇧🇷", fighterB="Louie Sutherland 🇬🇧"),
            Fight(fighterA="Nathaniel Wood 🇬🇧", fighterB="Jose Miguel Delgado 🇲🇽"),
            Fight(fighterA="Hamdy Abdelwahab 🇪🇬", fighterB="Chris Barnett 🇪🇸"),
            Fight(fighterA="Azat Maksum 🇰🇿", fighterB="Mitch Raposo 🇺🇸"),
            Fight(fighterA="Jaqueline Amorim 🇧🇷", fighterB="Mizuki Inoue 🇯🇵"),
        ],
    )
]

@app.get("/events")
def get_events():
    return events

@app.post("/predict")
def predict(event: Event):
    prompt = f"Predict winners for '{event.name}' ({event.date}, {event.location}).\n"
    for f in event.fights:
        prompt += f"- {f.fighterA} vs {f.fighterB}\n"
    prompt += "\nGive concise fight-by-fight picks with result method (KO/TKO, SUB, DEC)."

    try:
        r = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert UFC fight analyst."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.8,
        )
        return {"prediction": r.choices[0].message.content.strip()}
    except Exception as e:
        return {"prediction": f"❌ Fehler: {e}"}
