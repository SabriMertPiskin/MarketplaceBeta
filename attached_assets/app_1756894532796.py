import os
import uuid
import json
import logging
import struct
from datetime import datetime, timedelta, timezone
from functools import wraps
from pathlib import Path
import threading
import time
import re

import requests
from flask import Flask, request, jsonify, g, render_template, redirect, url_for
from flask_socketio import SocketIO, emit, join_room, leave_room
from werkzeug.utils import secure_filename
from werkzeug.exceptions import RequestEntityTooLarge
from PIL import Image, UnidentifiedImageError

import firebase_admin
from firebase_admin import credentials, firestore, storage
from firebase_admin import auth as fb_auth  # Güvenli Bearer token doğrulama

import numpy as np
from flask_cors import CORS
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)

# Sadece belirli origin’leri whitelist’e ekleyelim
CORS(app, resources={r"/*": {"origins": ["http://localhost:5173"]}}, supports_credentials=False)

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    # Örnek kullanıcı kontrolü
    if email == "demo@example.com" and password == "demo1234":
        return jsonify({"status": "success", "token": "demo_token"}), 200
    return jsonify({"status": "fail", "message": "Invalid credentials"}), 401

if __name__ == "__main__":
    app.run(debug=True)


# Pillow güvenlik (decompression bomb)
Image.MAX_IMAGE_PIXELS = 40_000_000

# -------- TR formatting helpers (Babel'siz) --------
from decimal import Decimal, ROUND_HALF_UP, InvalidOperation
try:
    from zoneinfo import ZoneInfo  # Py3.9+
    ZONE_IST = ZoneInfo("Europe/Istanbul")
    def to_ist(dt): return dt.astimezone(ZONE_IST)
except Exception:
    import pytz
    _tz_ist = pytz.timezone("Europe/Istanbul")
    def to_ist(dt): return _tz_ist.normalize(dt.astimezone(_tz_ist))

TR_MONTHS = ["", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
             "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]

def parse_iso(s: str):
    if not s:
        return None
    s = s.strip()
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    try:
        dt = datetime.fromisoformat(s)
    except Exception:
        return None
    return dt

def format_try(amount) -> str:
    try:
        d = Decimal(str(amount)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    except InvalidOperation:
        d = Decimal("0.00")
    sign = "-" if d < 0 else ""
    d = abs(d)
    whole = int(d)
    frac = int((d - Decimal(whole)) * 100)
    int_str = f"{whole:,}".replace(",", ".")
    return f"{sign}₺{int_str},{frac:02d}"

def format_datetime_tr(iso_str, with_time=True) -> str:
    dt = parse_iso(iso_str)
    if not dt:
        return ""
    ist = to_ist(dt)
    if with_time:
        return f"{ist.day} {TR_MONTHS[ist.month]} {ist.year} {ist.hour:02d}:{ist.minute:02d}"
    else:
        return f"{ist.day} {TR_MONTHS[ist.month]} {ist.year}"

def format_timedelta_tr(iso_str) -> str:
    dt = parse_iso(iso_str)
    if not dt:
        return ""
    delta = datetime.now(timezone.utc) - dt.astimezone(timezone.utc)
    sec = int(delta.total_seconds())
    if sec < 5: return "şimdi"
    if sec < 60: return f"{sec} saniye önce"
    m = sec // 60
    if m < 60: return f"{m} dakika önce"
    h = m // 60
    if h < 24: return f"{h} saat önce"
    d = h // 24
    if d < 30: return f"{d} gün önce"
    mo = d // 30
    if mo < 12: return f"{mo} ay önce"
    y = mo // 12
    return f"{y} yıl önce"

def ts_tr():
    try:
        return datetime.now(ZONE_IST).strftime("%d.%m.%Y %H:%M")
    except Exception:
        return datetime.utcnow().strftime("%d.%m.%Y %H:%M")

# ---------- LOGGING ----------
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.FileHandler('app.log', encoding='utf-8'), logging.StreamHandler()]
)

class RedactingFormatter(logging.Formatter):
    def format(self, record):
        s = super().format(record)
        s = re.sub(r'[\w\.-]+@[\w\.-]+', '[EMAIL]', s)
        s = re.sub(r'\b\d{11}\b', '[TCKN]', s)
        s = re.sub(r'\b\d{10,11}\b', '[PHONE]', s)
        return s

_root = logging.getLogger()
for h in _root.handlers:
    h.setFormatter(RedactingFormatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))

logger = logging.getLogger(__name__)

# Audit logger (TR format satır)
audit_logger = logging.getLogger("audit_tr")
audit_logger.setLevel(logging.INFO)
_audit_handler = logging.FileHandler('audit_tr.log', encoding='utf-8')
_audit_handler.setFormatter(logging.Formatter('%(message)s'))
audit_logger.addHandler(_audit_handler)
audit_logger.propagate = False

def pinata_url_from_hash(ipfs_hash: str):
    if not ipfs_hash:
        return None
    return f"https://gateway.pinata.cloud/ipfs/{ipfs_hash}"

def tr_log(kullanici_adi: str = None, uretici_adi: str = None, fiyat_try_val=None, pinata_url: str = None, extra: dict = None):
    line = f"{ts_tr()} | Kullanıcı Adı: {kullanici_adi or '-'} | Üretici: {uretic_adi if (uretic_adi:=uretici_adi) else '-'} | Fiyat: {format_try(fiyat_try_val) if fiyat_try_val is not None else '-'} | PinataSTL: {pinata_url or '-'}"
    if extra:
        parts = [f"{k}={v}" for k, v in extra.items() if v is not None]
        if parts:
            line += " | " + " ".join(parts)
    audit_logger.info(line)

# ---------- PINATA KEYS DOSYASINDAN OKUMA ----------
def load_pinata_keys(filepath="pinata_keys.txt"):
    keys = {}
    try:
        if os.path.exists(filepath):
            with open(filepath, "r") as f:
                for line in f:
                    if "=" in line and not line.startswith("#"):
                        k, v = line.strip().split("=", 1)
                        keys[k] = v
    except Exception as e:
        logger.warning(f"Pinata key file read warning: {e}")
    # Env fallback overrides file
    if os.getenv("PINATA_API_KEY"):
        keys["PINATA_API_KEY"] = os.getenv("PINATA_API_KEY")
    if os.getenv("PINATA_SECRET_API_KEY"):
        keys["PINATA_SECRET_API_KEY"] = os.getenv("PINATA_SECRET_API_KEY")
    if not keys:
        logger.warning("Pinata keys not found, IPFS pinning will fail until configured.")
    return keys

pinata_cfg = load_pinata_keys()

# ---------- CONFIGURATION ----------
class Config:
    FIREBASE_CRED_PATH = os.getenv("FIREBASE_CRED_PATH", "tutustu-8d90d-1a62b2ddc941.json")
    BUCKET_NAME = os.getenv("BUCKET_NAME", "tutustu-8d90d.appspot.com")
    MAX_STL_SIZE = 100 * 1024 * 1024  # 100MB
    MAX_PHOTO_SIZE = 10 * 1024 * 1024  # 10MB
    ALLOWED_STL = {".stl"}
    ALLOWED_IMAGES = {".jpg", ".jpeg", ".png"}
    DEBUG = os.getenv("DEBUG", "True").lower() == "true"
    PORT = int(os.getenv("PORT", 5000))
    HOST = os.getenv("HOST", "0.0.0.0")
    SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-key")

    # Security
    REQUIRE_HTTPS = os.getenv("REQUIRE_HTTPS", "True").lower() == "true"

    # Pinata
    PINATA_API_KEY = os.getenv("PINATA_API_KEY", pinata_cfg.get("PINATA_API_KEY"))
    PINATA_SECRET_API_KEY = os.getenv("PINATA_SECRET_API_KEY", pinata_cfg.get("PINATA_SECRET_API_KEY"))
    PINATA_BASE_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS"

    # Payment
    IYZICO_API_KEY = os.getenv("IYZICO_API_KEY", "")
    IYZICO_SECRET_KEY = os.getenv("IYZICO_SECRET_KEY", "")
    PAYMENT_CALLBACK_URL = os.getenv("PAYMENT_CALLBACK_URL", "http://localhost:5000/api/payment/callback")

    # Commission
    DEFAULT_COMMISSION_RATE = 0.15  # %15

    # Storage signed URL TTL (seconds)
    STORAGE_SIGNED_URL_TTL = int(os.getenv("STORAGE_SIGNED_URL_TTL", "3600"))

# ---------- UTILS ----------
def get_temp_path(filename: str) -> str:
    temp_dir = Path("/tmp") if os.name != 'nt' else Path("C:/temp")
    temp_dir.mkdir(parents=True, exist_ok=True)
    return os.path.join(temp_dir, filename)

def now_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"

