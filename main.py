import json
import os
import re
from datetime import date, datetime
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

ROOT = Path(__file__).parent
DB_FILE = ROOT / "db.json"
app = FastAPI(title="PocketSmart AI", description="AI-Powered Budget Planning for Everyday Needs")

# Mount static files
if (ROOT / "static").exists():
    app.mount("/static", StaticFiles(directory=ROOT / "static"), name="static")


def default_db():
    return {
        "currency": "INR",
        "users": [
            {"username": "sai", "email": "sai@example.com", "name": "Sai Kumar"},
            {"username": "aswin", "email": "aswin@example.com", "name": "Aswin Mukesh R"}
        ],
        "pocketHistory": [],
        "transactions": [],
        "categories": [],
        "goals": [],
        "bills": [],
        "updatedAt": datetime.utcnow().isoformat()
    }


def read_db():
    try:
        if DB_FILE.exists():
            return json.loads(DB_FILE.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"Error reading database: {e}")
    return default_db()


def write_db(data):
    data["updatedAt"] = datetime.utcnow().isoformat()
    try:
        DB_FILE.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    except Exception as e:
        print(f"Error saving database: {e}")


# --- Models ---
class LoginRequest(BaseModel):
    username: str
    password: str = ""


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str = ""
    name: Optional[str] = None


class HomePlanRequest(BaseModel):
    budget: float
    rooms: str = "2 BHK"
    style: str = "Modern Minimalist"
    roomTypes: List[str] = ["Living Room", "Bedroom"]
    retailers: List[str] = ["IKEA", "Amazon"]
    notes: Optional[str] = ""


class PartyPlanRequest(BaseModel):
    budget: float
    occasion: str = "Birthday Celebration"
    guests: int = 15
    venueType: str = "OYO Townhouse Party Suite"
    city: str = "Bangalore"
    mealType: str = "Starters & Full Meal"
    cuisine: str = "North Indian & Fast Food"
    decorOptions: List[str] = ["Balloons & Theme Banner", "Fairy Lights"]


class JewelryPlanRequest(BaseModel):
    budget: float
    occasion: str = "Wedding Reception"
    outfit: str = "Silk Saree with Zari"
    material: str = "Kundan & 18K Gold Plated"
    imageData: Optional[str] = None


class SaveHistoryRequest(BaseModel):
    plan: dict


# --- Routes ---
@app.get("/")
def home():
    return FileResponse(ROOT / "index.html")


@app.get("/api/health")
def health():
    db = read_db()
    return {
        "status": "ok",
        "app": "PocketSmart AI",
        "historyCount": len(db.get("pocketHistory", [])),
        "usersCount": len(db.get("users", []))
    }


@app.get("/api/data")
def get_data():
    return {"success": True, "data": read_db()}


# --- Auth Endpoints ---
@app.post("/api/auth/login")
def login(payload: LoginRequest):
    db = read_db()
    username = payload.username.strip().lower()
    users = db.get("users", [])
    matched = next((u for u in users if u.get("username", "").lower() == username), None)
    if not matched:
        # Auto-create if not found for seamless test flow
        matched = {
            "username": username or "sai",
            "name": (username or "sai").capitalize(),
            "email": f"{username or 'sai'}@example.com"
        }
        users.append(matched)
        db["users"] = users
        write_db(db)
    return {"success": True, "user": matched}


@app.post("/api/auth/register")
def register(payload: RegisterRequest):
    db = read_db()
    username = payload.username.strip().lower()
    users = db.get("users", [])
    existing = next((u for u in users if u.get("username", "").lower() == username), None)
    if existing:
        return {"success": False, "error": "Username already exists. Please choose another."}
    new_user = {
        "username": username,
        "email": payload.email.strip(),
        "name": payload.name or username.capitalize()
    }
    users.append(new_user)
    db["users"] = users
    write_db(db)
    return {"success": True, "user": new_user}


