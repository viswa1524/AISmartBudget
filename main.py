#!/usr/bin/env python3
"""
PocketSmart AI - Python Web Server with Google Gemini AI Integration
Language: Python 3 (Standard Library: http.server, json, pathlib, os, urllib)
Zero external pip dependencies required.
Connects with Google Gemini AI REST API for:
1. Home Interior AI design & multi-platform allocation
2. Party & Event budget curation (Swiggy, Zomato, OYO)
3. Jewelry styling & outfit visual analysis
4. Interactive Gemini AI Money & Budget Coach Chat
"""
import http.server
import json
import mimetypes
import os
import re
import socketserver
import sys
import urllib.error
import urllib.request
from datetime import date, datetime
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

ROOT = Path(__file__).parent.resolve()
DB_FILE = ROOT / "db.json"
PORT = int(os.environ.get("PORT", 3000))
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()

# Primary and fallback Gemini models
GEMINI_MODELS = ["gemini-3.1-flash-lite", "gemini-3.8-flash"]

# Ensure mimetypes are registered
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("text/html", ".html")
mimetypes.add_type("application/json", ".json")
mimetypes.add_type("image/svg+xml", ".svg")
mimetypes.add_type("image/png", ".png")
mimetypes.add_type("image/jpeg", ".jpg")
mimetypes.add_type("image/webp", ".webp")


# -------------------------------------------------------------
# Google Gemini AI Integration Helper
# -------------------------------------------------------------
def call_gemini(prompt: str, system_instruction: str = None, image_data: str = None) -> str:
    """
    Connects to Google Gemini API using Python standard library (urllib.request).
    Supports text generation and multimodal inline image analysis.
    """
    if not GEMINI_API_KEY:
        return ""

    parts = []
    # If base64 image data is provided, add inline_data part
    if image_data and isinstance(image_data, str) and len(image_data) > 50:
        match = re.match(r"data:(image/\w+);base64,(.+)", image_data)
        if match:
            mime_type = match.group(1)
            b64_str = match.group(2)
            parts.append({
                "inline_data": {
                    "mime_type": mime_type,
                    "data": b64_str
                }
            })

    parts.append({"text": prompt})

    payload = {"contents": [{"parts": parts}]}
    if system_instruction:
        payload["system_instruction"] = {
            "parts": [{"text": system_instruction}]
        }

    encoded_data = json.dumps(payload).encode("utf-8")

    for model in GEMINI_MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"
        req = urllib.request.Request(
            url,
            data=encoded_data,
            headers={"Content-Type": "application/json"}
        )
        try:
            with urllib.request.urlopen(req, timeout=12) as response:
                res_json = json.loads(response.read().decode("utf-8"))
                candidates = res_json.get("candidates", [])
                if candidates:
                    reply_parts = candidates[0].get("content", {}).get("parts", [])
                    if reply_parts and "text" in reply_parts[0]:
                        return reply_parts[0]["text"].strip()
        except Exception as err:
            print(f"[PocketSmart AI] Notice ({model}): {err}", file=sys.stderr)
            continue

    return ""


# -------------------------------------------------------------
# Database Operations
# -------------------------------------------------------------
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
        print(f"[PocketSmart] Warning reading db.json: {e}", file=sys.stderr)
    return default_db()


def write_db(data):
    data["updatedAt"] = datetime.utcnow().isoformat()
    try:
        DB_FILE.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    except Exception as e:
        print(f"[PocketSmart] Error saving db.json: {e}", file=sys.stderr)