# ---------- ORDER STATE MACHINE ----------
class OrderStateMachine:
    TRANSITIONS = {
        "draft": ["pending", "cancelled"],
        "pending": ["accepted", "rejected", "cancelled"],
        "accepted": ["paid", "cancelled"],
        "paid": ["in_production", "refunded"],
        "in_production": ["completed_by_producer"],
        "completed_by_producer": ["confirmed", "dispute_open"],
        "dispute_open": ["confirmed", "refunded", "partial_refund"],
        "confirmed": [],
        "cancelled": [],
        "refunded": [],
        "rejected": [],
    }

    @staticmethod
    def can_transition(current_state: str, new_state: str) -> bool:
        return new_state in OrderStateMachine.TRANSITIONS.get(current_state, [])

    @staticmethod
    def transition(db, order_id: str, new_state: str, actor_id: str, reason: str = None):
        @firestore.transactional
        def update_state(transaction):
            order_ref = db.collection("orders").document(order_id)
            snap = transaction.get(order_ref)
            order = snap.to_dict()
            if not order:
                raise ValueError("Order not found")
            current_state = order.get('status')
            if not OrderStateMachine.can_transition(current_state, new_state):
                raise ValueError(f"Cannot transition from {current_state} to {new_state}")
            update_data = {
                "status": new_state,
                "updated_at": now_iso(),
                f"{new_state}_at": now_iso(),
                f"{new_state}_by": actor_id
            }
            if reason:
                update_data[f"{new_state}_reason"] = reason
            transaction.update(order_ref, update_data)
            transaction.set(
                db.collection("order_state_history").document(),
                {
                    "order_id": order_id,
                    "from_state": current_state,
                    "to_state": new_state,
                    "actor_id": actor_id,
                    "reason": reason,
                    "created_at": now_iso()
                }
            )
            return order
        transaction = db.transaction()
        return update_state(transaction)

# ---------- PRICING ENGINE ----------
class PricingEngine:
    @staticmethod
    def calculate_price(analysis: dict, params: dict) -> dict:
        analysis = analysis or {}
        weight_g = float(max(analysis.get('estimated_weight_g', 0.0), 0.1))  # min 0.1g
        triangle_count = int(max(analysis.get('triangle_count', 0), 1))
        print_time_minutes = float(max(analysis.get('estimated_print_time_minutes', 0.0), 0.0))

        material_price_per_g = float(max(params.get('material_price_per_g', 0.02), 0.0))
        infill = float(params.get('infill_density', 0.2))
        infill = max(0.1, min(infill, 1.0))
        hourly_rate = float(max(params.get('hourly_rate', 5.0), 0.0))
        fixed_cost = float(max(params.get('fixed_cost', 1.0), 0.0))
        support_required = bool(params.get('support_required', False))

        margin_percent = float(max(params.get('margin_percent', 0.20), 0.0))
        commission_rate = float(max(params.get('commission_rate', Config.DEFAULT_COMMISSION_RATE), 0.0))
        provider_fee_rate = float(max(params.get('provider_fee_rate', 0.025), 0.0))
        min_order = float(max(params.get('min_order_amount', 10.0), 0.0))

        print_time_hours = print_time_minutes / 60.0

        infill_multiplier = 1.0
        if infill > 0.5:
            infill_multiplier = 1.5
        elif infill > 0.2:
            infill_multiplier = 1.2

        material_cost = max(weight_g * material_price_per_g * infill_multiplier, 0.0)
        time_cost = max(print_time_hours * hourly_rate, 0.0)
        support_cost = max((weight_g * 0.3 * material_price_per_g) if support_required else 0.0, 0.0)
        producer_base_cost = material_cost + time_cost + support_cost + fixed_cost

        producer_margin = max(producer_base_cost * margin_percent, 0.0)
        producer_subtotal = producer_base_cost + producer_margin

        platform_commission = max(producer_subtotal * commission_rate, 0.0)

        denom = (1.0 - provider_fee_rate) if provider_fee_rate < 1.0 else 1.0
        amount_before_fee = producer_subtotal + platform_commission
        customer_total_calc = amount_before_fee / denom
        customer_total = max(customer_total_calc, min_order)

        payment_fee = customer_total * provider_fee_rate
        amount_after_fee = customer_total - payment_fee
        producer_earnings = max(amount_after_fee - platform_commission, 0.0)

        breakdown = {
            "material_cost": round(material_cost, 2),
            "time_cost": round(time_cost, 2),
            "support_cost": round(support_cost, 2),
            "fixed_cost": round(fixed_cost, 2),
            "producer_margin": round(producer_margin, 2),
            "producer_subtotal": round(producer_subtotal, 2),
            "platform_commission": round(platform_commission, 2),
            "payment_fee": round(payment_fee, 2),
            "customer_total": round(customer_total, 2)
        }

        return {
            "breakdown": breakdown,
            "producer_earnings": round(producer_earnings, 2),
            "platform_commission": round(platform_commission, 2),
            "payment_fee": round(payment_fee, 2),
            "customer_price": round(customer_total, 2)
        }