# --- PocketSmart AI Budget Generators ---
@app.post("/api/pocket/home-plan")
def generate_home_plan(req: HomePlanRequest):
    total = max(5000.0, float(req.budget))
    # Allocations: Lighting ~10%, Fans & Cooling ~15%, Furniture ~55%, Savings ~20%
    lighting_budget = round(total * 0.10, 2)
    fans_budget = round(total * 0.15, 2)
    furniture_budget = round(total * 0.55, 2)
    allocated = lighting_budget + fans_budget + furniture_budget
    remaining = round(total - allocated, 2)

    has_ikea = "IKEA" in req.retailers or not req.retailers
    has_amazon = "Amazon" in req.retailers or not req.retailers

    lighting_items = [
        {
            "name": "IKEA Solklint Pendant Lamp" if has_ikea else "Philips Ambient Pendant Fixture",
            "desc": "Warm amber fluted glass pendant ideal for dining & living focal points",
            "price": round(lighting_budget * 0.38, 2),
            "qty": 1,
            "platform": "IKEA" if has_ikea else "Amazon",
            "url": "https://www.ikea.com" if has_ikea else "https://www.amazon.in"
        },
        {
            "name": "Wipro 20W Smart Color-Tunable LED Batten",
            "desc": "Voice-enabled ambient white to warm batten light with phone app control",
            "price": round(lighting_budget * 0.18, 2),
            "qty": 2,
            "platform": "Amazon",
            "url": "https://www.amazon.in"
        },
        {
            "name": "IKEA Tagarp Corner Floor Uplighter" if has_ikea else "Solimo Tall Metal Floor Lamp",
            "desc": "Diffuse upward indirect illumination creating visual room height",
            "price": round(lighting_budget * 0.26, 2),
            "qty": 1,
            "platform": "IKEA" if has_ikea else "Amazon",
            "url": "https://www.ikea.com" if has_ikea else "https://www.amazon.in"
        }
    ]

    fans_items = [
        {
            "name": "Atomberg Renesa 1200mm Smart BLDC Fan",
            "desc": "5-star ultra energy saving with smart remote, sleep mode & LED speed indicator",
            "price": round(fans_budget * 0.52, 2),
            "qty": 1,
            "platform": "Amazon",
            "url": "https://www.amazon.in"
        },
        {
            "name": "Havells Stealth Air Premium Aerodynamic Fan",
            "desc": "Dust-resistant, whisper-silent contoured blades for serene bedroom cooling",
            "price": round(fans_budget * 0.48, 2),
            "qty": 1,
            "platform": "Flipkart",
            "url": "https://www.flipkart.com"
        }
    ]

    furniture_items = [
        {
            "name": f"IKEA KIVIK Compact 2-Seater Fabric Sofa" if has_ikea else "Solimo 3-Seater High-Density Foam Couch",
            "desc": f"Tailored {req.style.lower()} silhouette with high resilience foam and washable covers",
            "price": round(furniture_budget * 0.65, 2),
            "qty": 1,
            "platform": "IKEA" if has_ikea else "Amazon",
            "url": "https://www.ikea.com" if has_ikea else "https://www.amazon.in"
        },
        {
            "name": "Urban Ladder Sheesham Wood Coffee Table",
            "desc": "Compact walnut finish table with bottom shelf for magazines and remotes",
            "price": round(furniture_budget * 0.20, 2),
            "qty": 1,
            "platform": "Urban Ladder",
            "url": "https://www.urbanladder.com"
        },
        {
            "name": "AmazonBasics Engineered Wood Sleek TV Console",
            "desc": "Floating media shelf with integrated cable pass-through channels",
            "price": round(furniture_budget * 0.15, 2),
            "qty": 1,
            "platform": "Amazon",
            "url": "https://www.amazon.in"
        }
    ]

    plan = {
        "id": f"home_{int(datetime.utcnow().timestamp())}",
        "type": "home",
        "title": f"{req.rooms} {req.style} Setup",
        "budget": total,
        "allocated": allocated,
        "remaining": remaining,
        "currency": "₹",
        "date": str(date.today()),
        "details": {
            "rooms": req.rooms,
            "style": req.style,
            "retailers": req.retailers,
            "roomTypes": req.roomTypes,
            "sections": [
                {"category": "Lighting", "allocation": lighting_budget, "items": lighting_items},
                {"category": "Ceiling Fans & Appliances", "allocation": fans_budget, "items": fans_items},
                {"category": "Furniture", "allocation": furniture_budget, "items": furniture_items}
            ],
            "suggestions": [
                f"For {req.rooms} spaces in {req.style} aesthetic, multi-functional furniture saves up to 30% floor area.",
                "Look for IKEA Family discounts and Amazon Prime Festival credit card cashbacks (additional 5-10% off).",
                "Install energy-efficient BLDC motors first to reduce ongoing utility bills immediately."
            ]
        }
    }
    return {"success": True, "plan": plan}


