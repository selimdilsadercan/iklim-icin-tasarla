# -*- coding: utf-8 -*-
import json
import os
import re
import sys
import time
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd
import questionary
import requests
from dotenv import load_dotenv
from tqdm import tqdm

from engine.feature_extractor import FeatureExtractor
from engine.scorer import Scorer
from reports.generator import ReportGenerator
from utils.data_handler import DataHandler


SCRIPT_DIR = Path(__file__).resolve().parent
load_dotenv(SCRIPT_DIR / ".env")
load_dotenv()

BACKEND_URL = os.environ.get("BACKEND_URL", "https://staging-iklim-bu6i.encr.app")
OUTPUT_DIR = SCRIPT_DIR / os.environ.get("LOCAL_OUTPUT_DIR", "outputs")
CHECKPOINT_DIR = OUTPUT_DIR / "checkpoints"
MAX_LLM_ATTEMPTS = int(os.environ.get("LOCAL_LLM_MAX_ATTEMPTS", "4"))
LLM_BACKOFF_SECONDS = float(os.environ.get("LOCAL_LLM_BACKOFF_SECONDS", "2"))
REQUEST_TIMEOUT_SECONDS = int(os.environ.get("LOCAL_REQUEST_TIMEOUT_SECONDS", "30"))


STYLE = questionary.Style([
    ("qmark", "fg:#673ab7 bold"),
    ("question", "bold"),
    ("answer", "fg:#f44336 bold"),
    ("pointer", "fg:#673ab7 bold"),
    ("highlighted", "fg:#673ab7 bold"),
    ("selected", "fg:#4caf50"),
    ("separator", "fg:#cc5454"),
    ("instruction", "fg:#888888 italic"),
])


class CheckpointedRunError(Exception):
    """Raised after the current run has been safely checkpointed."""


def configure_console_encoding() -> None:
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            try:
                stream.reconfigure(encoding="utf-8", errors="replace")
            except Exception:
                pass


def now_iso() -> str:
    return datetime.now().isoformat(timespec="seconds")


def slugify(value: str, fallback: str = "run") -> str:
    slug = re.sub(r"[^a-zA-Z0-9._-]+", "_", value).strip("._-")
    return slug.lower() or fallback


def get_date_range(preset: str) -> Tuple[str, str]:
    today = datetime.now()
    today_str = today.strftime("%Y-%m-%d")

    if preset == "Bugun":
        return today_str, today_str
    if preset == "Bu Hafta":
        start = today - timedelta(days=today.weekday())
        return start.strftime("%Y-%m-%d"), today_str
    if preset == "Bu Ay":
        start = today.replace(day=1)
        return start.strftime("%Y-%m-%d"), today_str
    if preset == "Tum Zamanlar (2024'ten beri)":
        return "2024-01-01", today_str
    return "2024-01-01", today_str


