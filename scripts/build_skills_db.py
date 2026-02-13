"""
Arknights Base Skills Database Builder
Downloads raw game data from Kengxxiao/ArknightsGameData_YoStar
and produces a clean public/db/base_skills.json for the web app.

Usage:
    python scripts/build_skills_db.py
"""

import json
import os
import re
import urllib.request

BASE_URL = "https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData_YoStar/main/en_US/gamedata/excel"

CACHE_DIR = os.path.join(os.path.dirname(__file__), ".cache")
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "public", "db", "base_skills.json")

ROOM_TYPE_MAP = {
    "MANUFACTURE": "Factory",
    "TRADING": "Trading",
    "POWER": "Power",
    "DORMITORY": "Dormitory",
    "WORKSHOP": "Workshop",
    "TRAINING": "Training",
    "CONTROL": "Command",
    "MEETING": "Reception",
    "HIRE": "Office",
}

PHASE_MAP = {
    "PHASE_0": 0,
    "PHASE_1": 1,
    "PHASE_2": 2,
}

# Parse rarity strings like "TIER_1" -> 1, "TIER_6" -> 6
RARITY_RE = re.compile(r"TIER_(\d+)")


def download_json(filename: str) -> dict:
    """Download a JSON file from the game data repo, with local caching."""
    os.makedirs(CACHE_DIR, exist_ok=True)
    cache_path = os.path.join(CACHE_DIR, filename)

    if os.path.exists(cache_path):
        print(f"  [cache] {filename}")
        with open(cache_path, "r", encoding="utf-8") as f:
            return json.load(f)

    url = f"{BASE_URL}/{filename}"
    print(f"  [download] {url}")
    req = urllib.request.Request(url, headers={"User-Agent": "AK-Base-Calc/1.0"})
    with urllib.request.urlopen(req) as resp:
        data = resp.read().decode("utf-8")

    with open(cache_path, "w", encoding="utf-8") as f:
        f.write(data)

    return json.loads(data)


def parse_rarity(rarity_str) -> int:
    """Convert rarity field to integer (1-6)."""
    if isinstance(rarity_str, int):
        return rarity_str
    m = RARITY_RE.search(str(rarity_str))
    if m:
        return int(m.group(1))
    return 1


def strip_tags(text: str) -> str:
    """Remove game markup tags like <@cc.vup>, </>, <$cc.xxx> from descriptions."""
    text = re.sub(r"<[^>]*>", "", text)
    return text.strip()


def build_skills_db():
    print("Downloading game data...")
    building_data = download_json("building_data.json")
    char_table = download_json("character_table.json")

    # Build charId -> name + rarity mapping
    char_names: dict[str, str] = {}
    char_rarities: dict[str, int] = {}
    for char_id, char_info in char_table.items():
        if not isinstance(char_info, dict):
            continue
        name = char_info.get("name")
        if name and "#" not in char_id:
            char_names[char_id] = name
            char_rarities[char_id] = parse_rarity(char_info.get("rarity", "TIER_1"))

    # Index all buff definitions by buffId
    buff_defs: dict[str, dict] = {}
    raw_buffs = building_data.get("buffs", {})
    for buff_id, buff_info in raw_buffs.items():
        if isinstance(buff_info, dict):
            buff_defs[buff_id] = buff_info

    print(f"  Found {len(buff_defs)} buff definitions")

    # Parse character base skills
    chars_data = building_data.get("chars", {})
    skills_db: dict[str, dict] = {}

    for char_id, char_info in chars_data.items():
        if not isinstance(char_info, dict):
            continue

        name = char_names.get(char_id)
        if not name:
            continue

        rarity = char_rarities.get(char_id, 1)
        operator_skills: dict[str, list] = {"E0": [], "E1": [], "E2": []}

        buff_chars = char_info.get("buffChar", [])
        for buff_group in buff_chars:
            if not isinstance(buff_group, dict):
                continue

            buff_data_list = buff_group.get("buffData", [])
            for buff_entry in buff_data_list:
                if not isinstance(buff_entry, dict):
                    continue

                buff_id = buff_entry.get("buffId", "")
                cond = buff_entry.get("cond", {})
                phase = cond.get("phase", "PHASE_0")
                elite = PHASE_MAP.get(phase, 0)
                elite_key = f"E{elite}"

                buff_info = buff_defs.get(buff_id, {})
                buff_name = buff_info.get("buffName", buff_id)
                description = buff_info.get("description", "")
                room_type_raw = buff_info.get("roomType", "")
                room_type = ROOM_TYPE_MAP.get(room_type_raw, room_type_raw)

                # The 'efficiency' field is an integer percentage (15 = +15%)
                efficiency = buff_info.get("efficiency", 0)
                buff_value = efficiency / 100.0 if efficiency else 0.0

                skill_entry = {
                    "skillId": buff_id,
                    "name": buff_name,
                    "room": room_type,
                    "description": strip_tags(description),
                    "value": round(buff_value, 4),
                }

                operator_skills[elite_key].append(skill_entry)

        has_skills = any(len(v) > 0 for v in operator_skills.values())
        if has_skills:
            skills_db[name] = {
                "rarity": rarity,
                "skills": operator_skills,
            }

    # Sort by name
    skills_db = dict(sorted(skills_db.items()))

    # Write output
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(skills_db, f, indent=2, ensure_ascii=False)

    print(f"\nDone! Generated {len(skills_db)} operators -> {OUTPUT_PATH}")
    print(f"File size: {os.path.getsize(OUTPUT_PATH) / 1024:.1f} KB")

    # Stats
    room_counts: dict[str, int] = {}
    skill_count = 0
    for op_data in skills_db.values():
        for elite_skills in op_data["skills"].values():
            for skill in elite_skills:
                skill_count += 1
                room = skill["room"]
                room_counts[room] = room_counts.get(room, 0) + 1

    print(f"Total skills: {skill_count}")
    print("\nSkills by room type:")
    for room, count in sorted(room_counts.items(), key=lambda x: -x[1]):
        print(f"  {room}: {count}")


if __name__ == "__main__":
    build_skills_db()