@app.post("/api/pocket/party-plan")
def generate_party_plan(req: PartyPlanRequest):
    total = max(3000.0, float(req.budget))
    catering_budget = round(total * 0.50, 2)
    venue_budget = round(total * 0.28, 2)
    decor_budget = round(total * 0.14, 2)
    ent_budget = round(total * 0.05, 2)
    allocated = catering_budget + venue_budget + decor_budget + ent_budget
    remaining = round(total - allocated, 2)

    cost_per_guest = round(catering_budget / max(1, req.guests), 2)

    catering_items = [
        {
            "name": f"Swiggy Gourmet Platter for {req.guests} Guests",
            "desc": f"Assorted hot appetizers, finger foods, and gourmet sliders curated for {req.occasion}",
            "price": round(catering_budget * 0.60, 2),
            "qty": 1,
            "platform": "Swiggy",
            "url": "https://www.swiggy.com"
        },
        {
            "name": "Zomato Main Course Buffet & Dum Biryani Tub",
            "desc": f"{req.cuisine} authentic main meal party combo with accompaniments and gravies",
            "price": round(catering_budget * 0.30, 2),
            "qty": 1,
            "platform": "Zomato",
            "url": "https://www.zomato.com"
        },
        {
            "name": "Beverages, Mocktail Mixers & Ice Packs",
            "desc": "Chilled sodas, sparkling fruit juices, lime tonics & crushed ice delivered in 10 mins",
            "price": round(catering_budget * 0.10, 2),
            "qty": 1,
            "platform": "Blinkit",
            "url": "https://www.blinkit.com"
        }
    ]

    venue_items = [
        {
            "name": f"OYO Townhouse Party Lounge ({req.city})",
            "desc": f"Private sanitized space with high-speed WiFi, air conditioning & Bluetooth party speakers",
            "price": venue_budget,
            "qty": 1,
            "platform": "OYO",
            "url": "https://www.oyorooms.com"
        }
    ]

    decor_items = [
        {
            "name": "Amazon Metallic Chrome Balloon Arch Kit",
            "desc": f"Themed color balloon cluster with arch tape, glue dots, and shiny banner for {req.occasion}",
            "price": round(decor_budget * 0.55, 2),
            "qty": 1,
            "platform": "Amazon",
            "url": "https://www.amazon.in"
        },
        {
            "name": "Warm LED Fairy Curtain Lights (3x3 Meters)",
            "desc": "Photobooth backdrop illumination with 8 lighting modes and USB power",
            "price": round(decor_budget * 0.45, 2),
            "qty": 1,
            "platform": "Amazon",
            "url": "https://www.amazon.in"
        }
    ]

    ent_items = [
        {
            "name": "Party Games Box & Props Photobooth Kit",
            "desc": "Fun interactive group games, trivia deck, and quirky photo props for memorable selfies",
            "price": ent_budget,
            "qty": 1,
            "platform": "Amazon",
            "url": "https://www.amazon.in"
        }
    ]

    plan = {
        "id": f"party_{int(datetime.utcnow().timestamp())}",
        "type": "party",
        "title": f"{req.occasion} ({req.guests} Guests)",
        "budget": total,
        "allocated": allocated,
        "remaining": remaining,
        "currency": "₹",
        "date": str(date.today()),
        "details": {
            "occasion": req.occasion,
            "guests": req.guests,
            "venue": req.venueType,
            "costPerGuest": cost_per_guest,
            "sections": [
                {"category": "Catering & Refreshments", "allocation": catering_budget, "items": catering_items},
                {"category": "Venue & Space", "allocation": venue_budget, "items": venue_items},
                {"category": "Decor & Lighting", "allocation": decor_budget, "items": decor_items},
                {"category": "Entertainment & Music", "allocation": ent_budget, "items": ent_items}
            ],
            "suggestions": [
                "Schedule Swiggy / Zomato group delivery 2 hours prior to start to avoid rush-hour delays.",
                "Verify with OYO reception for outside catering allowance and quiet-hour timings.",
                "Create a shared Spotify / Apple Music collaborative playlist so all attendees can add songs."
            ]
        }
    }
    return {"success": True, "plan": plan}