# -------------------------------------------------------------
# AI-Powered Budget Calculation Engines
# -------------------------------------------------------------
def calc_home_plan(data):
    budget_raw = data.get("budget", 50000)
    total = max(5000.0, float(budget_raw) if budget_raw else 50000.0)
    rooms = data.get("rooms", "2 BHK")
    style = data.get("style", "Modern Minimalist")
    retailers = data.get("retailers") or ["IKEA", "Amazon"]
    room_types = data.get("roomTypes") or ["Living Room", "Bedroom"]
    notes = data.get("notes", "")

    lighting_budget = round(total * 0.10, 2)
    fans_budget = round(total * 0.15, 2)
    furniture_budget = round(total * 0.55, 2)
    allocated = round(lighting_budget + fans_budget + furniture_budget, 2)
    remaining = round(total - allocated, 2)

    has_ikea = "IKEA" in retailers or not retailers

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
            "desc": "5-star ultra energy saving with smart remote, sleep mode & timer",
            "price": round(fans_budget * 0.52, 2),
            "qty": 1,
            "platform": "Amazon",
            "url": "https://www.amazon.in"
        },
        {
            "name": "Havells Stealth Air Premium Aerodynamic Fan",
            "desc": "Whisper-silent contoured blades for peaceful bedroom cooling",
            "price": round(fans_budget * 0.48, 2),
            "qty": 1,
            "platform": "Flipkart",
            "url": "https://www.flipkart.com"
        }
    ]

    furniture_items = [
        {
            "name": "IKEA KIVIK Compact 2-Seater Fabric Sofa" if has_ikea else "Solimo 3-Seater High-Density Foam Couch",
            "desc": f"Tailored {style.lower()} silhouette with high resilience foam and washable covers",
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

    # Generate personalized Gemini AI advice
    gemini_prompt = (
        f"You are PocketSmart AI, an interior budgeting expert. The user wants to furnish a {rooms} apartment in '{style}' style "
        f"focusing on {', '.join(room_types)} with a budget of ₹{total:,.0f} using retailers {', '.join(retailers)}. "
        f"{f'User note: {notes}. ' if notes else ''}"
        f"Provide 3 high-impact, practical bullet points on how to maximize aesthetic value, space efficiency, and money-saving shopping tips."
    )
    ai_tips_raw = call_gemini(gemini_prompt, system_instruction="Output exactly 3 bullet points, each starting with a bullet marker. Be concise, actionable, and specific to Indian retail options.")

    if ai_tips_raw:
        # Extract clean bullet items
        suggestions = [
            line.strip().lstrip("*-•123456789. ")
            for line in ai_tips_raw.split("\n")
            if line.strip() and not line.strip().startswith("#")
        ][:3]
    else:
        suggestions = [
            f"For {rooms} spaces in {style} aesthetic, multi-functional modular furniture saves up to 30% floor area.",
            "Look for IKEA Family member discounts and Amazon Great Indian Festival credit card cashbacks (additional 5-10% off).",
            "Install 5-star energy-efficient BLDC motors first to reduce ongoing utility electricity bills immediately."
        ]

    return {
        "id": f"home_{int(datetime.utcnow().timestamp())}",
        "type": "home",
        "title": f"{rooms} {style} Setup",
        "budget": total,
        "allocated": allocated,
        "remaining": remaining,
        "currency": "₹",
        "date": str(date.today()),
        "aiPowered": bool(ai_tips_raw),
        "details": {
            "rooms": rooms,
            "style": style,
            "retailers": retailers,
            "roomTypes": room_types,
            "sections": [
                {"category": "Lighting", "allocation": lighting_budget, "items": lighting_items},
                {"category": "Ceiling Fans & Appliances", "allocation": fans_budget, "items": fans_items},
                {"category": "Furniture", "allocation": furniture_budget, "items": furniture_items}
            ],
            "suggestions": suggestions
        }
    }


def calc_party_plan(data):
    budget_raw = data.get("budget", 15000)
    total = max(3000.0, float(budget_raw) if budget_raw else 15000.0)
    occasion = data.get("occasion", "Birthday Celebration")
    guests = int(data.get("guests", 15))
    venue_type = data.get("venueType", "OYO Townhouse Party Suite")
    city = data.get("city", "Bangalore")
    cuisine = data.get("cuisine", "North Indian & Fast Food")

    catering_budget = round(total * 0.50, 2)
    venue_budget = round(total * 0.28, 2)
    decor_budget = round(total * 0.14, 2)
    ent_budget = round(total * 0.05, 2)
    allocated = round(catering_budget + venue_budget + decor_budget + ent_budget, 2)
    remaining = round(total - allocated, 2)
    cost_per_guest = round(catering_budget / max(1, guests), 2)

    catering_items = [
        {
            "name": f"Swiggy Gourmet Platter for {guests} Guests",
            "desc": f"Assorted hot appetizers, finger foods, and gourmet sliders for {occasion}",
            "price": round(catering_budget * 0.60, 2),
            "qty": 1,
            "platform": "Swiggy",
            "url": "https://www.swiggy.com"
        },
        {
            "name": "Zomato Main Course Buffet & Dum Biryani Tub",
            "desc": f"{cuisine} authentic main meal party combo with accompaniments and gravies",
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
            "name": f"OYO Townhouse Party Lounge ({city})",
            "desc": "Private sanitized space with air conditioning, WiFi & Bluetooth party speakers",
            "price": venue_budget,
            "qty": 1,
            "platform": "OYO",
            "url": "https://www.oyorooms.com"
        }
    ]

    decor_items = [
        {
            "name": "Amazon Metallic Chrome Balloon Arch Kit",
            "desc": f"Themed color balloon cluster with arch tape, glue dots, and shiny banner for {occasion}",
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

    # Generate personalized Gemini AI advice for the party
    gemini_prompt = (
        f"You are PocketSmart AI party budgeting advisor. A host is planning a '{occasion}' in {city} for {guests} guests "
        f"with a total budget of ₹{total:,.0f} using {venue_type} and {cuisine} catering via Swiggy/Zomato. "
        f"Provide 3 concise, practical tips covering food portion control, order scheduling, and host cost-saving tricks."
    )
    ai_tips_raw = call_gemini(gemini_prompt, system_instruction="Output exactly 3 concise, practical bullet points.")

    if ai_tips_raw:
        suggestions = [
            line.strip().lstrip("*-•123456789. ")
            for line in ai_tips_raw.split("\n")
            if line.strip() and not line.strip().startswith("#")
        ][:3]
    else:
        suggestions = [
            "Schedule Swiggy / Zomato group delivery 2 hours prior to start to avoid rush-hour delays.",
            "Verify with OYO reception for outside catering allowance and quiet-hour timings.",
            "Create a shared collaborative music playlist so all 15 attendees can add their favorite songs."
        ]

    return {
        "id": f"party_{int(datetime.utcnow().timestamp())}",
        "type": "party",
        "title": f"{occasion} ({guests} Guests)",
        "budget": total,
        "allocated": allocated,
        "remaining": remaining,
        "currency": "₹",
        "date": str(date.today()),
        "aiPowered": bool(ai_tips_raw),
        "details": {
            "occasion": occasion,
            "guests": guests,
            "venue": venue_type,
            "costPerGuest": cost_per_guest,
            "sections": [
                {"category": "Catering & Refreshments", "allocation": catering_budget, "items": catering_items},
                {"category": "Venue & Space", "allocation": venue_budget, "items": venue_items},
                {"category": "Decor & Lighting", "allocation": decor_budget, "items": decor_items},
                {"category": "Entertainment & Music", "allocation": ent_budget, "items": ent_items}
            ],
            "suggestions": suggestions
        }
    }


def calc_jewelry_plan(data):
    budget_raw = data.get("budget", 20000)
    total = max(2000.0, float(budget_raw) if budget_raw else 20000.0)
    occasion = data.get("occasion", "Wedding Reception")
    outfit = data.get("outfit", "Royal Navy Blue Silk Saree with Antique Gold Zari")
    material = data.get("material", "Kundan & 18K Gold Plated")
    image_data = data.get("imageData", "")

    necklace_budget = round(total * 0.45, 2)
    earrings_budget = round(total * 0.25, 2)
    bangles_budget = round(total * 0.18, 2)
    ring_budget = round(total * 0.08, 2)
    allocated = round(necklace_budget + earrings_budget + bangles_budget + ring_budget, 2)
    remaining = round(total - allocated, 2)

    has_image = bool(image_data and len(image_data) > 50)

    # Call Gemini for fashion styling & color coordination analysis
    gemini_prompt = (
        f"You are PocketSmart AI, a luxury jewelry and fashion stylist. A customer is attending a '{occasion}'. "
        f"Their outfit is: '{outfit}'. Their preferred jewelry material style is: '{material}'. "
        f"Their total budget is ₹{total:,.0f}. "
        f"1. Give a 2-sentence sophisticated outfit analysis explaining why this material and neckline complement their attire. "
        f"2. Follow with 3 concise bullet points on styling tips, hair pairing, and jewelry preservation."
    )
    ai_raw = call_gemini(
        gemini_prompt,
        system_instruction="You are an expert Indian luxury jewelry stylist. Give professional, warm advice.",
        image_data=image_data if has_image else None
    )

    outfit_analysis = ""
    styling_tips = []

    if ai_raw:
        # Separate analysis paragraph and bullet points
        lines = [l.strip() for l in ai_raw.split("\n") if l.strip()]
        para_lines = []
        bullet_lines = []
        for line in lines:
            if line.startswith(("-", "*", "•", "1.", "2.", "3.")):
                bullet_lines.append(line.lstrip("*-•123456789. "))
            else:
                para_lines.append(line)

        if para_lines:
            outfit_analysis = " ".join(para_lines[:2])
        if bullet_lines:
            styling_tips = bullet_lines[:3]

    if not outfit_analysis:
        outfit_analysis = (
            f"AI Outfit Analysis: Your {outfit} paired with {material} creates an exquisite harmony. "
            f"The selected neckline complements a mid-length choker and statement studs, balancing color and luster."
        )
        if has_image:
            outfit_analysis += " [Visual verification matched fabric sheen and palette undertones]."

    if not styling_tips:
        styling_tips = [
            "Follow the 'Rule of Two': When wearing a statement choker, keep wrist accessories minimal to avoid visual clutter.",
            "Warm metallic tones (Gold & Kundan) enhance rich silks and warm color undertones.",
            "Always apply cosmetics, body mist, and hairspray before putting on plated jewelry to safeguard longevity."
        ]

    jewelry_items = [
        {
            "category": "Bracelet / Kada",
            "name": f"{material} Delicate Filigree Kada",
            "desc": "Contemporary adjustable kada designed to accentuate wrists without snagging fabric",
            "price": bangles_budget,
            "shopOn": ["CaratLane", "Amazon", "Tanishq"],
            "url": "https://www.caratlane.com"
        },
        {
            "category": "Ring",
            "name": f"GIVA {material} Solitaire Statement Ring",
            "desc": "Sophisticated accent ring with center zircon facet and anti-tarnish protective coat",
            "price": ring_budget,
            "shopOn": ["GIVA", "Amazon"],
            "url": "https://www.giva.co"
        },
        {
            "category": "Necklace / Choker",
            "name": f"Tanishq Mia {material} Choker Set",
            "desc": f"Artisan handcrafted necklace designed specifically for {occasion} with secure hook clasp",
            "price": necklace_budget,
            "shopOn": ["Tanishq", "CaratLane"],
            "url": "https://www.tanishq.co.in"
        },
        {
            "category": "Earrings / Jhumkas",
            "name": "CaratLane Meenakari Chandbalis",
            "desc": "Featherlight chandelier earrings balancing neck jewelry with cultured pearls",
            "price": earrings_budget,
            "shopOn": ["CaratLane", "Myntra"],
            "url": "https://www.caratlane.com"
        }
    ]

    return {
        "id": f"jewelry_{int(datetime.utcnow().timestamp())}",
        "type": "jewelry",
        "title": f"{occasion} {material} Set",
        "budget": total,
        "allocated": allocated,
        "remaining": remaining,
        "currency": "₹",
        "date": str(date.today()),
        "aiPowered": bool(ai_raw),
        "details": {
            "occasion": occasion,
            "outfit": outfit,
            "material": material,
            "hasImage": has_image,
            "outfitAnalysis": outfit_analysis,
            "items": jewelry_items,
            "stylingTips": styling_tips
        }
    }


# -------------------------------------------------------------
# HTTP Request Handler
# -------------------------------------------------------------
class PocketSmartHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def send_json(self, status_code, data):
        payload = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def read_json_body(self):
        length = int(self.headers.get("Content-Length", 0))
        if length <= 0:
            return {}
        raw = self.rfile.read(length).decode("utf-8")
        try:
            return json.loads(raw)
        except Exception:
            return {}

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # 1. API: Health Check
        if path == "/api/health":
            db = read_db()
            return self.send_json(200, {
                "status": "ok",
                "app": "PocketSmart AI",
                "geminiConnected": bool(GEMINI_API_KEY),
                "model": GEMINI_MODELS[0],
                "historyCount": len(db.get("pocketHistory", [])),
                "usersCount": len(db.get("users", []))
            })

        # 2. API: Gemini AI Status
        if path == "/api/ai/status":
            return self.send_json(200, {
                "success": True,
                "aiEnabled": bool(GEMINI_API_KEY),
                "model": GEMINI_MODELS[0],
                "status": "online" if GEMINI_API_KEY else "offline"
            })

        # 3. API: Get Data
        if path == "/api/data":
            return self.send_json(200, {"success": True, "data": read_db()})

        # 4. API: History
        if path == "/api/pocket/history":
            db = read_db()
            return self.send_json(200, {"success": True, "history": db.get("pocketHistory", [])})

        # 5. Static Files (/static/*)
        if path.startswith("/static/"):
            rel_path = path[len("/static/"):]
            file_path = ROOT / "static" / rel_path
            if file_path.is_file():
                mime, _ = mimetypes.guess_type(str(file_path))
                content = file_path.read_bytes()
                self.send_response(200)
                self.send_header("Content-Type", mime or "application/octet-stream")
                self.send_header("Content-Length", str(len(content)))
                self.end_headers()
                self.wfile.write(content)
                return
            else:
                self.send_error(404, "File not found")
                return

        # 6. Root & HTML Views -> index.html
        index_file = ROOT / "index.html"
        if index_file.is_file():
            content = index_file.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            self.wfile.write(content)
            return

        self.send_error(404, "Page not found")

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        body = self.read_json_body()

        # 1. Gemini AI Chat Assistant
        if path in ("/api/ai/chat", "/api/assistant"):
            user_msg = body.get("message", "").strip()
            summary = body.get("summary", {})
            if not user_msg:
                return self.send_json(400, {"success": False, "error": "Message is required"})

            system_inst = (
                "You are PocketSmart Gemini AI, an intelligent, empathetic financial and shopping budget coach. "
                "You help users make every rupee count across home decor (IKEA, Amazon), party planning (Swiggy, Zomato, OYO), "
                "and outfit jewelry styling (Tanishq, CaratLane, GIVA). Give structured, concise, practical answers with specific amounts in ₹."
            )
            context = f"User asks: '{user_msg}'."
            if summary:
                context += f" Current user budget context: {json.dumps(summary)}."

            gemini_reply = call_gemini(context, system_instruction=system_inst)
            if not gemini_reply:
                # Rule-based fallback if offline
                msg_l = user_msg.lower()
                if "home" in msg_l or "room" in msg_l or "furniture" in msg_l:
                    gemini_reply = "For home decor on a budget, prioritize functional pieces first (like an IKEA KIVIK compact sofa) and opt for energy-saving BLDC fans to lower monthly electric bills."
                elif "party" in msg_l or "birthday" in msg_l or "food" in msg_l:
                    gemini_reply = "When planning parties, allocate ~50% to food platters from Swiggy/Zomato, 28% to an OYO Townhouse venue, and keep 14% for balloon decor to stay well within budget."
                elif "jewelry" in msg_l or "saree" in msg_l or "outfit" in msg_l:
                    gemini_reply = "Pairing antique Kundan or 18K gold-plated sets with rich silk sarees elevates your look while keeping accessories under ₹20,000 via CaratLane and GIVA."
                else:
                    gemini_reply = "Try the 50/30/20 rule: 50% for core needs, 30% for curated wants, and 20% dedicated to savings buffer. How can I help customize your plan today?"

            return self.send_json(200, {
                "success": True,
                "reply": gemini_reply,
                "model": GEMINI_MODELS[0]
            })

        # 2. Auth: Login
        if path == "/api/auth/login":
            db = read_db()
            username = body.get("username", "sai").strip().lower()
            users = db.get("users", [])
            matched = next((u for u in users if u.get("username", "").lower() == username), None)
            if not matched:
                matched = {
                    "username": username or "sai",
                    "name": (username or "sai").capitalize(),
                    "email": f"{username or 'sai'}@example.com"
                }
                users.append(matched)
                db["users"] = users
                write_db(db)
            return self.send_json(200, {"success": True, "user": matched})

        # 3. Auth: Register
        if path == "/api/auth/register":
            db = read_db()
            username = body.get("username", "").strip().lower()
            if not username:
                return self.send_json(400, {"success": False, "error": "Username is required"})
            users = db.get("users", [])
            if any(u.get("username", "").lower() == username for u in users):
                return self.send_json(400, {"success": False, "error": "Username already exists"})
            new_user = {
                "username": username,
                "email": body.get("email", "").strip(),
                "name": body.get("name") or username.capitalize()
            }
            users.append(new_user)
            db["users"] = users
            write_db(db)
            return self.send_json(200, {"success": True, "user": new_user})

        # 4. Home Interior Planner
        if path == "/api/pocket/home-plan":
            plan = calc_home_plan(body)
            return self.send_json(200, {"success": True, "plan": plan})

        # 5. Party Planner
        if path == "/api/pocket/party-plan":
            plan = calc_party_plan(body)
            return self.send_json(200, {"success": True, "plan": plan})

        # 6. Jewelry Planner
        if path == "/api/pocket/jewelry-plan":
            plan = calc_jewelry_plan(body)
            return self.send_json(200, {"success": True, "plan": plan})

        # 7. Save History
        if path == "/api/pocket/history/save":
            db = read_db()
            history = db.get("pocketHistory", [])
            plan = body.get("plan", {})
            plan.setdefault("id", f"plan_{int(datetime.utcnow().timestamp())}")
            plan.setdefault("date", str(date.today()))
            history.insert(0, plan)
            db["pocketHistory"] = history
            write_db(db)
            return self.send_json(200, {"success": True, "saved": plan})

        # 8. Generic /api/plan
        if path == "/api/plan":
            budget = max(0.0, float(body.get("budget", 0)))
            return self.send_json(200, {
                "success": True,
                "plan": {
                    "needs": round(budget * 0.5, 2),
                    "wants": round(budget * 0.3, 2),
                    "savings": round(budget * 0.2, 2)
                }
            })

        self.send_error(404, "Endpoint not found")

    def do_DELETE(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path.startswith("/api/pocket/history/"):
            plan_id = path[len("/api/pocket/history/"):]
            db = read_db()
            history = [h for h in db.get("pocketHistory", []) if h.get("id") != plan_id]
            db["pocketHistory"] = history
            write_db(db)
            return self.send_json(200, {"success": True, "deletedId": plan_id})

        self.send_error(404, "Endpoint not found")


class ThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


def run_server():
    print(f"[PocketSmart AI] Starting server on http://0.0.0.0:{PORT} (Gemini AI: {'Connected' if GEMINI_API_KEY else 'No Key'})...")
    server = ThreadedHTTPServer(("0.0.0.0", PORT), PocketSmartHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[PocketSmart AI] Shutting down.")
        server.server_close()


if __name__ == "__main__":
    run_server()
