from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import random
from datetime import date, timedelta
import google.generativeai as genai
import os
from dotenv import load_dotenv

from pathlib import Path

env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://localhost:5174",

]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from pydantic import BaseModel

class IncomeRequest(BaseModel):
    amount: float

# In-memory storage for demo purposes
balance_modifier = 0.0

@app.get("/api/forecast")
def get_forecast():
    today = date.today()
    # Hardcoded forecast for Hackathon Demo (in Rupees)
    # Mon: 30000, Tue: 20000, Wed: 10000, Thu: -5000
    base_forecast = [
        {"date": today.isoformat(), "balance": 35000.0},
        {"date": (today + timedelta(days=1)).isoformat(), "balance": 20000.0},
        {"date": (today + timedelta(days=2)).isoformat(), "balance": 10000.0},
        {"date": (today + timedelta(days=3)).isoformat(), "balance": -5000.0},
        {"date": (today + timedelta(days=4)).isoformat(), "balance": -5000.0},
        {"date": (today + timedelta(days=5)).isoformat(), "balance": -5000.0},
        {"date": (today + timedelta(days=6)).isoformat(), "balance": -5000.0},
    ]
    
    # Apply modifier
    forecast = []
    for item in base_forecast:
        forecast.append({
            "date": item["date"],
            "balance": item["balance"] + balance_modifier
        })
    
    return {"forecast": forecast}

@app.post("/api/income")
def add_income(income: IncomeRequest):
    global balance_modifier
    balance_modifier += income.amount
    return {"message": "Income added", "new_modifier": balance_modifier}

def get_smart_nudge():
    try:
        # Explicitly set the env var as the library might look for it
        env_path = Path(__file__).parent / ".env"
        load_dotenv(dotenv_path=env_path)
        key = os.getenv("GEMINI_API_KEY")
        if key:
             os.environ["GOOGLE_API_KEY"] = key
             genai.configure(api_key=key)

        model = genai.GenerativeModel('gemini-2.5-flash')
        # Updated prompt for Rupees
        prompt = "User: Rahul. Current Balance: ₹35,000. Upcoming Rent: ₹50,000 due in 3 days. Risk Level: Critical. Write a short, urgent, emojis-included behavioral nudge to stop him from ordering food delivery right now."
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Error generating nudge: {str(e)}"

@app.get("/api/nudge")
def get_nudge():
    nudge = get_smart_nudge()
    return {
        "message": nudge,
        "risk_level": "Critical" # Hardcoded for demo
    }