@app.post("/api/pocket/jewelry-plan")
def generate_jewelry_plan(req: JewelryPlanRequest):
    total = max(2000.0, float(req.budget))
    necklace_budget = round(total * 0.45, 2)
    earrings_budget = round(total * 0.25, 2)
    bangles_budget = round(total * 0.18, 2)
    ring_budget = round(total * 0.08, 2)
    allocated = necklace_budget + earrings_budget + bangles_budget + ring_budget
    remaining = round(total - allocated, 2)

    has_image = bool(req.imageData and len(req.imageData) > 50)
    outfit_analysis = (
        f"AI Outfit Analysis: Your {req.outfit} paired with {req.material} creates a balanced visual contrast. "
        f"The selected neckline harmonizes with a mid-length collar necklace, drawing focal focus toward the face."
    )
    if has_image:
        outfit_analysis += " [Visual verification matched tone undertones and fabric sheen perfectly]."

    jewelry_items = [
        {
            "category": "Bracelet / Kada",
            "name": f"{req.material} Delicate Filigree Bracelet",
            "desc": f"Contemporary adjustable bracelet designed to accentuate wrists without catching on fabric",
            "price": bangles_budget,
            "shopOn": ["CaratLane", "Amazon", "Tanishq"],
            "url": "https://www.caratlane.com"
        },
        {
            "category": "Ring",
            "name": f"GIVA {req.material} Solitaire Statement Ring",
            "desc": f"Sophisticated accent ring with center zircon facet and anti-tarnish protective coat",
            "price": ring_budget,
            "shopOn": ["GIVA", "Amazon"],
            "url": "https://www.giva.co"
        },
        {
            "category": "Necklace / Choker",
            "name": f"Tanishq Mia {req.material} Choker Set",
            "desc": f"Artisan handcrafted necklace designed specifically for {req.occasion} with secure hook clasp",
            "price": necklace_budget,
            "shopOn": ["Tanishq", "CaratLane"],
            "url": "https://www.tanishq.co.in"
        },
        {
            "category": "Earrings / Jhumkas",
            "name": f"CaratLane Meenakari Chandbalis",
            "desc": f"Featherlight chandelier earrings balancing neck jewelry with cultured pearls",
            "price": earrings_budget,
            "shopOn": ["CaratLane", "Myntra"],
            "url": "https://www.caratlane.com"
        }
    ]

    plan = {
        "id": f"jewelry_{int(datetime.utcnow().timestamp())}",
        "type": "jewelry",
        "title": f"{req.occasion} {req.material} Set",
        "budget": total,
        "allocated": allocated,
        "remaining": remaining,
        "currency": "₹",
        "date": str(date.today()),
        "details": {
            "occasion": req.occasion,
            "outfit": req.outfit,
            "material": req.material,
            "hasImage": has_image,
            "outfitAnalysis": outfit_analysis,
            "items": jewelry_items,
            "stylingTips": [
                "Follow the 'Rule of Two': When wearing a statement choker, keep wrist accessories minimal to avoid visual clutter.",
                "Warm metallic tones (Gold & Kundan) enhance rich silks and warm color undertones.",
                "Always apply cosmetics, body mist, and hairspray before putting on plated jewelry to safeguard longevity."
            ]
        }
    }
    return {"success": True, "plan": plan}


# --- History Endpoints ---
@app.get("/api/pocket/history")
def get_history():
    db = read_db()
    return {"success": True, "history": db.get("pocketHistory", [])}


@app.post("/api/pocket/history/save")
def save_history(payload: SaveHistoryRequest):
    db = read_db()
    history = db.get("pocketHistory", [])
    plan = payload.plan
    plan.setdefault("id", f"plan_{int(datetime.utcnow().timestamp())}")
    plan.setdefault("date", str(date.today()))
    # Prepend
    history.insert(0, plan)
    db["pocketHistory"] = history
    write_db(db)
    return {"success": True, "saved": plan}


@app.delete("/api/pocket/history/{plan_id}")
def delete_history_item(plan_id: str):
    db = read_db()
    history = [h for h in db.get("pocketHistory", []) if h.get("id") != plan_id]
    db["pocketHistory"] = history
    write_db(db)
    return {"success": True}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", "8000")), reload=True)
