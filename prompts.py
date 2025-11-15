def build_prompt(fight_data: dict) -> str:
    return f"""
Du bist ein erfahrener MMA-Analyst.

Analysiere den folgenden Kampf basierend auf:
- Statistiken
- Reddit/News-Meldungen
- Schwächen/Stärken

Fighter 1: {fight_data['fighter_1']}
Fighter 2: {fight_data['fighter_2']}
Stats: {fight_data['stats']}
News/Reddit: {fight_data['social_data']}

Gib zurück:
1. Prediction (z. B. "Jon Jones gewinnt per Decision")
2. Confidence (0–100%)
3. Begründung in 3–5 Sätzen
"""
