from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
import os
import json
from pathlib import Path
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


# ===========================
# 🔥 NEUE ROUTE FÜR UFC DATA
# ===========================
@app.get("/api/ufc/data")
async def get_ufc_data():
    """
    Serve scraped UFC data from ufc-data.json
    """
    try:
        # Check multiple possible locations
        possible_paths = [
            Path(__file__).parent / "public" / "data" / "ufc-data.json",
            Path(__file__).parent / "data" / "ufc-data.json",
            Path(__file__).parent / "api" / "ufc" / "data" / "ufc-data.json",
            Path(__file__).parent / "ufc-data.json",
        ]
        
        data_file = None
        for path in possible_paths:
            if path.exists():
                data_file = path
                print(f"✅ Found UFC data at: {path}")
                break
        
        if not data_file:
            print("❌ UFC data file not found at any expected location:")
            for p in possible_paths:
                print(f"   - {p}")
            return {
                "events": [],
                "fighters": {},
                "lastUpdated": None,
                "error": "Data file not found. Run scraper first (python scraper.py)"
            }
        
        # Read and return JSON
        with open(data_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print(f"✅ Loaded UFC data: {len(data.get('events', []))} events, {len(data.get('fighters', {}))} fighters")
        return data
        
    except Exception as e:
        print(f"❌ Error loading UFC data: {e}")
        return {
            "events": [],
            "fighters": {},
            "lastUpdated": None,
            "error": str(e)
        }