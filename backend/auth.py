# auth.py
import hashlib
import json
import os
import secrets
from datetime import datetime, timedelta
from jose import jwt, JWTError
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

ALGORITHM = "HS256"

security = HTTPBearer()

# 凭据存储文件（gitignore，首次运行自动生成）
AUTH_FILE = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "auth_data.json"
)

# 默认账号（仅用于初始化凭据文件）
DEFAULT_USERNAME = "admin"
DEFAULT_PASSWORD = "123456"


def _hash_password(password: str, salt: str) -> str:
    """PBKDF2-SHA256，100k 次迭代"""
    return hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        bytes.fromhex(salt),
        100_000,
    ).hex()


def load_credentials():
    """读取凭据；文件不存在或损坏时用默认账号初始化"""
    try:
        with open(AUTH_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        if data.get("username") and data.get("salt") and data.get("password_hash"):
            # 旧版凭据文件无 secret_key 则补生成（懒迁移）
            if not data.get("secret_key"):
                data["secret_key"] = secrets.token_hex(32)
                save_credentials(data)
            return data
    except (FileNotFoundError, json.JSONDecodeError, OSError, ValueError):
        pass

    salt = secrets.token_hex(16)
    data = {
        "username": DEFAULT_USERNAME,
        "salt": salt,
        "password_hash": _hash_password(DEFAULT_PASSWORD, salt),
        # JWT 签名密钥：首次运行随机生成并持久化，重启后 token 仍有效，
        # 且不会随代码进入 git 仓库
        "secret_key": secrets.token_hex(32),
    }
    save_credentials(data)
    return data


def save_credentials(data):
    """原子写入凭据文件（临时文件 + os.replace）"""
    tmp_path = AUTH_FILE + ".tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(tmp_path, AUTH_FILE)


def verify_user(username: str, password: str) -> bool:
    data = load_credentials()
    if username != data["username"]:
        return False
    return _hash_password(password, data["salt"]) == data["password_hash"]


def change_password(old_password: str, new_password: str):
    """校验旧密码后更新为新哈希；旧密码错误抛 ValueError"""
    data = load_credentials()
    if _hash_password(old_password, data["salt"]) != data["password_hash"]:
        raise ValueError("旧密码错误")

    salt = secrets.token_hex(16)
    data["salt"] = salt
    data["password_hash"] = _hash_password(new_password, salt)
    save_credentials(data)


def create_token(username: str):
    expire = datetime.utcnow() + timedelta(hours=12)
    payload = {
        "sub": username,
        "exp": expire
    }
    return jwt.encode(
        payload, load_credentials()["secret_key"], algorithm=ALGORITHM
    )


def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            load_credentials()["secret_key"],
            algorithms=[ALGORITHM],
        )
        return payload["sub"]
    except JWTError:
        raise HTTPException(status_code=401, detail="Token 无效")