# ---------- APP FACTORY ----------
def create_app(config_object=Config):
    app = Flask(__name__)
    app.config.from_object(config_object)
    app.config['MAX_CONTENT_LENGTH'] = max(config_object.MAX_STL_SIZE, config_object.MAX_PHOTO_SIZE)
    app.config["JSON_AS_ASCII"] = False  # TR karakterler düzgün dönsün

    # CORS: Vite (5173) - env ile override edilebilir
    frontend_origins = os.environ.get(
        "FRONTEND_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")

    CORS(
        app,
        resources={r"/*": {"origins": frontend_origins}},
        supports_credentials=False  # cookie kullanırsan True + fetch'te credentials: 'include'
    )

    # HTTPS zorunluluğu (prod)
    @app.before_request
    def enforce_https():
        if app.config.get("REQUIRE_HTTPS"):
            proto = request.headers.get("X-Forwarded-Proto", "http")
            if not request.is_secure and proto != "https" and app.config.get("DEBUG") is not True:
                return jsonify({"error": "HTTPS required"}), 403

    # Firebase initialize
    try:
        if not firebase_admin._apps:
            cred_path = os.path.abspath(config_object.FIREBASE_CRED_PATH)
            if not os.path.exists(cred_path):
                raise FileNotFoundError(f"Firebase credentials not found: {cred_path}")
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred, {
                'storageBucket': config_object.BUCKET_NAME
            })
            logger.info("Firebase initialized.")
    except Exception as e:
        logger.error(f"Firebase init error: {e}")
        raise

    db = firestore.client()
    bucket = storage.bucket()
    socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

    app.db = db
    app.bucket = bucket
    app.socketio = socketio

    # Socket.IO session management
    socket_sessions = {}

    # ---------- DECORATORS ----------
    def require_auth(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            auth_header = request.headers.get("Authorization", "")
            uid = None
            user_doc = None

            # Prod: Bearer Firebase ID token
            if auth_header.startswith("Bearer "):
                id_token = auth_header.split(" ", 1)[1]
                try:
                    decoded = fb_auth.verify_id_token(id_token)
                except Exception:
                    return jsonify({"error": "Invalid token"}), 401
                uid = decoded.get("uid")
                user_doc = app.db.collection("users").document(uid).get()

                if not user_doc.exists:
                    # Auto-provision minimal doc
                    app.db.collection("users").document(uid).set({
                        "email": decoded.get("email"),
                        "name": decoded.get("name") or (decoded.get("email") or "").split("@")[0],
                        "role": "customer",
                        "created_at": now_iso(),
                        "last_login": now_iso(),
                        "kvkk_consent": False
                    })
                    user_doc = app.db.collection("users").document(uid).get()

            # Dev fallback: "Token <uid>"
            elif app.config.get("DEBUG") and auth_header.startswith("Token "):
                uid = auth_header.split(" ", 1)[1]
                user_doc = app.db.collection("users").document(uid).get()
                if not user_doc.exists:
                    return jsonify({"error": "User not found"}), 401
            else:
                return jsonify({"error": "Missing Authorization header"}), 401

            g.user = {"id": uid, **(user_doc.to_dict() or {})}
            return fn(*args, **kwargs)
        return wrapper

    def require_role(role):
        def decorator(fn):
            @wraps(fn)
            def wrapper(*args, **kwargs):
                if g.user.get('role') != role:
                    return jsonify({"error": f"{role} role required"}), 403
                return fn(*args, **kwargs)
            return wrapper
        return decorator

    # ---------- HELPERS ----------
    def get_user(user_id):
        doc = app.db.collection("users").document(user_id).get()
        if doc.exists:
            data = doc.to_dict()
            data['id'] = doc.id
            return data
        return None

    def get_order(order_id):
        doc = app.db.collection("orders").document(order_id).get()
        if doc.exists:
            data = doc.to_dict()
            data['id'] = doc.id
            return data
        return None

    def get_product(product_id):
        doc = app.db.collection("products").document(product_id).get()
        if doc.exists:
            data = doc.to_dict()
            data['id'] = doc.id
            return data
        return None

    def create_notification(user_id, type, title, order_id=None, body=None):
        notification_data = {
            "user_id": user_id,
            "type": type,
            "title": title,
            "body": body,
            "order_id": order_id,
            "is_read": False,
            "created_at": now_iso()
        }
        app.db.collection("notifications").add(notification_data)
        socketio.emit('notification', notification_data, room=f"user_{user_id}")

    # Storage signed URL
    def generate_signed_url(blob, ttl=None):
        from datetime import timedelta as _td
        ttl = ttl or app.config['STORAGE_SIGNED_URL_TTL']
        return blob.generate_signed_url(expiration=_td(seconds=ttl), method='GET')

    def upload_private_to_storage(file_path, storage_path):
        blob = app.bucket.blob(storage_path)
        blob.upload_from_filename(file_path)
        url = generate_signed_url(blob)
        return url, storage_path

    # ---------- STL ANALYZER ----------
    class STLAnalyzer:
        @staticmethod
        def _is_ascii_stl(file_path: str) -> bool:
            with open(file_path, 'rb') as f:
                start = f.read(512)
            try:
                start_txt = start.decode('utf-8', errors='ignore').lstrip()
            except Exception:
                return False
            return start_txt.startswith("solid")

        @staticmethod
        def analyze_stl_binary_streaming(file_path, preview_limit=100, triangle_limit=2_000_000):
            with open(file_path, "rb") as f:
                header = f.read(80)
                count_bytes = f.read(4)
                if len(count_bytes) < 4:
                    raise ValueError("Invalid STL file")
                count = struct.unpack("<I", count_bytes)[0]

                preview = []
                count_read = 0
                min_c = np.array([np.inf, np.inf, np.inf], dtype=np.float64)
                max_c = -min_c
                volume = 0.0
                surface_area = 0.0

                to_read = min(count, triangle_limit)
                for i in range(to_read):
                    rec = f.read(50)
                    if len(rec) < 50:
                        break
                    data = struct.unpack("<12fH", rec)
                    v1 = np.array(data[3:6], dtype=np.float64)
                    v2 = np.array(data[6:9], dtype=np.float64)
                    v3 = np.array(data[9:12], dtype=np.float64)

                    if len(preview) < preview_limit:
                        preview.append([v1.tolist(), v2.tolist(), v3.tolist()])

                    min_c = np.minimum(min_c, np.minimum(v1, np.minimum(v2, v3)))
                    max_c = np.maximum(max_c, np.maximum(v1, np.maximum(v2, v3)))
                    volume += np.dot(v1, np.cross(v2, v3)) / 6.0
                    surface_area += 0.5 * np.linalg.norm(np.cross(v2 - v1, v3 - v1))
                    count_read += 1

                dims = (max_c - min_c)
                return {
                    'triangle_count': int(count_read),
                    'dimensions_mm': dims.tolist() if np.all(np.isfinite(dims)) else [0, 0, 0],
                    'volume_mm3': float(abs(volume)),
                    'surface_area_mm2': float(surface_area),
                    'bounding_box_volume_mm3': float(np.prod(dims)) if np.all(np.isfinite(dims)) else 0.0,
                    'preview': preview
                }

        @staticmethod
        def analyze_model_geometry(file_path):
            if STLAnalyzer._is_ascii_stl(file_path):
                raise ValueError("ASCII STL şimdilik desteklenmiyor. Lütfen binary STL yükleyin.")
            return STLAnalyzer.analyze_stl_binary_streaming(file_path)

        @staticmethod
        def estimate_print_properties(analysis, material_density=1.24):
            if not analysis:
                return {}
            volume_cm3 = analysis.get('volume_mm3', 0) / 1000.0
            weight = volume_cm3 * material_density
            triangle_count = analysis.get('triangle_count', 0)
            complexity = min(triangle_count / 1000.0, 3.0)
            base_time = volume_cm3 * 2.0
            est_time = base_time + (base_time * 0.5 * complexity)
            difficulty = "Kolay" if complexity < 1 else "Orta" if complexity < 2 else "Zor"
            return {
                'estimated_weight_g': float(weight),
                'estimated_print_time_minutes': float(est_time),
                'print_difficulty': difficulty,
                'complexity_score': float(complexity)
            }

    def pin_file_to_pinata(file_path, filename):
        try:
            url = app.config['PINATA_BASE_URL']
            headers = {
                "pinata_api_key": app.config['PINATA_API_KEY'] or "",
                "pinata_secret_api_key": app.config['PINATA_SECRET_API_KEY'] or "",
            }
            if not headers["pinata_api_key"] or not headers["pinata_secret_api_key"]:
                logger.error("Pinata keys not configured.")
                return None, None
            with open(file_path, 'rb') as f:
                files = {'file': (filename, f, 'application/octet-stream')}
                response = requests.post(url, headers=headers, files=files, timeout=60)
                response.raise_for_status()
                pinata_response = response.json()
                ipfs_hash = pinata_response.get("IpfsHash")
                if ipfs_hash:
                    logger.info(f"File pinned to Pinata. IPFS Hash: {ipfs_hash}")
                    return ipfs_hash, pinata_response
                else:
                    logger.error(f"Invalid Pinata response: {pinata_response}")
                    return None, None
        except requests.exceptions.RequestException as e:
            logger.error(f"Pinata upload error: {e}")
            return None, None

    # ---------- ROUTES (PAGES) ----------
    @app.route("/")
    def index():
        return redirect(url_for('dashboard'))

    @app.route("/dashboard")
    def dashboard():
        return render_template('dashboard.html')

    @app.route("/upload")
    def upload_page():
        return render_template('upload.html')

    @app.route("/order/<order_id>")
    def order_detail_page(order_id):
        return render_template('order_detail.html', order_id=order_id)

    @app.route("/producer/pool")
    def producer_pool_page():
        return render_template('producer_pool.html')

    @app.route("/admin")
    def admin_dashboard():
        return render_template('admin_dashboard.html')

    # KVKK info pages (minimal HTML)
    @app.route("/kvkk/aydinlatma")
    def kvkk_aydinlatma_page():
        return """
        <html><head><meta charset="utf-8"><title>KVKK Aydınlatma Metni</title></head>
        <body style="font-family:Arial;max-width:800px;margin:20px auto;line-height:1.6;">
        <h1>KVKK Aydınlatma Metni</h1>
        <p>İşlenen veriler: ad-soyad, iletişim, adres, ödeme bilgisi (ödeme sağlayıcı üzerinden), STL dosyaları ve görseller; sipariş/mesaj verileri.</p>
        <p>Amaçlar: sipariş/üretim/kargo/faturalandırma/destek; güvenlik ve mevzuat yükümlülükleri.</p>
        <p>Aktarılanlar: üreticiler, kargo firmaları, ödeme ve e-arşiv sağlayıcıları.</p>
        <p>Saklama: sipariş ve fatura kayıtları mevzuat gereği 10 yıla kadar saklanabilir.</p>
        <p>Haklar: bilgi alma, düzeltme, silme, itiraz, veri taşınabilirliği (uygunsa).</p>
        </body></html>
        """

    @app.route("/kvkk/acik-riza")
    def kvkk_acik_riza_page():
        return """
        <html><head><meta charset="utf-8"><title>Açık Rıza Metni</title></head>
        <body style="font-family:Arial;max-width:800px;margin:20px auto;line-height:1.6;">
        <h1>Açık Rıza Metni</h1>
        <p>Yurt dışına veri aktarımı (örn. bulut altyapısı), opsiyonel pazarlama ve profil/analiz amaçlı işleme için açık rızanız talep edilebilir. Rızanızı dilediğiniz zaman geri çekebilirsiniz.</p>
        </body></html>
        """

    # ---------- API ENDPOINTS ----------
    @app.route("/api/health", methods=["GET"])
    def health_check():
        try:
            app.db.collection("health_check").limit(1).get()
            return jsonify({
                "status": "healthy",
                "timestamp": now_iso(),
                "services": {"database": "connected", "storage": "connected"}
            })
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return jsonify({"status": "unhealthy", "error": str(e)}), 500

    # Product detail (GUI/quote için)
    @app.route("/api/products/<product_id>", methods=["GET"])
    @require_auth
    def get_product_detail(product_id):
        prod = app.db.collection("products").document(product_id).get()
        if not prod.exists:
            return jsonify({"error": "Product not found"}), 404
        data = prod.to_dict()
        data["id"] = prod.id
        return jsonify(data)

    # Pricing quote
    @app.route("/api/pricing/quote", methods=["POST"])
    @require_auth
    def pricing_quote():
        data = request.get_json() or {}
        product_id = data.get("product_id")
        material_id = data.get("material_id")
        if not product_id or not material_id:
            return jsonify({"error": "product_id and material_id required"}), 400

        prod_doc = app.db.collection("products").document(product_id).get()
        if not prod_doc.exists:
            return jsonify({"error": "Product not found"}), 404
        product = prod_doc.to_dict()

        mat_doc = app.db.collection("materials").document(material_id).get()
        if not mat_doc.exists:
            return jsonify({"error": "Material not found"}), 404
        material = mat_doc.to_dict()

        params = {
            "material_price_per_g": material["price_per_gram"],
            "infill_density": float(data.get("infill_density", 0.2)),
            "support_required": bool(data.get("support_required", False)),
            "hourly_rate": float(data.get("hourly_rate", 5.0)),
            "fixed_cost": float(data.get("fixed_cost", 1.0)),
            "margin_percent": float(data.get("margin_percent", 0.20)),
            "commission_rate": float(data.get("commission_rate", Config.DEFAULT_COMMISSION_RATE)),
            "provider_fee_rate": float(data.get("provider_fee_rate", 0.025)),
            "min_order_amount": float(data.get("min_order_amount", 10.0)),
        }
        pricing = PricingEngine.calculate_price(product.get("analysis", {}), params)
        return jsonify({"pricing": pricing, "params": params})

    # ---------- LOGIN (API) ----------
    @app.route("/api/login", methods=["POST", "OPTIONS"])
    def api_login():
        # Preflight
        if request.method == "OPTIONS":
            return ("", 204)

        data = request.get_json(silent=True) or {}
        auth_header = request.headers.get("Authorization", "")

        # 1) PROD yolu: Bearer id_token
        id_token = data.get("id_token")
        if auth_header.startswith("Bearer "):
            id_token = auth_header.split(" ", 1)[1]

        if id_token:
            try:
                decoded = fb_auth.verify_id_token(id_token)
            except Exception as e:
                logger.warning(f"verify_id_token failed: {e}")
                return jsonify({"success": False, "error": "Invalid id_token"}), 401

            uid = decoded.get("uid")
            email = decoded.get("email")
            name = decoded.get("name") or (email or "").split("@")[0]
            user_ref = app.db.collection("users").document(uid)
            user_doc = user_ref.get()
            created = False

            if not user_doc.exists:
                if not data.get("kvkk_consent"):
                    return jsonify({"success": False, "error": "KVKK onayı gerekli"}), 400
                user_ref.set({
                    "email": email,
                    "name": name,
                    "role": "customer",
                    "created_at": now_iso(),
                    "last_login": now_iso(),
                    "kvkk_consent": True,
                    "kvkk_consent_date": now_iso()
                })
                created = True
            else:
                updates = {"last_login": now_iso()}
                current = user_doc.to_dict() or {}
                if data.get("kvkk_consent") is True and not current.get("kvkk_consent"):
                    updates.update({
                        "kvkk_consent": True,
                        "kvkk_consent_date": now_iso()
                    })
                user_ref.update(updates)

            user = user_ref.get().to_dict()
            return jsonify({
                "success": True,
                "token": f"Bearer {id_token}",
                "user": {"id": uid, **user},
                "created": created
            }), 201 if created else 200

        # 2) DEV yolu: email + password (DEBUG=True iken)
        if app.config.get("DEBUG"):
            email = (data.get("email") or "").strip().lower()
            password = data.get("password") or ""

            # email + password geldiyse in-memory doğrulama (örnek)
            if email and password:
                DEV_USERS = {
                    "demo@example.com": {"password": "demo1234", "name": "Demo Kullanıcı"},
                    "test@site.com": {"password": "test123", "name": "Test Kullanıcı"},
                }
                u = DEV_USERS.get(email)
                if not u or u["password"] != password:
                    return jsonify({"success": False, "error": "Geçersiz email veya şifre."}), 401

                # Firestore'da upsert et
                existing = list(app.db.collection("users").where("email", "==", email).limit(1).stream())
                if existing:
                    uid = existing[0].id
                    user_data = existing[0].to_dict() or {}
                    app.db.collection("users").document(uid).update({"last_login": now_iso()})
                else:
                    uid = str(uuid.uuid4())
                    user_data = {
                        "email": email,
                        "name": u["name"],
                        "role": "customer",
                        "created_at": now_iso(),
                        "last_login": now_iso(),
                        "kvkk_consent": True,
                        "kvkk_consent_date": now_iso()
                    }
                    app.db.collection("users").document(uid).set(user_data)

                return jsonify({
                    "success": True,
                    "token": f"Token {uid}",
                    "user": {"id": uid, **user_data}
                }), 200

            # DEV fallback: sadece email ile giriş (ilk seferde KVKK şart)
            if not email:
                return jsonify({"success": False, "error": "email, password veya id_token gerekli"}), 400

            name = data.get("name", email.split("@")[0])
            user_query = app.db.collection("users").where("email", "==", email).limit(1).stream()
            user_doc = next(user_query, None)

            if user_doc:
                uid = user_doc.id
                user_data = user_doc.to_dict()
                app.db.collection("users").document(uid).update({"last_login": now_iso()})
                if data.get("kvkk_consent") is True and not user_data.get("kvkk_consent"):
                    app.db.collection("users").document(uid).update({
                        "kvkk_consent": True,
                        "kvkk_consent_date": now_iso()
                    })
                return jsonify({
                    "success": True,
                    "token": f"Token {uid}",
                    "user": {"id": uid, **user_data}
                }), 200

            if not data.get("kvkk_consent"):
                return jsonify({"success": False, "error": "KVKK onayı gerekli"}), 400

            uid = str(uuid.uuid4())
            user_data = {
                "email": email,
                "name": name,
                "role": "customer",
                "created_at": now_iso(),
                "last_login": now_iso(),
                "kvkk_consent": True,
                "kvkk_consent_date": now_iso()
            }
            app.db.collection("users").document(uid).set(user_data)

            logger.info(f"New user (DEV) created: {email}")
            return jsonify({
                "success": True,
                "token": f"Token {uid}",
                "user": {"id": uid, **user_data}
            }), 201

        # Prod ama id_token yoksa
        return jsonify({"success": False, "error": "id_token required"}), 400

    # /login alias
    @app.route("/login", methods=["POST", "OPTIONS"])
    def login_alias():
        return api_login()

    @app.route("/api/upload/stl", methods=["POST"])
    @require_auth
    def upload_stl_with_analysis():
        if "file" not in request.files:
            return jsonify({"error": "File required"}), 400
        file = request.files["file"]
        if not file.filename:
            return jsonify({"error": "No file selected"}), 400
        if not Path(file.filename).suffix.lower() in app.config['ALLOWED_STL']:
            return jsonify({"error": "Invalid file type, only STL allowed"}), 400

        file.stream.seek(0, 2)
        size = file.stream.tell()
        file.stream.seek(0)
        if size > app.config['MAX_STL_SIZE'] or size == 0:
            return jsonify({"error": "File too large or empty"}), 400

        temp_path = None
        try:
            temp_filename = f"temp_{uuid.uuid4().hex}_{secure_filename(file.filename)}"
            temp_path = get_temp_path(temp_filename)
            with open(temp_path, 'wb') as temp_file:
                temp_file.write(file.stream.read())

            # STL analizi (streaming) + ASCII reddi
            try:
                geometry = STLAnalyzer.analyze_model_geometry(temp_path)
            except ValueError as ve:
                return jsonify({"error": str(ve)}), 400
            except Exception as e:
                logger.error(f"STL parse error: {e}")
                return jsonify({"error": "Invalid STL file"}), 400

            print_props = STLAnalyzer.estimate_print_properties(geometry)

            # Pinata
            ipfs_hash, pinata_resp = pin_file_to_pinata(temp_path, secure_filename(file.filename))
            if not ipfs_hash:
                return jsonify({"error": "File upload to IPFS failed"}), 502

            analysis_result = {
                **{k: v for k, v in geometry.items() if k != 'preview'},
                **print_props,
                'file_size': size,
                'analysis_timestamp': now_iso()
            }

            meta = request.form.to_dict() if request.form else (request.get_json(silent=True) or {})

            product_data = {
                "owner_id": g.user['id'],
                "title": meta.get("title", file.filename),
                "description": meta.get("description", ""),
                "file_ipfs_hash": ipfs_hash,
                "original_filename": file.filename,
                "analysis": analysis_result,
                "created_at": now_iso(),
                "status": "active"
            }
            product_ref, _ = app.db.collection("products").add(product_data)
            product_id = product_ref.id

            tr_log(
                kullanici_adi=g.user.get('name'),
                uretici_adi=None,
                fiyat_try_val=None,
                pinata_url=pinata_url_from_hash(ipfs_hash),
                extra={"event":"stl_upload", "user_id": g.user['id'], "product_title": product_data["title"]}
            )

            result = {
                "product_id": product_id,
                "filename": file.filename,
                "size": size,
                "analysis": analysis_result,
                "triangles_preview": geometry.get('preview', []),
                "ipfs_hash": ipfs_hash,
                "pinata_response": pinata_resp
            }

            logger.info(f"STL uploaded and analyzed by user {g.user['id']}")
            return jsonify(result)

        except Exception as e:
            logger.error(f"STL upload/analysis error: {e}")
            return jsonify({"error": "Upload and analysis failed"}), 500

        finally:
            if temp_path and os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except Exception as ex:
                    logger.warning(f"Failed to delete temp file {temp_path}: {ex}")

    @app.route("/api/materials", methods=["GET"])
    def get_materials():
        try:
            docs = list(app.db.collection("materials").stream())
            materials = []
            for doc in docs:
                data = doc.to_dict()
                data["id"] = doc.id
                materials.append(data)

            if not materials:
                default_materials = [
                    {"name": "PLA", "price_per_gram": 0.02, "density": 1.24, "description": "Kolay yazdırılabilir, biyolojik olarak çözünür"},
                    {"name": "ABS", "price_per_gram": 0.025, "density": 1.04, "description": "Güçlü ve dayanıklı"},
                    {"name": "PETG", "price_per_gram": 0.03, "density": 1.27, "description": "Kimyasallara dayanıklı, şeffaf"},
                    {"name": "TPU", "price_per_gram": 0.04, "density": 1.21, "description": "Esnek malzeme"},
                    {"name": "Nylon", "price_per_gram": 0.05, "density": 1.14, "description": "Yüksek dayanıklılık"}
                ]
                for mat in default_materials:
                    doc_ref = app.db.collection("materials").document()
                    doc_ref.set({**mat, "active": True, "created_at": now_iso()})
                    mat["id"] = doc_ref.id
                    materials.append(mat)
            return jsonify({"materials": materials, "count": len(materials)})

        except Exception as e:
            logger.error(f"Material list error: {e}")
            return jsonify({"error": "Failed to get materials"}), 500

    @app.route("/api/orders/create", methods=["POST"])
    @require_auth
    def create_order():
        try:
            data = request.get_json() or {}
            required_fields = ["product_id", "material_id", "infill_density", "layer_height_mm"]
            for field in required_fields:
                if field not in data:
                    return jsonify({"error": f"{field} is required"}), 400

            product = get_product(data["product_id"])
            if not product:
                return jsonify({"error": "Product not found"}), 404

            material_doc = app.db.collection("materials").document(data["material_id"]).get()
            if not material_doc.exists:
                return jsonify({"error": "Material not found"}), 404
            material = material_doc.to_dict()

            pricing_params = {
                "material_price_per_g": material["price_per_gram"],
                "infill_density": data["infill_density"],
                "support_required": data.get("support_required", False),
                "hourly_rate": float(data.get("hourly_rate", 5.0)),
                "fixed_cost": float(data.get("fixed_cost", 1.0)),
                "margin_percent": float(data.get("margin_percent", 0.20)),
                "commission_rate": Config.DEFAULT_COMMISSION_RATE,
                "provider_fee_rate": float(data.get("provider_fee_rate", 0.025)),
                "min_order_amount": float(data.get("min_order_amount", 10.0))
            }
            pricing = PricingEngine.calculate_price(product.get("analysis", {}), pricing_params)

            order_data = {
                "product_id": data["product_id"],
                "customer_id": g.user["id"],
                "producer_id": None,
                "status": "pending",
                "material_id": data["material_id"],
                "material_name": material["name"],
                "infill_density": data["infill_density"],
                "layer_height_mm": data["layer_height_mm"],
                "support_required": data.get("support_required", False),
                "color": data.get("color", "default"),
                "notes": data.get("notes", ""),
                "auto_price": pricing["customer_price"],
                "final_price": pricing["customer_price"],
                "producer_earnings": pricing["producer_earnings"],
                "commission_amount": pricing["platform_commission"],
                "payment_provider": "papara",
                "payment_fee": pricing["payment_fee"],
                "pricing_breakdown": pricing["breakdown"],
                "payment_status": "unpaid",
                "created_at": now_iso(),
                "updated_at": now_iso()
            }

            order_ref, _ = app.db.collection("orders").add(order_data)
            order_id = order_ref.id

            tr_log(
                kullanici_adi=g.user.get('name'),
                uretici_adi=None,
                fiyat_try_val=order_data["final_price"],
                pinata_url=pinata_url_from_hash(product.get("file_ipfs_hash")),
                extra={"event":"order_created", "order_id": order_id, "product_id": data["product_id"]}
            )

            producers = app.db.collection("users").where("role", "==", "producer").stream()
            for producer_doc in producers:
                producer = producer_doc.to_dict()
                if can_producer_handle_order(producer, product, order_data):
                    create_notification(producer_doc.id, "new_order_in_pool", "Yeni sipariş havuzda", order_id)

            return jsonify({
                "order_id": order_id,
                "status": "pending",
                "pricing": pricing
            }), 201

        except Exception as e:
            logger.error(f"Order creation error: {e}")
            return jsonify({"error": "Failed to create order"}), 500

    def can_producer_handle_order(producer, product, order):
        if order["material_name"] not in producer.get("materials_supported", []):
            return False

        printers = producer.get("printers", [])
        if not printers:
            return True  # printer belirtilmemişse varsayılan kabul

        dimensions = product.get("analysis", {}).get("dimensions_mm", [0, 0, 0])
        for printer in printers:
            max_xyz = printer.get("max_xyz", [200, 200, 200])  # default hacim
            if all(d <= m for d, m in zip(dimensions, max_xyz)):
                return True
        return False

    # Adres set etme (müşteri)
    @app.route("/api/orders/<order_id>/shipping/info", methods=["POST"])
    @require_auth
    def set_shipping_info(order_id):
        order = get_order(order_id)
        if not order:
            return jsonify({"error": "Order not found"}), 404
        if order['customer_id'] != g.user['id'] and g.user.get('role') != 'admin':
            return jsonify({"error": "Unauthorized"}), 403
        data = request.get_json() or {}
        app.db.collection("orders").document(order_id).update({
            "shipping_address": data.get("address", {}),
            "shipping_method": data.get("method", "MANUAL"),
            "shipping_fee_try": float(data.get("fee_try", 0.0)),
            "updated_at": now_iso()
        })
        return jsonify({"success": True})

    # Üretici takip no
    @app.route("/api/orders/<order_id>/shipping/tracking", methods=["POST"])
    @require_auth
    @require_role("producer")
    def set_tracking_number(order_id):
        order = get_order(order_id)
        if not order:
            return jsonify({"error": "Order not found"}), 404
        # Yetki: sadece bu siparişin üreticisi ya da admin
        if order.get('producer_id') != g.user['id'] and g.user.get('role') != 'admin':
            return jsonify({"error": "Unauthorized"}), 403
        data = request.get_json() or {}
        app.db.collection("orders").document(order_id).update({
            "tracking_number": data.get("tracking_number"),
            "carrier": data.get("carrier", "MANUAL"),
            "shipping_status": "shipped",
            "shipped_at": now_iso(),
            "updated_at": now_iso()
        })
        create_notification(order['customer_id'], "shipping_update", "Kargo çıkışı yapıldı", order_id)
        return jsonify({"success": True})

    @app.route("/api/producer/pool", methods=["GET"])
    @require_auth
    @require_role("producer")
    def get_producer_pool():
        try:
            producer = g.user
            query = app.db.collection("orders").where("status", "==", "pending")
            orders = []
            for doc in query.stream():
                order = doc.to_dict()
                order['id'] = doc.id
                product = get_product(order['product_id'])
                if product and can_producer_handle_order(producer, product, order):
                    order['product'] = product
                    orders.append(order)

            return jsonify({
                "orders": orders,
                "count": len(orders),
                "producer_stats": {
                    "success_rate": producer.get("success_rate", 0),
                    "total_orders": producer.get("total_orders", 0)
                }
            })
        except Exception as e:
            logger.error(f"Producer pool error: {e}")
            return jsonify({"error": "Failed to get pool"}), 500

    @app.route("/api/orders/<order_id>/accept", methods=["POST"])
    @require_auth
    @require_role("producer")
    def accept_order(order_id):
        try:
            data = request.get_json() or {}

            # 1) Önce state'i kabul et (yarış koşulunu engeller)
            order_before = OrderStateMachine.transition(app.db, order_id, "accepted", g.user['id'], data.get('notes'))

            # 2) Producer bağla
            app.db.collection("orders").document(order_id).update({
                "producer_id": g.user['id'],
                "delivery_eta_days": data.get('delivery_eta_days', 3),
                "producer_notes": data.get('notes', ''),
                "accepted_at": now_iso()
            })

            # 3) Sonra ödeme linkini oluştur ve kaydet
            payment_result = create_payment_link(order_id)
            payment_url = payment_result.get("payment_url")
            if not payment_url:
                raise Exception("Payment link creation failed")

            app.db.collection("orders").document(order_id).update({
                "payment_link": payment_url,
                "payment_expires_at": (datetime.utcnow() + timedelta(hours=24)).isoformat()
            })

            # Audit
            prod = get_product(order_before["product_id"]) if order_before.get("product_id") else None
            customer = get_user(order_before['customer_id']) if order_before.get('customer_id') else None
            tr_log(
                kullanici_adi=customer.get('name') if customer else None,
                uretici_adi=g.user.get('name'),
                fiyat_try_val=order_before.get("final_price"),
                pinata_url=pinata_url_from_hash(prod.get("file_ipfs_hash")) if prod else None,
                extra={"event":"order_accepted", "order_id": order_id}
            )

            create_notification(order_before['customer_id'], "order_accepted", "Siparişiniz kabul edildi", order_id, f"Tahmini teslim: {data.get('delivery_eta_days', 3)} gün")
            return jsonify({"success": True, "payment_link": payment_url})
        except Exception as e:
            logger.error(f"Accept order failed: {e}")
            return jsonify({"error": "Order acceptance failed"}), 500

    @app.route("/api/orders/<order_id>/reject", methods=["POST"])
    @require_auth
    @require_role("producer")
    def reject_order(order_id):
        try:
            data = request.get_json() or {}
            reason = data.get('reason', 'Üretici tarafından reddedildi')
            OrderStateMachine.transition(app.db, order_id, "rejected", g.user['id'], reason)
            order = get_order(order_id)
            create_notification(order['customer_id'], "order_rejected", "Siparişiniz reddedildi", order_id, reason)
            return jsonify({"success": True})
        except Exception as e:
            logger.error(f"Order reject error: {e}")
            return jsonify({"error": str(e)}), 400

    @app.route("/api/orders/<order_id>", methods=["GET"])
    @require_auth
    def get_order_detail(order_id):
        try:
            order = get_order(order_id)
            if not order:
                return jsonify({"error": "Order not found"}), 404

            user_id = g.user['id']
            user_role = g.user.get('role')
            is_customer = (user_id == order.get('customer_id'))
            is_producer = (order.get('producer_id') is not None and user_id == order.get('producer_id'))
            is_admin = (user_role == 'admin')
            if not (is_customer or is_producer or is_admin):
                return jsonify({"error": "Unauthorized"}), 403

            order['product'] = get_product(order['product_id'])
            order['customer'] = get_user(order['customer_id'])
            if order.get('producer_id'):
                order['producer'] = get_user(order['producer_id'])

            photos = []
            photo_docs = app.db.collection("photos").where("order_id", "==", order_id).stream()
            for doc in photo_docs:
                photo = doc.to_dict()
                photo['id'] = doc.id
                # Her getirilişte signed URL tazele
                try:
                    if photo.get("storage_path"):
                        photo["url"] = generate_signed_url(app.bucket.blob(photo["storage_path"]))
                    if photo.get("thumbnail_storage_path"):
                        photo["thumbnail_url"] = generate_signed_url(app.bucket.blob(photo["thumbnail_storage_path"]))
                except Exception:
                    pass
                photos.append(photo)
            order['photos'] = photos

            message_count = len(list(app.db.collection("messages").where("order_id", "==", order_id).limit(1).stream()))
            order['has_messages'] = message_count > 0

            history = []
            history_docs = app.db.collection("order_state_history").where("order_id", "==", order_id).order_by("created_at").stream()
            for doc in history_docs:
                history.append(doc.to_dict())
            order['state_history'] = history

            return jsonify(order)

        except Exception as e:
            logger.error(f"Get order detail error: {e}")
            return jsonify({"error": "Failed to get order"}), 500

    @app.route("/api/orders/<order_id>/photos", methods=["POST"])
    @require_auth
    def upload_order_photo(order_id):
        order = get_order(order_id)
        if not order:
            return jsonify({"error": "Order not found"}), 404

        if g.user['id'] not in [order['customer_id'], order.get('producer_id')] and g.user.get('role') != 'admin':
            return jsonify({"error": "Unauthorized"}), 403

        photo_type = request.form.get('type')
        if photo_type not in ['before', 'after', 'evidence']:
            return jsonify({"error": "Invalid photo type"}), 400

        if photo_type == 'before' and order['status'] not in ['paid', 'in_production']:
            return jsonify({"error": "Before photo requires paid or in_production status"}), 400
        if photo_type == 'after' and order['status'] not in ['paid', 'in_production', 'completed_by_producer']:
            return jsonify({"error": "After photo requires paid/in_production/completed_by_producer status"}), 400

        file = request.files.get('photo')
        if not file:
            return jsonify({"error": "Photo required"}), 400
        if not Path(file.filename).suffix.lower() in app.config['ALLOWED_IMAGES']:
            return jsonify({"error": "Invalid file type"}), 400

        file.stream.seek(0, 2)
        size = file.stream.tell()
        file.stream.seek(0)
        if size > app.config['MAX_PHOTO_SIZE']:
            return jsonify({"error": "Photo too large"}), 400

        filename = secure_filename(f"{order_id}_{photo_type}_{uuid.uuid4().hex}.jpg")
        temp_path = get_temp_path(filename)
        thumb_path = None

        try:
            file.save(temp_path)
            try:
                img = Image.open(temp_path)
                img.verify()  # quick verify
            except (UnidentifiedImageError, Image.DecompressionBombError) as e:
                return jsonify({"error": "Invalid or unsafe image"}), 400

            img = Image.open(temp_path).convert('RGB')  # re-open after verify()

            # thumbnail
            thumb = img.copy()
            thumb.thumbnail((300, 300))
            thumb_path = temp_path.replace('.jpg', '_thumb.jpg')
            thumb.save(thumb_path, 'JPEG', quality=85)

            # resize large
            if img.width > 1920 or img.height > 1920:
                img.thumbnail((1920, 1920))
            img.save(temp_path, 'JPEG', quality=90)

            photo_url, photo_storage_path = upload_private_to_storage(temp_path, f"photos/{order_id}/{filename}")
            thumb_url, thumb_storage_path = upload_private_to_storage(thumb_path, f"photos/{order_id}/thumbs/{filename}")

            photo_data = {
                "order_id": order_id,
                "uploader_id": g.user['id'],
                "type": photo_type,
                "storage_path": photo_storage_path,
                "thumbnail_storage_path": thumb_storage_path,
                "caption": request.form.get('caption', ''),
                "uploaded_at": now_iso(),
                "archived": False
            }

            photo_ref, _ = app.db.collection("photos").add(photo_data)

            if photo_type == 'before' and order['status'] == 'paid':
                OrderStateMachine.transition(app.db, order_id, 'in_production', g.user['id'])

            notify_user_id = order['customer_id'] if g.user['id'] == order.get('producer_id') else order.get('producer_id')
            if notify_user_id:
                create_notification(notify_user_id, "new_photo", f"Siparişinize yeni {photo_type} fotoğrafı eklendi", order_id)

            return jsonify({
                "success": True,
                "photo_id": photo_ref.id,
                "url": photo_url,
                "thumbnail_url": thumb_url
            })

        except Exception as e:
            logger.error(f"Photo upload error: {e}")
            return jsonify({"error": "Photo upload failed"}), 500

        finally:
            for path in [temp_path, thumb_path]:
                if path and os.path.exists(path):
                    try:
                        os.remove(path)
                    except:
                        pass

    @app.route("/api/orders/<order_id>/complete", methods=["POST"])
    @require_auth
    @require_role("producer")
    def complete_production(order_id):
        try:
            order = get_order(order_id)
            if not order:
                return jsonify({"error": "Order not found"}), 404
            if order.get('producer_id') != g.user['id']:
                return jsonify({"error": "Unauthorized"}), 403

            after_photos = app.db.collection("photos").where("order_id", "==", order_id).where("type", "==", "after").limit(1).stream()
            if not list(after_photos):
                return jsonify({"error": "After photo required"}), 400

            OrderStateMachine.transition(app.db, order_id, "completed_by_producer", g.user['id'])
            create_notification(order['customer_id'], "production_completed", "Siparişiniz tamamlandı", order_id, "Lütfen teslimi onaylayın")
            return jsonify({"success": True})
        except Exception as e:
            logger.error(f"Complete production error: {e}")
            return jsonify({"error": str(e)}), 400

    @app.route("/api/orders/<order_id>/confirm", methods=["POST"])
    @require_auth
    def confirm_delivery(order_id):
        try:
            data = request.get_json() or {}
            user_id = g.user['id']

            @firestore.transactional
            def confirm_delivery_transaction(transaction):
                order_ref = app.db.collection("orders").document(order_id)
                order_snap = transaction.get(order_ref)
                if not order_snap.exists:
                    raise ValueError("Order not found")
                order = order_snap.to_dict()

                if order['customer_id'] != user_id:
                    raise ValueError("Unauthorized")

                updates = {
                    "status": "confirmed",
                    "updated_at": now_iso(),
                    "confirmed_at": now_iso(),
                    "confirmed_by": user_id
                }
                if 'rating' in data:
                    updates.update({
                        "rating": data['rating'],
                        "review_text": data.get('review_text', ''),
                        "reviewed_at": now_iso()
                    })
                transaction.update(order_ref, updates)

                # Payout hesapla (refund düş)
                refunds = list(app.db.collection("refunds").where("order_id", "==", order_id).stream())
                total_refunded = 0.0
                for r in refunds:
                    try:
                        total_refunded += float(r.to_dict().get('amount', 0) or 0)
                    except:
                        pass
                net_customer_payment = max(float(order.get('final_price', 0.0)) - total_refunded, 0.0)
                commission = net_customer_payment * Config.DEFAULT_COMMISSION_RATE
                producer_amount = max(net_customer_payment - commission, 0.0)

                payout_ref = app.db.collection("payouts").document()
                transaction.set(payout_ref, {
                    "order_id": order_id,
                    "producer_id": order.get('producer_id'),
                    "amount": round(producer_amount, 2),
                    "commission_amount": round(commission, 2),
                    "refund_deduction": round(total_refunded, 2),
                    "status": "scheduled",
                    "scheduled_date": (datetime.utcnow() + timedelta(days=3)).isoformat(),
                    "created_at": now_iso()
                })

                # Producer stats
                if order.get('producer_id'):
                    prod_ref = app.db.collection("users").document(order['producer_id'])
                    prod_snap = transaction.get(prod_ref)
                    if prod_snap.exists:
                        prod = prod_snap.to_dict() or {}
                        transaction.update(prod_ref, {
                            "completed_orders": int(prod.get("completed_orders", 0)) + 1,
                            "total_orders": int(prod.get("total_orders", 0))
                        })

                return order

            order = confirm_delivery_transaction(app.db.transaction())

            if 'producer_id' in order and order['producer_id']:
                create_notification(order['producer_id'], "order_confirmed", "Sipariş onaylandı", order_id, "Ödemeniz planlandı")

            return jsonify({"success": True})

        except Exception as e:
            logger.error(f"Confirm delivery error: {e}")
            return jsonify({"error": str(e)}), 400

    @app.route("/api/orders/<order_id>/dispute", methods=["POST"])
    @require_auth
    def open_dispute(order_id):
        try:
            order = get_order(order_id)
            if not order:
                return jsonify({"error": "Order not found"}), 404
            if order['customer_id'] != g.user['id']:
                return jsonify({"error": "Unauthorized"}), 403

            data = request.get_json()
            if not data or 'reason' not in data:
                return jsonify({"error": "Dispute reason required"}), 400

            valid_states = ['completed_by_producer', 'confirmed']
            if order.get('status') not in valid_states:
                return jsonify({"error": f"Cannot dispute order in {order.get('status')} state"}), 400

            ts = order.get('confirmed_at') or order.get('completed_by_producer_at')
            dt = parse_iso(ts)
            if dt:
                if (datetime.utcnow() - dt.replace(tzinfo=None)).days > 7:
                    return jsonify({"error": "Dispute period expired"}), 400

            OrderStateMachine.transition(app.db, order_id, "dispute_open", g.user['id'], data['reason'])
            app.db.collection("orders").document(order_id).update({
                "dispute_reason": data['reason'],
                "dispute_details": data.get('details', ''),
                "dispute_opened_at": now_iso()
            })

            admins = app.db.collection("users").where("role", "==", "admin").stream()
            for admin_doc in admins:
                create_notification(admin_doc.id, "dispute_opened", f"Yeni uyuşmazlık: {order_id[:8]}", order_id)

            return jsonify({"success": True})

        except Exception as e:
            logger.error(f"Open dispute error: {e}")
            return jsonify({"error": str(e)}), 400

    # IPFS görüntüleme audit
    @app.route("/api/ipfs/view", methods=["POST"])
    @require_auth
    def audit_ipfs_view():
        data = request.get_json() or {}
        ipfs_hash = data.get("ipfs_hash")
        product_id = data.get("product_id")
        if not ipfs_hash:
            return jsonify({"error": "ipfs_hash required"}), 400
        tr_log(
            kullanici_adi=g.user.get('name'),
            uretici_adi=None,
            fiyat_try_val=None,
            pinata_url=pinata_url_from_hash(ipfs_hash),
            extra={"event":"pinata_stl_goruntuleme", "user_id": g.user['id'], "product_id": product_id}
        )
        return jsonify({"success": True})

    # ---------- PAYMENT ----------
    def create_payment_link(order_id):
        order = get_order(order_id)
        payment_data = {
            "order_id": order_id,
            "amount": order['final_price'],
            "provider": "demo",
            "payment_link": f"/api/payment/demo/{order_id}",
            "expires_at": (datetime.utcnow() + timedelta(hours=24)).isoformat(),
            "created_at": now_iso()
        }
        app.db.collection("payments").add(payment_data)
        return {"payment_url": payment_data["payment_link"]}

    @app.route("/api/payment/demo/<order_id>", methods=["GET", "POST"])
    def demo_payment(order_id):
        if request.method == "GET":
            order = get_order(order_id)
            if not order:
                return "Order not found", 404
            return f"""
            <html>
            <head><meta charset="utf-8"><title>Ödeme Demo</title></head>
            <body style="font-family: Arial; padding: 20px;">
                <h2>Demo Ödeme Sayfası</h2>
                <p>Sipariş: {order_id}</p>
                <p>Tutar: {format_try(order['final_price'])}</p>
                <form method="POST">
                    <button type="submit" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; cursor: pointer;">
                        Ödemeyi Tamamla
                    </button>
                </form>
            </body>
            </html>
            """
        else:
            try:
                OrderStateMachine.transition(app.db, order_id, "paid", "system")
                app.db.collection("orders").document(order_id).update({
                    "payment_status": "paid",
                    "paid_at": now_iso()
                })
                order = get_order(order_id)
                # Audit: order paid
                producer = get_user(order.get('producer_id')) if order else None
                product = get_product(order.get('product_id')) if order else None
                customer = get_user(order.get('customer_id')) if order else None
                tr_log(
                    kullanici_adi=customer.get('name') if customer else None,
                    uretici_adi=producer.get('name') if producer else None,
                    fiyat_try_val=order.get('final_price') if order else None,
                    pinata_url=pinata_url_from_hash(product.get('file_ipfs_hash')) if product else None,
                    extra={"event":"order_paid", "order_id": order_id}
                )
                if order and order.get('producer_id'):
                    create_notification(order['producer_id'], "payment_received", "Ödeme alındı", order_id, "Üretime başlayabilirsiniz")
                return redirect(f"/order/{order_id}?payment=success")
            except Exception as e:
                logger.error(f"Demo payment error: {e}")
                return "Payment failed", 400

    @app.route("/api/payment/callback", methods=["POST"])
    def payment_callback():
        data = request.get_json() or {}
        logger.info(f"Payment callback: {data}")
        order_id = data.get("order_id")
        status = data.get("status")
        if status == "success" and order_id:
            try:
                OrderStateMachine.transition(app.db, order_id, "paid", "system")
                app.db.collection("orders").document(order_id).update({
                    "payment_status": "paid",
                    "paid_at": now_iso()
                })
            except Exception as e:
                logger.error(f"Payment callback transition error: {e}")
        return jsonify({"success": True})

    def schedule_payout(order_id):
        order = get_order(order_id)
        if not order:
            return
        refunds = list(app.db.collection("refunds").where("order_id", "==", order_id).stream())
        total_refunded = 0.0
        for r in refunds:
            try:
                total_refunded += float(r.to_dict().get('amount', 0) or 0)
            except:
                pass
        net_customer_payment = max(float(order.get('final_price', 0.0)) - total_refunded, 0.0)
        commission = net_customer_payment * Config.DEFAULT_COMMISSION_RATE
        producer_amount = max(net_customer_payment - commission, 0.0)
        payout_data = {
            "order_id": order_id,
            "producer_id": order.get('producer_id'),
            "amount": round(producer_amount, 2),
            "original_amount": float(order.get('producer_earnings', 0.0)),
            "refund_deduction": round(total_refunded, 2),
            "commission_amount": round(commission, 2),
            "status": "scheduled",
            "scheduled_date": (datetime.utcnow() + timedelta(days=3)).isoformat(),
            "created_at": now_iso()
        }
        app.db.collection("payouts").add(payout_data)

    def update_producer_stats(producer_id):
        orders = app.db.collection("orders").where("producer_id", "==", producer_id).stream()
        total = 0
        completed = 0
        ratings = []
        for order_doc in orders:
            order = order_doc.to_dict()
            total += 1
            if order.get('status') == 'confirmed':
                completed += 1
                if 'rating' in order:
                    ratings.append(order['rating'])
        success_rate = (completed / total * 100) if total > 0 else 0
        avg_rating = sum(ratings) / len(ratings) if ratings else 0
        app.db.collection("users").document(producer_id).update({
            "total_orders": total,
            "completed_orders": completed,
            "success_rate": success_rate,
            "average_rating": avg_rating
        })

    # ---------- MESSAGES ----------
    @app.route("/api/orders/<order_id>/messages", methods=["GET"])
    @require_auth
    def get_messages(order_id):
        order = get_order(order_id)
        if not order:
            return jsonify({"error": "Order not found"}), 404
        if g.user['id'] not in [order['customer_id'], order.get('producer_id')] and g.user.get('role') != 'admin':
            return jsonify({"error": "Unauthorized"}), 403

        messages = []
        message_docs = app.db.collection("messages").where("order_id", "==", order_id).order_by("created_at").stream()
        for doc in message_docs:
            msg = doc.to_dict()
            msg['id'] = doc.id
            msg['sender'] = get_user(msg['sender_id'])
            messages.append(msg)

        for msg in messages:
            if g.user['id'] not in msg.get('read_by', []):
                app.db.collection("messages").document(msg['id']).update({
                    "read_by": firestore.ArrayUnion([g.user['id']])
                })

        return jsonify({"messages": messages, "count": len(messages)})

    @app.route("/api/orders/<order_id>/messages", methods=["POST"])
    @require_auth
    def send_message(order_id):
        order = get_order(order_id)
        if not order:
            return jsonify({"error": "Order not found"}), 404
        if g.user['id'] not in [order['customer_id'], order.get('producer_id')] and g.user.get('role') != 'admin':
            return jsonify({"error": "Unauthorized"}), 403

        data = request.get_json()
        if not data or 'body' not in data:
            return jsonify({"error": "Message body required"}), 400

        message_data = {
            "order_id": order_id,
            "sender_id": g.user['id'],
            "body": data['body'],
            "attachments": data.get('attachments', []),
            "created_at": now_iso(),
            "read_by": [g.user['id']]
        }
        msg_ref, _ = app.db.collection("messages").add(message_data)
        message_data['id'] = msg_ref.id
        message_data['sender'] = g.user

        socketio.emit('new_message', message_data, room=f"order_{order_id}")

        recipients = [order['customer_id'], order.get('producer_id')]
        for recipient_id in recipients:
            if recipient_id and recipient_id != g.user['id']:
                body_preview = data['body'][:50] + "..." if len(data['body']) > 50 else data['body']
                create_notification(recipient_id, "new_message", "Yeni mesaj", order_id, body_preview)

        return jsonify(message_data), 201

    # ---------- ADMIN ENDPOINTS ----------
    @app.route("/api/admin/stats", methods=["GET"])
    @require_auth
    @require_role("admin")
    def get_admin_stats():
        try:
            days = int(request.args.get('days', 30))
            start_date = datetime.utcnow() - timedelta(days=days)

            all_orders_docs = list(app.db.collection("orders").stream())
            recent_orders = [
                o for o in all_orders_docs
                if o.to_dict().get('created_at', '') > start_date.isoformat()
            ]

            status_dist = {}
            total_revenue = 0.0
            total_commission = 0.0

            for order_doc in all_orders_docs:
                order = order_doc.to_dict()
                status = order.get('status', 'unknown')
                status_dist[status] = status_dist.get(status, 0) + 1
                if order.get('payment_status') == 'paid':
                    total_revenue += order.get('final_price', 0.0)
                    total_commission += order.get('commission_amount', 0.0)

            producers = []
            producer_docs = app.db.collection("users").where("role", "==", "producer").stream()
            for prod_doc in producer_docs:
                prod = prod_doc.to_dict()
                producers.append({
                    "id": prod_doc.id,
                    "name": prod.get('name'),
                    "email": prod.get('email'),
                    "total_orders": prod.get('total_orders', 0),
                    "success_rate": prod.get('success_rate', 0),
                    "average_rating": prod.get('average_rating', 0)
                })

            material_usage = {}
            for order_doc in all_orders_docs:
                order = order_doc.to_dict()
                material = order.get('material_name', 'Unknown')
                material_usage[material] = material_usage.get(material, 0) + 1

            return jsonify({
                "period_days": days,
                "total_orders": len(all_orders_docs),
                "recent_orders": len(recent_orders),
                "status_distribution": status_dist,
                "total_revenue": total_revenue,
                "total_commission": total_commission,
                "top_producers": sorted(producers, key=lambda x: x['total_orders'], reverse=True)[:10],
                "material_usage": material_usage,
                "disputes_open": status_dist.get('dispute_open', 0)
            })

        except Exception as e:
            logger.error(f"Admin stats error: {e}")
            return jsonify({"error": "Failed to get stats"}), 500

    @app.route("/api/admin/disputes", methods=["GET"])
    @require_auth
    @require_role("admin")
    def get_disputes():
        disputes = []
        dispute_orders = app.db.collection("orders").where("status", "==", "dispute_open").stream()
        for doc in dispute_orders:
            order = doc.to_dict()
            order['id'] = doc.id
            order['customer'] = get_user(order['customer_id'])
            order['producer'] = get_user(order['producer_id'])
            disputes.append(order)
        return jsonify({"disputes": disputes, "count": len(disputes)})

    @app.route("/api/admin/disputes/<order_id>/resolve", methods=["POST"])
    @require_auth
    @require_role("admin")
    def resolve_dispute(order_id):
        data = request.get_json() or {}
        resolution = data.get('resolution')  # confirmed, refunded, partial_refund
        if resolution not in ['confirmed', 'refunded', 'partial_refund']:
            return jsonify({"error": "Invalid resolution"}), 400
        try:
            OrderStateMachine.transition(app.db, order_id, resolution, g.user['id'], data.get('reason', ''))
            app.db.collection("orders").document(order_id).update({
                "dispute_resolution": resolution,
                "dispute_resolved_at": now_iso(),
                "dispute_resolved_by": g.user['id'],
                "dispute_resolution_notes": data.get('notes', '')
            })
            order = get_order(order_id)

            for user_id in [order['customer_id'], order['producer_id']]:
                create_notification(user_id, "dispute_resolved", f"Uyuşmazlık çözüldü: {resolution}", order_id)

            if resolution in ['refunded', 'partial_refund']:
                refund_amount = order['final_price'] if resolution == 'refunded' else data.get('refund_amount', 0)
                app.db.collection("refunds").add({
                    "order_id": order_id,
                    "amount": refund_amount,
                    "reason": data.get('reason', ''),
                    "status": "pending",
                    "created_at": now_iso()
                })

            return jsonify({"success": True})

        except Exception as e:
            logger.error(f"Dispute resolution error: {e}")
            return jsonify({"error": str(e)}), 400

    # ---------- SOCKET.IO EVENTS ----------
    @socketio.on('connect')
    def handle_connect():
        logger.info(f"Client connected: {request.sid}")

    @socketio.on('disconnect')
    def handle_disconnect():
        logger.info(f"Client disconnected: {request.sid}")
        for user_id, sid in list(socket_sessions.items()):
            if sid == request.sid:
                del socket_sessions[user_id]
                break

    @socketio.on('authenticate')
    def handle_authenticate(data):
        token_raw = (data.get('token') or '')
        uid = None

        if token_raw.startswith("Bearer "):
            id_token = token_raw.split(" ", 1)[1]
            try:
                decoded = fb_auth.verify_id_token(id_token)
                uid = decoded.get("uid")
            except Exception:
                emit('authenticated', {'success': False})
                return
        elif app.config.get("DEBUG") and token_raw.startswith("Token "):
            uid = token_raw.split(" ", 1)[1]
        else:
            emit('authenticated', {'success': False})
            return

        user_doc = app.db.collection("users").document(uid).get()
        if user_doc.exists:
            socket_sessions[uid] = request.sid
            join_room(f"user_{uid}")
            emit('authenticated', {'success': True})
            unread_notifications = app.db.collection("notifications").where("user_id", "==", uid).where("is_read", "==", False).stream()
            for notif_doc in unread_notifications:
                notif = notif_doc.to_dict()
                notif['id'] = notif_doc.id
                emit('notification', notif)
        else:
            emit('authenticated', {'success': False})

    @socketio.on('join_order_chat')
    def handle_join_order_chat(data):
        order_id = data.get('order_id')
        token_raw = (data.get('token') or '')
        uid = None

        if token_raw.startswith("Bearer "):
            id_token = token_raw.split(" ", 1)[1]
            try:
                decoded = fb_auth.verify_id_token(id_token)
                uid = decoded.get("uid")
            except Exception:
                emit('error', {'message': 'Unauthorized'})
                return
        elif app.config.get("DEBUG") and token_raw.startswith("Token "):
            uid = token_raw.split(" ", 1)[1]
        else:
            emit('error', {'message': 'Unauthorized'})
            return

        order = get_order(order_id)
        if not order:
            emit('error', {'message': 'Order not found'})
            return
        if uid not in [order['customer_id'], order.get('producer_id')]:
            user = get_user(uid)
            if not user or user.get('role') != 'admin':
                emit('error', {'message': 'Unauthorized'})
                return
        join_room(f"order_{order_id}")
        emit('joined_order_chat', {'order_id': order_id})

    @socketio.on('leave_order_chat')
    def handle_leave_order_chat(data):
        order_id = data.get('order_id')
        leave_room(f"order_{order_id}")
        emit('left_order_chat', {'order_id': order_id})

    # ---------- JINJA FILTERS ----------
    @app.template_filter('tl')
    def jinja_tl(amount):
        return format_try(amount)

    @app.template_filter('dt')
    def jinja_dt(iso_str):
        return format_datetime_tr(iso_str, with_time=True)

    @app.template_filter('rel')
    def jinja_rel(iso_str):
        return format_timedelta_tr(iso_str)

    # ---------- ERROR HANDLERS ----------
    @app.errorhandler(413)
    @app.errorhandler(RequestEntityTooLarge)
    def handle_file_too_large(e):
        return jsonify({"error": "File too large"}), 413

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(500)
    def internal_error(e):
        logger.error(f"Internal server error: {e}")
        return jsonify({"error": "Internal server error"}), 500

    # ---------- CLEANUP TASKS ----------
    def cleanup_old_orders():
        cutoff_date = (datetime.utcnow() - timedelta(days=30)).isoformat()
        old_orders = app.db.collection("orders") \
            .where("payment_status", "==", "unpaid") \
            .where("created_at", "<", cutoff_date) \
            .stream()
        count = 0
        for order_doc in old_orders:
            order = order_doc.to_dict()
            if order.get('status') in ['pending', 'accepted']:
                app.db.collection("orders").document(order_doc.id).update({
                    "status": "cancelled",
                    "cancelled_reason": "Payment timeout",
                    "cancelled_at": now_iso()
                })
                count += 1
        logger.info(f"Cleaned up {count} old unpaid orders")

    def archive_old_photos():
        cutoff_date = (datetime.utcnow() - timedelta(days=90)).isoformat()
        old_photos = app.db.collection("photos") \
            .where("uploaded_at", "<", cutoff_date) \
            .where("archived", "==", False) \
            .stream()
        for photo_doc in old_photos:
            app.db.collection("photos").document(photo_doc.id).update({
                "archived": True,
                "archived_at": now_iso()
            })

    def run_scheduled_tasks():
        while True:
            time.sleep(3600)
            try:
                cleanup_old_orders()
                archive_old_photos()
            except Exception as e:
                logger.error(f"Scheduled task error: {e}")

    if not app.config['DEBUG']:
        task_thread = threading.Thread(target=run_scheduled_tasks, daemon=True)
        task_thread.start()

    return app, socketio

# ---------- MAIN ----------
if __name__ == "__main__":
    app, socketio = create_app()
    logger.info(f"3D Printing Marketplace starting on {app.config['HOST']}:{app.config['PORT']}")
    socketio.run(app, host=app.config['HOST'], port=app.config['PORT'], debug=app.config['DEBUG'])
    CORS(app, resources={r"/*": {"origins": [r"http://localhost:\d+", r"http://127.0.0.1:\d+"]}}, supports_credentials=False)