def read_json(path: Path, default: Any = None) -> Any:
    if not path.exists():
        return default
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def write_json_atomic(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = path.with_suffix(path.suffix + ".tmp")
    with tmp_path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(tmp_path, path)


def append_jsonl(path: Path, item: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(item, ensure_ascii=False) + "\n")


def checkpoint_meta_path(checkpoint_dir: Path) -> Path:
    return checkpoint_dir / "checkpoint.json"


def checkpoint_messages_path(checkpoint_dir: Path) -> Path:
    return checkpoint_dir / "messages.json"


def checkpoint_results_path(checkpoint_dir: Path) -> Path:
    return checkpoint_dir / "message_results.jsonl"


def load_checkpoint_results(checkpoint_dir: Path) -> Dict[str, Dict[str, Any]]:
    results: Dict[str, Dict[str, Any]] = {}
    path = checkpoint_results_path(checkpoint_dir)
    if not path.exists():
        return results

    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            item = json.loads(line)
            results[str(item["message_id"])] = item

    return results


def save_checkpoint_metadata(checkpoint_dir: Path, metadata: Dict[str, Any]) -> None:
    metadata["updated_at"] = now_iso()
    write_json_atomic(checkpoint_meta_path(checkpoint_dir), metadata)


def checkpoint_title(metadata: Dict[str, Any]) -> str:
    selected = ", ".join(c.get("name", "?") for c in metadata.get("selected_classes", []))
    done = metadata.get("completed_student_messages", 0)
    total = metadata.get("student_message_count", 0)
    status = metadata.get("status", "unknown")
    dates = f"{metadata.get('start_date')}..{metadata.get('end_date')}"
    updated = metadata.get("updated_at", "?")
    return f"{status} | {done}/{total} messages | {dates} | {selected} | updated {updated}"


def list_resumable_checkpoints() -> List[Dict[str, Any]]:
    if not CHECKPOINT_DIR.exists():
        return []

    checkpoints: List[Dict[str, Any]] = []
    for path in CHECKPOINT_DIR.glob("*/checkpoint.json"):
        metadata = read_json(path, {})
        if metadata.get("status") not in {"running", "interrupted"}:
            continue
        metadata["_checkpoint_dir"] = str(path.parent)
        checkpoints.append(metadata)

    checkpoints.sort(key=lambda item: item.get("updated_at", ""), reverse=True)
    return checkpoints


def choose_checkpoint_to_resume() -> Optional[Path]:
    checkpoints = list_resumable_checkpoints()
    if not checkpoints:
        return None

    choices = [
        questionary.Choice(title=checkpoint_title(meta), value=meta)
        for meta in checkpoints[:10]
    ]
    choices.extend([
        questionary.Choice(title="Start a new run", value=None),
        questionary.Choice(title="Quit", value="__quit__"),
    ])

    selection = questionary.select(
        "Unfinished checkpoint found. Continue from one of these?",
        choices=choices,
        style=STYLE,
    ).ask()

    if selection == "__quit__":
        raise SystemExit
    if selection is None:
        return None
    return Path(selection["_checkpoint_dir"])


def fetch_json(method: str, path: str, **kwargs: Any) -> Dict[str, Any]:
    response = requests.request(
        method,
        f"{BACKEND_URL}{path}",
        timeout=kwargs.pop("timeout", REQUEST_TIMEOUT_SECONDS),
        **kwargs,
    )
    response.raise_for_status()
    return response.json() if response.content else {}


def fetch_classes() -> List[Dict[str, Any]]:
    data = fetch_json("GET", "/classes", timeout=10)
    return data.get("classes", [])


def select_classes(classes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    choices = [
        questionary.Choice(
            title=f"{item['name']} ({item.get('student_count', 0)} ogrenci)",
            value=item,
        )
        for item in classes
    ]
    selected = questionary.checkbox(
        "Analiz edilecek siniflari secin:",
        choices=choices,
        style=STYLE,
        instruction="(Bosluk ile secin, Enter ile onaylayin)",
    ).ask()
    return selected or []


def select_date_range(selected_classes: List[Dict[str, Any]]) -> Tuple[str, str]:
    print("\nTarih araliklari icin mesaj sayilari hesaplaniyor...")

    presets = ["Bugun", "Bu Hafta", "Bu Ay", "Tum Zamanlar (2024'ten beri)"]
    choices = []
    for preset in presets:
        start_date, end_date = get_date_range(preset)
        total_messages = 0
        for cls in selected_classes:
            try:
                data = fetch_json(
                    "GET",
                    f"/classes/{cls['id']}/students",
                    params={"startDate": start_date, "endDate": end_date},
                    timeout=10,
                )
                total_messages += sum(
                    student.get("total_conversations", 0)
                    for student in data.get("students", [])
                )
            except Exception:
                pass

        choices.append(questionary.Choice(
            title=f"{preset} ({total_messages} mesaj)",
            value=preset,
        ))

    choices.append(questionary.Choice(title="Ozel Tarih Araligi", value="Ozel Tarih Araligi"))
    preset = questionary.select("Tarih araligi secin:", choices=choices, style=STYLE).ask()

    if preset == "Ozel Tarih Araligi":
        today_str = datetime.now().strftime("%Y-%m-%d")
        start_date = questionary.text(
            "Baslangic Tarihi (YYYY-MM-DD):",
            default="2024-01-01",
            style=STYLE,
        ).ask()
        end_date = questionary.text(
            "Bitis Tarihi (YYYY-MM-DD):",
            default=today_str,
            style=STYLE,
        ).ask()
        return start_date, end_date

    return get_date_range(preset)


def preview_active_students(
    selected_classes: List[Dict[str, Any]],
    start_date: str,
    end_date: str,
) -> Tuple[List[Dict[str, Any]], int]:
    active_students: List[Dict[str, Any]] = []
    total_messages = 0

    print("\nVeriler taraniyor...")
    for cls in selected_classes:
        try:
            data = fetch_json(
                "GET",
                f"/classes/{cls['id']}/students",
                params={"startDate": start_date, "endDate": end_date},
                timeout=15,
            )
            students = data.get("students", [])
            class_message_count = sum(s.get("total_conversations", 0) for s in students)
            class_active = [s for s in students if s.get("total_conversations", 0) > 0]

            for student in class_active:
                student["class_id"] = cls["id"]
                student["class_name"] = cls["name"]

            active_students.extend(class_active)
            total_messages += class_message_count
            print(f"  OK {cls['name']}: {len(class_active)} aktif ogrenci, {class_message_count} mesaj")
        except Exception as exc:
            print(f"  ERROR {cls['name']} verileri alinamadi: {exc}")

    return active_students, total_messages


def choose_students_for_run(active_students: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not active_students:
        return []

    should_filter = questionary.confirm(
        "Belirli ogrencileri secmek ister misiniz? (Hayir = tum aktif ogrenciler)",
        default=False,
        style=STYLE,
    ).ask()

    if not should_filter:
        return active_students

    grouped_students: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for student in active_students:
        grouped_students[student.get("class_name", "Bilinmiyor")].append(student)

    selected_students: List[Dict[str, Any]] = []
    for class_name, students in grouped_students.items():
        sorted_students = sorted(
            students,
            key=lambda item: (str(item.get("display_name") or ""), str(item.get("user_id") or "")),
        )
        choices = [
            questionary.Choice(
                title=(
                    f"{student.get('display_name') or student.get('email') or student.get('user_id')} "
                    f"({student.get('total_conversations', 0)} mesaj)"
                ),
                value=student,
                checked=False,
            )
            for student in sorted_students
        ]

        picked = questionary.checkbox(
            f"{class_name} icin analiz edilecek ogrenciler:",
            choices=choices,
            style=STYLE,
            instruction="(Varsayilan: hicbiri secili degil. Bosluk ile secin, Enter ile onaylayin)",
        ).ask()
        selected_students.extend(picked or [])

    return selected_students


def download_messages(
    selected_classes: List[Dict[str, Any]],
    active_students: List[Dict[str, Any]],
    start_date: str,
    end_date: str,
) -> Tuple[List[Dict[str, Any]], List[str]]:
    all_messages: List[Dict[str, Any]] = []
    job_ids: List[str] = []

    for cls in selected_classes:
        class_student_ids = [
            student["user_id"]
            for student in active_students
            if student.get("class_id") == cls["id"]
        ]
        if not class_student_ids:
            continue

        print(f"\n{cls['name']} icin mesajlar indiriliyor...")
        job_payload = {
            "classId": cls["id"],
            "studentIds": class_student_ids,
            "startDate": start_date,
            "endDate": end_date,
        }
        job_data = fetch_json("POST", "/batch/jobs", json=job_payload, timeout=15)
        job_id = job_data["id"]
        job_ids.append(job_id)

        msg_data = fetch_json("GET", f"/batch/jobs/{job_id}/messages", timeout=REQUEST_TIMEOUT_SECONDS)
        class_messages = msg_data.get("messages", [])
        for message in class_messages:
            message["class_id"] = cls["id"]
            message["class_name"] = cls["name"]

        all_messages.extend(class_messages)
        print(f"  OK {len(class_messages)} mesaj indirildi. Job: {job_id}")

        try:
            fetch_json(
                "PATCH",
                f"/batch/jobs/{job_id}/status",
                json={"id": job_id, "status": "completed"},
                timeout=10,
            )
        except Exception as exc:
            print(f"  WARN gecici job tamamlandi olarak isaretlenemedi: {exc}")

    return all_messages, job_ids


def create_checkpoint(
    selected_classes: List[Dict[str, Any]],
    start_date: str,
    end_date: str,
    messages: List[Dict[str, Any]],
    job_ids: List[str],
) -> Tuple[Path, Dict[str, Any]]:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    class_slug = slugify("_".join(cls["name"] for cls in selected_classes), "classes")[:80]
    run_id = f"{timestamp}_{class_slug}"
    checkpoint_dir = CHECKPOINT_DIR / run_id
    output_dir = OUTPUT_DIR / f"batch_{run_id}"
    student_message_count = sum(1 for item in messages if item.get("is_user"))

    metadata = {
        "run_id": run_id,
        "status": "running",
        "created_at": now_iso(),
        "updated_at": now_iso(),
        "backend_url": BACKEND_URL,
        "start_date": start_date,
        "end_date": end_date,
        "selected_classes": [{"id": c["id"], "name": c["name"]} for c in selected_classes],
        "backend_job_ids": job_ids,
        "message_count": len(messages),
        "student_message_count": student_message_count,
        "completed_student_messages": 0,
        "output_dir": str(output_dir),
        "last_error": None,
        "last_message_id": None,
        "max_llm_attempts": MAX_LLM_ATTEMPTS,
    }

    checkpoint_dir.mkdir(parents=True, exist_ok=True)
    write_json_atomic(checkpoint_messages_path(checkpoint_dir), messages)
    save_checkpoint_metadata(checkpoint_dir, metadata)
    return checkpoint_dir, metadata


def load_checkpoint(checkpoint_dir: Path) -> Tuple[Dict[str, Any], List[Dict[str, Any]], Dict[str, Dict[str, Any]]]:
    metadata = read_json(checkpoint_meta_path(checkpoint_dir), {})
    messages = read_json(checkpoint_messages_path(checkpoint_dir), [])
    results = load_checkpoint_results(checkpoint_dir)
    metadata["completed_student_messages"] = len(results)
    save_checkpoint_metadata(checkpoint_dir, metadata)
    return metadata, messages, results


def get_message_id(message: Dict[str, Any], index: int) -> str:
    return str(message.get("id") or f"local-{index}")


def get_student_id(message: Dict[str, Any]) -> str:
    return str(message.get("user_id") or message.get("student_id") or "unknown")


def is_retryable_error(exc: Exception) -> bool:
    text = str(exc).lower()
    non_retryable = [
        "api key",
        "authentication",
        "permission",
        "invalid x-api-key",
        "unauthorized",
        "credit balance",
        "billing",
    ]
    return not any(marker in text for marker in non_retryable)


def score_with_retries(
    scorer: Scorer,
    message: str,
    features: Dict[str, Any],
    score_type: str,
) -> Dict[str, Any]:
    for attempt in range(1, MAX_LLM_ATTEMPTS + 1):
        try:
            result = scorer.score_with_llm(message, features, score_type)
            if result.get("method") != "llm":
                raise RuntimeError(f"{score_type} returned non-LLM method: {result.get('method')}")
            return result
        except Exception as exc:
            if attempt >= MAX_LLM_ATTEMPTS or not is_retryable_error(exc):
                raise

            wait_seconds = min(60.0, LLM_BACKOFF_SECONDS * (2 ** (attempt - 1)))
            tqdm.write(
                f"WARN {score_type} attempt {attempt}/{MAX_LLM_ATTEMPTS} failed: {exc}. "
                f"Retrying in {wait_seconds:.1f}s..."
            )
            time.sleep(wait_seconds)

    raise RuntimeError(f"{score_type} scoring failed unexpectedly.")


def build_components() -> Tuple[FeatureExtractor, Scorer, ReportGenerator]:
    knowledge_path = SCRIPT_DIR / "knowledge_components.json"
    basic, advanced = DataHandler.load_knowledge_components(str(knowledge_path))
    extractor = FeatureExtractor(basic_terms=basic, advanced_terms=advanced)
    scorer = Scorer(fallback_on_error=False)
    reporter = ReportGenerator(scorer)
    return extractor, scorer, reporter


def evaluate_messages(
    checkpoint_dir: Path,
    metadata: Dict[str, Any],
    messages: List[Dict[str, Any]],
    completed_results: Dict[str, Dict[str, Any]],
) -> Tuple[Dict[str, Dict[str, Any]], ReportGenerator]:
    extractor, scorer, reporter = build_components()
    student_messages = [item for item in messages if item.get("is_user")]
    metadata["student_message_count"] = len(student_messages)
    metadata["completed_student_messages"] = len(completed_results)
    metadata["status"] = "running"
    save_checkpoint_metadata(checkpoint_dir, metadata)

    print("\nAnaliz ayarlari")
    print(f"  Model: {scorer.model}")
    print(f"  Max LLM attempts: {MAX_LLM_ATTEMPTS}")
    print(f"  Checkpoint: {checkpoint_dir}")
    print(f"  Output: {metadata['output_dir']}")
    print(f"  Already completed: {len(completed_results)} / {len(student_messages)}")

    progress = tqdm(student_messages, desc="Analiz ediliyor", unit="msg")
    for index, item in enumerate(progress):
        message_id = get_message_id(item, index)
        if message_id in completed_results:
            continue

        message_text = str(item.get("message", ""))
        features = extractor.extract_features(message_text)
        student_id = get_student_id(item)

        try:
            content_result = score_with_retries(scorer, message_text, features, "content")
            dialog_result = score_with_retries(scorer, message_text, features, "dialog")
        except Exception as exc:
            metadata.update({
                "status": "interrupted",
                "completed_student_messages": len(completed_results),
                "last_error": str(exc),
                "last_message_id": message_id,
            })
            save_checkpoint_metadata(checkpoint_dir, metadata)
            print("\nERROR LLM scoring failed after retries.")
            print(f"Checkpoint saved: {checkpoint_dir}")
            print(f"Failed message id: {message_id}")
            print(f"Reason: {exc}")
            raise CheckpointedRunError(str(exc)) from exc

        result = {
            "message_id": message_id,
            "student_id": student_id,
            "student_name": item.get("display_name") or "Bilinmeyen",
            "class_id": item.get("class_id"),
            "class_name": item.get("class_name") or "Bilinmiyor",
            "message": message_text,
            "features": features,
            "content_result": content_result,
            "dialog_result": dialog_result,
            "created_at": item.get("created_at"),
            "evaluated_at": now_iso(),
        }

        append_jsonl(checkpoint_results_path(checkpoint_dir), result)
        completed_results[message_id] = result
        metadata.update({
            "completed_student_messages": len(completed_results),
            "last_error": None,
            "last_message_id": message_id,
        })
        save_checkpoint_metadata(checkpoint_dir, metadata)

    return completed_results, reporter


def result_to_row(result: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "Sender": "student",
        "Student": result.get("student_name", "Bilinmeyen"),
        "Message": result.get("message", ""),
        "content_label": result.get("content_result", {}).get("score"),
        "dialog_label": result.get("dialog_result", {}).get("score"),
        "content_reasoning": result.get("content_result", {}).get("reasoning"),
        "dialog_reasoning": result.get("dialog_result", {}).get("reasoning"),
        "class_name": result.get("class_name", "Bilinmiyor"),
        "message_id": result.get("message_id"),
        "student_id": result.get("student_id"),
    }


def write_reports(
    metadata: Dict[str, Any],
    results: Dict[str, Dict[str, Any]],
    reporter: ReportGenerator,
) -> List[Dict[str, Any]]:
    output_dir = Path(metadata["output_dir"])
    output_dir.mkdir(parents=True, exist_ok=True)

    rows = [result_to_row(item) for item in results.values()]
    if not rows:
        print("No completed message results found; reports were not generated.")
        return []

    labeled_path = output_dir / "labeled_messages.csv"
    pd.DataFrame(rows).to_csv(labeled_path, index=False, encoding="utf-8-sig")

    student_rows: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for row in rows:
        student_rows[str(row["student_id"])].append(row)

    print("\nRaporlar olusturuluyor...")
    reports = []
    for student_id, items in student_rows.items():
        student_name = items[0]["Student"]
        class_name = items[0].get("class_name", "Bilinmiyor")
        student_df = pd.DataFrame(items)
        report = reporter.generate_final_report(
            student_df,
            student_name,
            {"school": None, "class": class_name},
        )
        reports.append(report)

        safe_name = slugify(f"{class_name}_{student_name}", fallback=str(student_id))
        report_path = output_dir / f"{safe_name}.json"
        write_json_atomic(report_path, report)

    summary_path = output_dir / "summary.json"
    write_json_atomic(summary_path, reports)

    print(f"  Labeled CSV: {labeled_path}")
    print(f"  Summary: {summary_path}")
    return reports


def start_new_run() -> Optional[Tuple[Path, Dict[str, Any], List[Dict[str, Any]], Dict[str, Dict[str, Any]]]]:
    print("Sinif listesi aliniyor...")
    try:
        classes = fetch_classes()
    except Exception as exc:
        print(f"ERROR Siniflar alinamadi: {exc}")
        return None

    if not classes:
        print("ERROR Hic sinif bulunamadi.")
        return None

    selected_classes = select_classes(classes)
    if not selected_classes:
        print("Hicbir sinif secilmedi. Cikiliyor.")
        return None

    start_date, end_date = select_date_range(selected_classes)
    print(f"\nSecilen aralik: {start_date} - {end_date}")

    active_students, total_messages = preview_active_students(selected_classes, start_date, end_date)
    if total_messages == 0:
        print("\nSecilen siniflarda ve tarih araliginda hic mesaj bulunamadi.")
        return None

    selected_students = choose_students_for_run(active_students)
    if not selected_students:
        print("Analiz edilecek ogrenci secilmedi. Cikiliyor.")
        return None

    selected_message_estimate = sum(student.get("total_conversations", 0) for student in selected_students)

    print("\n" + "-" * 40)
    print("Toplam ozet")
    print(f"  Aktif ogrenci: {len(active_students)}")
    print(f"  Secilen ogrenci: {len(selected_students)}")
    print(f"  Tahmini toplam mesaj: {selected_message_estimate}")
    print("-" * 40)

    should_start = questionary.confirm(
        "Analizi baslatmak istiyor musunuz?",
        default=True,
        style=STYLE,
    ).ask()
    if not should_start:
        print("Islem iptal edildi.")
        return None

    messages, job_ids = download_messages(selected_classes, selected_students, start_date, end_date)
    if not messages:
        print("Hic mesaj indirilemedi.")
        return None

    student_messages = [item for item in messages if item.get("is_user")]
    print(f"\nToplam {len(messages)} mesaj indirildi.")
    print(f"Analiz edilecek ogrenci mesaji: {len(student_messages)}")

    checkpoint_dir, metadata = create_checkpoint(
        selected_classes,
        start_date,
        end_date,
        messages,
        job_ids,
    )
    return checkpoint_dir, metadata, messages, {}


def run_local_evaluator() -> None:
    configure_console_encoding()
    print("\n" + "=" * 58)
    print("IKLIM-EVAL YEREL ANALIZ ARACI")
    print("=" * 58)
    print(f"Backend: {BACKEND_URL}")
    print(f"Outputs: {OUTPUT_DIR}")
    print(f"Checkpoints: {CHECKPOINT_DIR}\n")

    checkpoint_dir = choose_checkpoint_to_resume()
    if checkpoint_dir:
        print(f"Checkpoint yukleniyor: {checkpoint_dir}")
        metadata, messages, completed_results = load_checkpoint(checkpoint_dir)
    else:
        started = start_new_run()
        if not started:
            return
        checkpoint_dir, metadata, messages, completed_results = started

    try:
        completed_results, reporter = evaluate_messages(
            checkpoint_dir,
            metadata,
            messages,
            completed_results,
        )
    except KeyboardInterrupt:
        metadata.update({
            "status": "interrupted",
            "completed_student_messages": len(completed_results),
            "last_error": "KeyboardInterrupt",
        })
        save_checkpoint_metadata(checkpoint_dir, metadata)
        print(f"\nInterrupted. Checkpoint saved: {checkpoint_dir}")
        return
    except CheckpointedRunError:
        return

    reports = write_reports(metadata, completed_results, reporter)
    metadata.update({
        "status": "completed",
        "completed_student_messages": len(completed_results),
        "report_count": len(reports),
        "last_error": None,
    })
    save_checkpoint_metadata(checkpoint_dir, metadata)

    print("\nAnaliz tamamlandi.")
    print(f"Output dir: {metadata['output_dir']}")
    print(f"Checkpoint: {checkpoint_dir}")
    print(f"Toplam ogrenci raporu: {len(reports)}")


if __name__ == "__main__":
    run_local_evaluator()
